import ExcelJS from "exceljs";
import type { Order, Expense, Customer, Category } from "../db/schema.js";

interface OrderWithRelations extends Order {
  customer: Customer;
  category: Category;
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
    { header: "Date", key: "date", width: 14 },
    { header: "Customer", key: "customer", width: 22 },
    { header: "Category", key: "category", width: 18 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Unit", key: "unit", width: 8 },
    { header: "Total (Rp)", key: "total", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Finished At", key: "finishedAt", width: 18 },
    { header: "Taken At", key: "takenAt", width: 18 },
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
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("id-ID")
        : "",
      customer: order.customer?.name ?? "-",
      category: order.category?.name ?? "-",
      qty: Number(order.quantity),
      unit: order.category?.unit ?? "kg",
      total: order.totalPrice,
      status: order.status,
      finishedAt: order.finishedAt
        ? new Date(order.finishedAt).toLocaleString("id-ID")
        : "-",
      takenAt: order.takenAt
        ? new Date(order.takenAt).toLocaleString("id-ID")
        : "-",
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
  ordersSheet.getColumn("total").numFmt = formatCurrency;
  expensesSheet.getColumn("amount").numFmt = formatCurrency;
  summarySheet.getColumn("amount").numFmt = formatCurrency;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
