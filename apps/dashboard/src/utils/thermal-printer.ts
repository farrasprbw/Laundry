/**
 * Bluetooth Thermal Printer — Web Bluetooth API + ESC/POS
 *
 * Handles BLE connection to thermal printers and raw data transmission.
 * Printer must support Bluetooth Low Energy (BLE).
 * Only works in Chrome/Edge with HTTPS or localhost.
 */

// Common BLE Service UUIDs for thermal printers
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip BLE
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
];

const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb', // Common write characteristic
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip write
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Nordic UART TX
];

const STORAGE_KEY = 'laundry_printer_device_id';
const MAX_CHUNK_SIZE = 100; // BLE max write size per packet

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

export interface PrinterEventMap {
  statusChange: PrinterStatus;
  error: string;
}

type EventCallback<T> = (data: T) => void;

export class BluetoothPrinter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _status: PrinterStatus = 'disconnected';
  private listeners = {
    statusChange: new Set<EventCallback<PrinterStatus>>(),
    error: new Set<EventCallback<string>>(),
  };

  /** Check if Web Bluetooth is supported */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /** Get current printer status */
  get status(): PrinterStatus {
    return this._status;
  }

  /** Get connected device name */
  get deviceName(): string | null {
    return this.device?.name ?? null;
  }

  /** Check if connected */
  get isConnected(): boolean {
    return this._status === 'connected' || this._status === 'printing';
  }

  /** Subscribe to events */
  on<K extends keyof PrinterEventMap>(event: K, callback: EventCallback<PrinterEventMap[K]>): void {
    const set = this.listeners[event] as Set<EventCallback<PrinterEventMap[K]>>;
    set.add(callback);
  }

  /** Unsubscribe from events */
  off<K extends keyof PrinterEventMap>(event: K, callback: EventCallback<PrinterEventMap[K]>): void {
    const set = this.listeners[event] as Set<EventCallback<PrinterEventMap[K]>>;
    set.delete(callback);
  }

  private emit<K extends keyof PrinterEventMap>(event: K, data: PrinterEventMap[K]): void {
    const set = this.listeners[event] as Set<EventCallback<PrinterEventMap[K]>>;
    set.forEach(cb => cb(data));
  }

  private setStatus(status: PrinterStatus): void {
    this._status = status;
    this.emit('statusChange', status);
  }

  /**
   * Scan and connect to a BLE thermal printer.
   * Opens the browser's Bluetooth device picker dialog.
   */
  async connect(): Promise<boolean> {
    if (!BluetoothPrinter.isSupported()) {
      this.emit('error', 'Web Bluetooth tidak didukung. Gunakan Chrome atau Edge.');
      return false;
    }

    try {
      this.setStatus('connecting');

      // Request device with common thermal printer services
      this.device = await navigator.bluetooth.requestDevice({
        // Accept all devices and discover services
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      if (!this.device) {
        this.setStatus('disconnected');
        return false;
      }

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.setStatus('disconnected');
        this.server = null;
        this.writeCharacteristic = null;
      });

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Find the writable characteristic
      const found = await this.findWriteCharacteristic();
      if (!found) {
        this.emit('error', 'Tidak dapat menemukan karakteristik tulis pada printer. Pastikan printer mendukung BLE.');
        await this.disconnect();
        return false;
      }

      // Save device ID for future reconnection
      if (this.device.id) {
        localStorage.setItem(STORAGE_KEY, this.device.id);
      }

      this.setStatus('connected');
      return true;

    } catch (error: unknown) {
      const err = error as Error;
      // User cancelled the picker
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        this.setStatus('disconnected');
        return false;
      }
      this.setStatus('error');
      this.emit('error', `Gagal terhubung: ${err.message}`);
      return false;
    }
  }

  /**
   * Find a writable characteristic from the printer's GATT services.
   */
  private async findWriteCharacteristic(): Promise<boolean> {
    if (!this.server) return false;

    try {
      const services = await this.server.getPrimaryServices();

      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            // Check if this characteristic supports writing
            if (
              char.properties.write ||
              char.properties.writeWithoutResponse
            ) {
              this.writeCharacteristic = char;
              return true;
            }
          }
        } catch {
          // Service doesn't have accessible characteristics, skip
          continue;
        }
      }

      // Also try known characteristic UUIDs directly
      for (const serviceUUID of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await this.server.getPrimaryService(serviceUUID);
          for (const charUUID of PRINTER_CHAR_UUIDS) {
            try {
              const char = await service.getCharacteristic(charUUID);
              if (char.properties.write || char.properties.writeWithoutResponse) {
                this.writeCharacteristic = char;
                return true;
              }
            } catch {
              continue;
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      return false;
    }

    return false;
  }

  /** Disconnect from the printer */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this.setStatus('disconnected');
  }

  /**
   * Send raw data to the printer in chunks.
   * BLE has a max MTU, so we split into small packets.
   */
  async print(data: Uint8Array): Promise<boolean> {
    if (!this.writeCharacteristic) {
      this.emit('error', 'Printer tidak terhubung');
      return false;
    }

    try {
      this.setStatus('printing');

      // Split data into chunks
      for (let offset = 0; offset < data.length; offset += MAX_CHUNK_SIZE) {
        const chunk = data.slice(offset, Math.min(offset + MAX_CHUNK_SIZE, data.length));

        if (this.writeCharacteristic.properties.writeWithoutResponse) {
          await this.writeCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.writeCharacteristic.writeValue(chunk);
        }

        // Small delay between chunks to avoid overwhelming the printer
        if (offset + MAX_CHUNK_SIZE < data.length) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      this.setStatus('connected');
      return true;

    } catch (error: unknown) {
      const err = error as Error;
      this.setStatus('error');
      this.emit('error', `Gagal mencetak: ${err.message}`);
      return false;
    }
  }
}

// Singleton instance
export const printer = new BluetoothPrinter();
