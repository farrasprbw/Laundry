import ExcelJS from "exceljs";
import type { Order, Expense, Customer, Category } from "../db/schema.js";

interface CustomerData extends Customer {
  tier?: string;
}

interface OrderWithRelations extends Order {
  customer: CustomerData | null;
  category: Category;
  paymentMethod?: { id: string; name: string } | null;
}

interface ExportData {
  orders: OrderWithRelations[];
  expenses: Expense[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  reportTitle: string;
}

/**
 * Generate an Excel workbook with 3 sheets:
 * 1. Orders — detail of all orders
 * 2. Expenses — detail of all expenses
 * 3. Summary — totals
 */
export async function generateExcelReport(data: ExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LaundroFlow";
  workbook.created = new Date();

  // ── Sheet 1: Orders ──
  const ordersSheet = workbook.addWorksheet("Orders");
  ordersSheet.columns = [
    { header: "Invoice", key: "invoice", width: 18 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Customer", key: "customer", width: 22 },
    { header: "Tier Pelanggan", key: "tier", width: 15 },
    { header: "Poin Pelanggan", key: "points", width: 15 },
    { header: "Category", key: "category", width: 18 },
    { header: "Diskon", key: "discount", width: 12 },
    { header: "Poin Dipakai", key: "pointsUsed", width: 15 },
    { header: "Poin Didapat", key: "pointsEarned", width: 15 },
    { header: "Total Akhir", key: "amount", width: 16 },
    { header: "Payment Method", key: "paymentMethod", width: 18 },
    { header: "Status Pembayaran", key: "paymentStatus", width: 20 },
  ];

  // Style header row
  const headerRow = ordersSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0058BE" },
  };

  for (const order of data.orders) {
    ordersSheet.addRow({
      invoice: order.invoiceNumber,
      tanggal: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("id-ID")
        : "",
      customer: order.customer?.name ?? "-",
      tier: order.customer?.tier ?? "-",
      points: order.customer?.points ?? 0,
      category: order.category?.name ?? "-",
      discount: order.discount ?? 0,
      pointsUsed: order.pointsUsed ?? 0,
      pointsEarned: order.pointsEarned ?? 0,
      amount: order.totalPrice,
      paymentMethod: order.paymentMethod?.name ?? "-",
      paymentStatus: order.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas",
    });
  }

  // ── Sheet 2: Expenses ──
  const expensesSheet = workbook.addWorksheet("Expenses");
  expensesSheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Category", key: "category", width: 18 },
    { header: "Description", key: "description", width: 30 },
    { header: "Amount (Rp)", key: "amount", width: 16 },
  ];

  const expHeaderRow = expensesSheet.getRow(1);
  expHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  expHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFBA1A1A" },
  };

  for (const expense of data.expenses) {
    expensesSheet.addRow({
      date: expense.expenseDate,
      category: expense.category,
      description: expense.description ?? "-",
      amount: expense.amount,
    });
  }

  // ── Sheet 3: Summary ──
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 24 },
    { header: "Amount (Rp)", key: "amount", width: 20 },
  ];

  const sumHeaderRow = summarySheet.getRow(1);
  sumHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  sumHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0058BE" },
  };

  summarySheet.addRow({ metric: "Total Income", amount: data.totalIncome });
  summarySheet.addRow({
    metric: "Total Expenses",
    amount: data.totalExpenses,
  });
  summarySheet.addRow({ metric: "Net Profit", amount: data.netProfit });

  // Format number columns
  const formatCurrency = '#,##0';
  ordersSheet.getColumn("amount").numFmt = formatCurrency;
  ordersSheet.getColumn("discount").numFmt = formatCurrency;
  expensesSheet.getColumn("amount").numFmt = formatCurrency;
  summarySheet.getColumn("amount").numFmt = formatCurrency;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
