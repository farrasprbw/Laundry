/**
 * Receipt Builder — ESC/POS Command Generator
 *
 * Builds a receipt layout using ESC/POS commands for 58mm thermal printers.
 * 58mm paper = ~32 characters per line at normal font size.
 */

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const CMD = {
  /** Initialize printer */
  INIT: new Uint8Array([ESC, 0x40]),

  /** Text alignment */
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),

  /** Font emphasis */
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),

  /** Font size - normal */
  SIZE_NORMAL: new Uint8Array([GS, 0x21, 0x00]),
  /** Font size - double height */
  SIZE_DOUBLE_H: new Uint8Array([GS, 0x21, 0x01]),
  /** Font size - double width */
  SIZE_DOUBLE_W: new Uint8Array([GS, 0x21, 0x10]),
  /** Font size - double width + height */
  SIZE_DOUBLE: new Uint8Array([GS, 0x21, 0x11]),

  /** Underline */
  UNDERLINE_ON: new Uint8Array([ESC, 0x2D, 0x01]),
  UNDERLINE_OFF: new Uint8Array([ESC, 0x2D, 0x00]),

  /** Line feed */
  NEWLINE: new Uint8Array([LF]),

  /** Feed and cut */
  CUT: new Uint8Array([GS, 0x56, 0x00]),
  /** Partial cut */
  PARTIAL_CUT: new Uint8Array([GS, 0x56, 0x01]),
  /** Feed N lines */
  feedLines: (n: number) => new Uint8Array([ESC, 0x64, n]),
} as const;

/** Line width for 58mm paper in characters */
const LINE_WIDTH = 32;

// ── Store Configuration Type ──
export interface StoreConfig {
  name: string;
  address: string;
  phone: string;
  disclaimer: string[];
  qrCodeUrl: string;
}

// ── Receipt Data Interface ──
export interface ReceiptData {
  invoiceNumber: string;
  customerName: string;
  categoryName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  paymentStatus: string;
  discount?: number;
  createdAt: string;
  estimatedDurationDays?: number;
  notes?: string | null;
  parfum?: string;
}

/**
 * ReceiptBuilder — Fluent API for building ESC/POS receipt data
 */
export class ReceiptBuilder {
  private buffer: Uint8Array[] = [];

  constructor() {
    // Initialize printer
    this.raw(CMD.INIT);
  }

  /** Append raw bytes */
  raw(data: Uint8Array): this {
    this.buffer.push(data);
    return this;
  }

  /** Set text alignment */
  align(alignment: 'left' | 'center' | 'right'): this {
    const cmd = alignment === 'center' ? CMD.ALIGN_CENTER
      : alignment === 'right' ? CMD.ALIGN_RIGHT
        : CMD.ALIGN_LEFT;
    return this.raw(cmd);
  }

  /** Toggle bold */
  bold(on: boolean): this {
    return this.raw(on ? CMD.BOLD_ON : CMD.BOLD_OFF);
  }

  /** Set font size */
  fontSize(size: 'normal' | 'double-h' | 'double-w' | 'double'): this {
    const cmd = size === 'double' ? CMD.SIZE_DOUBLE
      : size === 'double-h' ? CMD.SIZE_DOUBLE_H
        : size === 'double-w' ? CMD.SIZE_DOUBLE_W
          : CMD.SIZE_NORMAL;
    return this.raw(cmd);
  }

  /** Add text (without newline) */
  text(content: string): this {
    const encoder = new TextEncoder();
    return this.raw(encoder.encode(content));
  }

  /** Add text with newline */
  line(content: string = ''): this {
    this.text(content);
    return this.raw(CMD.NEWLINE);
  }

  /** Add an empty line */
  emptyLine(): this {
    return this.raw(CMD.NEWLINE);
  }

  /** Add separator line */
  separator(char: string = '-'): this {
    return this.line(char.repeat(LINE_WIDTH));
  }

  /** Add double separator */
  doubleSeparator(): this {
    return this.separator('=');
  }

  /**
   * Add a line with left and right aligned text.
   * e.g., "Subtotal         45,000"
   */
  leftRight(left: string, right: string, fillChar: string = ' '): this {
    const space = LINE_WIDTH - left.length - right.length;
    if (space < 1) {
      // If too long, print on two lines
      this.line(left);
      return this.align('right').line(right).align('left');
    }
    return this.line(left + fillChar.repeat(space) + right);
  }

  /**
   * Add a key-value line.
   * "Tgl Masuk   29/04/2026 11:16"
   */
  keyValue(key: string, value: string): this {
    return this.leftRight(key, value);
  }

  /**
   * Word-wrap long text to fit within LINE_WIDTH.
   */
  wrappedText(content: string, indent: number = 0): this {
    const maxLen = LINE_WIDTH - indent;
    const prefix = ' '.repeat(indent);
    const words = content.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxLen) {
        this.line(prefix + currentLine.trimEnd());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine.trim()) {
      this.line(prefix + currentLine.trimEnd());
    }
    return this;
  }

  /** Generate QR Code (ESC/POS QR command) */
  qrCode(data: string, size: number = 6): this {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const storeLen = encoded.length + 3;
    const storePL = storeLen & 0xFF;
    const storePH = (storeLen >> 8) & 0xFF;

    // QR Code: Model 2
    this.raw(new Uint8Array([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
    // QR Code: Module size
    this.raw(new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]));
    // QR Code: Error correction level (M = 49)
    this.raw(new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]));
    // QR Code: Store data
    this.raw(new Uint8Array([GS, 0x28, 0x6B, storePL, storePH, 0x31, 0x50, 0x30]));
    this.raw(encoded);
    // QR Code: Print
    this.raw(new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));

    return this;
  }

  /** Feed paper and cut */
  feedAndCut(lines: number = 4): this {
    this.raw(CMD.feedLines(lines));
    this.raw(CMD.PARTIAL_CUT);
    return this;
  }

  /** Build the final byte array */
  build(): Uint8Array {
    // Calculate total length
    const totalLength = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of this.buffer) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }
}

// ── Helper Functions ──

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}



/**
 * Build a complete laundry receipt matching the reference photo layout.
 */
export function buildLaundryReceipt(data: ReceiptData, storeConfig: StoreConfig): Uint8Array {
  const rb = new ReceiptBuilder();
  const discount = data.discount ?? 0;
  const total = data.totalPrice - discount;

  // ── Header: Store Info ──
  rb.align('center')
    .bold(true)
    .fontSize('double-h')
    .line(storeConfig.name)
    .fontSize('normal')
    .bold(false);

  rb.line(storeConfig.address)
    .line(storeConfig.phone)
    .doubleSeparator();

  // ── Customer Name ──
  rb.align('center')
    .bold(true)
    .fontSize('double-h')
    .line(data.customerName.toUpperCase())
    .fontSize('normal')
    .bold(false)
    .emptyLine();

  // ── Invoice Barcode / QR ──
  rb.align('center')
    .qrCode(data.invoiceNumber, 5) // Slightly smaller QR code for the invoice number
    .emptyLine();

  // ── Order Info ──
  rb.align('left')
    .keyValue('No. Invoice', data.invoiceNumber)
    .keyValue('Tgl Masuk', formatDateTime(data.createdAt));

  // Estimated completion
  if (data.estimatedDurationDays) {
    const d = new Date(data.createdAt);
    d.setDate(d.getDate() + (data.estimatedDurationDays - 1));
    d.setHours(17, 0, 0, 0);
    rb.keyValue('Est Selesai', formatDateTime(d.toISOString()));
  }

  rb.separator();

  // ── Category & Item ──
  rb.bold(true)
    .wrappedText(data.categoryName)
    .bold(false);

  const qtyLine = `${data.quantity} ${data.unit} x ${formatCurrency(data.pricePerUnit)}`;
  const priceStr = formatCurrency(data.totalPrice);
  rb.leftRight(qtyLine, priceStr);

  rb.emptyLine();

  // ── Totals ──
  rb.leftRight('Diskon', formatCurrency(discount));

  rb.bold(true);
  rb.leftRight('Total', formatCurrency(total));
  rb.bold(false);

  rb.emptyLine();

  // ── Payment Status ──
  const statusLabel = data.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM BAYAR';
  rb.align('center')
    .bold(true)
    .fontSize('double-h')
    .line(`[ ${statusLabel} ]`)
    .fontSize('normal')
    .bold(false)
    .align('left');

  rb.separator();

  // ── Keterangan ──
  rb.bold(true)
    .line('Keterangan :')
    .bold(false);

  if (data.parfum) {
    rb.line(`Parfum : ${data.parfum}`);
  }

  rb.emptyLine();

  // Disclaimer items
  storeConfig.disclaimer.forEach((item) => {
    rb.wrappedText(`- ${item}`, 2);
  });

  rb.emptyLine();

  // ── Footer ──
  rb.align('center')
    .bold(true)
    .line('Terima kasih')
    .bold(false)
    .doubleSeparator();

  // ── QR Code ──
  rb.align('center')
    .qrCode(storeConfig.qrCodeUrl, 6)
    .emptyLine();

  // Feed and cut
  rb.feedAndCut(5);

  return rb.build();
}

