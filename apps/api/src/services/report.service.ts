import { db } from "../db/index.js";
import { orders, expenses, customers, categories, paymentMethods } from "../db/schema.js";
import { sql, eq, isNull, and, gte, lt, lte, desc } from "drizzle-orm";
import { generateExcelReport } from "../lib/excel.js";

export const reportService = {
  async getDashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayFilter = and(isNull(orders.deletedAt), gte(orders.createdAt, startOfDay), lt(orders.createdAt, startOfNextDay));
    const monthFilter = and(isNull(orders.deletedAt), gte(orders.createdAt, startOfMonth), lt(orders.createdAt, startOfNextDay));

    const [incomeToday, expensesToday, orderCountToday, pendingPickups, incomeMonth] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${orders.totalPrice}), 0)::int` }).from(orders).where(todayFilter),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` }).from(expenses)
        .where(and(isNull(expenses.deletedAt), sql`${expenses.expenseDate} >= ${startOfDay.toISOString().split("T")[0]}`, sql`${expenses.expenseDate} < ${startOfNextDay.toISOString().split("T")[0]}`)),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(todayFilter),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(and(isNull(orders.deletedAt), eq(orders.status, "FINISHED"))),
      db.select({ total: sql<number>`coalesce(sum(${orders.totalPrice}), 0)::int` }).from(orders).where(monthFilter),
    ]);

    const todayIncome = incomeToday[0].total;
    const todayExpenses = expensesToday[0].total;

    return {
      todayIncome, todayExpenses,
      todayProfit: todayIncome - todayExpenses,
      todayOrderCount: orderCountToday[0].count,
      pendingPickups: pendingPickups[0].count,
      monthlyIncome: incomeMonth[0].total,
    };
  },

  async getFinancialTrend(period: number = 7) {
    const now = new Date();
    const days: { date: string; income: number; expenses: number; profit: number }[] = [];

    for (let i = period - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dateStr = day.toISOString().split("T")[0];
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const [incomeResult, expenseResult] = await Promise.all([
        db.select({ total: sql<number>`coalesce(sum(${orders.totalPrice}), 0)::int` }).from(orders)
          .where(and(isNull(orders.deletedAt), gte(orders.createdAt, day), lt(orders.createdAt, nextDay))),
        db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` }).from(expenses)
          .where(and(isNull(expenses.deletedAt), sql`${expenses.expenseDate} = ${dateStr}`)),
      ]);

      const income = incomeResult[0].total;
      const exp = expenseResult[0].total;
      days.push({ date: dateStr, income, expenses: exp, profit: income - exp });
    }

    return days;
  },

  async getRecentOrders(limit: number = 5) {
    return db.select({ order: orders, customer: { id: customers.id, name: customers.name, phone: customers.phone }, category: { id: categories.id, name: categories.name, unit: categories.unit } })
      .from(orders).leftJoin(customers, eq(orders.customerId, customers.id)).leftJoin(categories, eq(orders.categoryId, categories.id))
      .where(isNull(orders.deletedAt)).orderBy(desc(orders.createdAt)).limit(limit)
      .then(rows => rows.map(r => ({ ...r.order, customer: r.customer, category: r.category })));
  },

  async getPendingPickups() {
    return db.select({ order: orders, customer: { id: customers.id, name: customers.name, phone: customers.phone, address: customers.address } })
      .from(orders).leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(isNull(orders.deletedAt), eq(orders.status, "FINISHED"))).orderBy(desc(orders.finishedAt))
      .then(rows => rows.map(r => ({ ...r.order, customer: r.customer })));
  },

  async getTransactions(dateFrom?: string, dateTo?: string) {
    let filter: ReturnType<typeof and> = isNull(orders.deletedAt);
    if (dateFrom && dateTo) {
      filter = and(
        isNull(orders.deletedAt),
        gte(orders.createdAt, new Date(dateFrom)),
        lte(orders.createdAt, new Date(`${dateTo}T23:59:59.999Z`))
      );
    }

    return db.select({
      order: orders,
      customer: { id: customers.id, name: customers.name, phone: customers.phone },
      category: { id: categories.id, name: categories.name, unit: categories.unit },
      paymentMethod: { id: paymentMethods.id, name: paymentMethods.name }
    })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(categories, eq(orders.categoryId, categories.id))
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(filter)
      .orderBy(desc(orders.createdAt))
      .then(rows => rows.map(r => ({ ...r.order, customer: r.customer, category: r.category, paymentMethod: r.paymentMethod })));
  },

  async getSummary(dateFrom: string, dateTo: string) {
    const [income, exp] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${orders.totalPrice}), 0)::int` }).from(orders)
        .where(and(isNull(orders.deletedAt), gte(orders.createdAt, new Date(dateFrom)), lte(orders.createdAt, new Date(`${dateTo}T23:59:59.999Z`)))),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` }).from(expenses)
        .where(and(isNull(expenses.deletedAt), gte(expenses.expenseDate, dateFrom), lte(expenses.expenseDate, dateTo))),
    ]);
    const totalIncome = income[0].total;
    const totalExpenses = exp[0].total;
    return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
  },

  async exportExcel(dateFrom: string, dateTo: string) {
    const [ordersData, expensesData, summary] = await Promise.all([
      db.select({ order: orders, customer: customers, category: categories, paymentMethod: paymentMethods }).from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(categories, eq(orders.categoryId, categories.id))
        .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
        .where(and(isNull(orders.deletedAt), gte(orders.createdAt, new Date(dateFrom)), lte(orders.createdAt, new Date(`${dateTo}T23:59:59.999Z`))))
        .orderBy(desc(orders.createdAt))
        .then(rows => rows.map(r => ({ ...r.order, customer: r.customer!, category: r.category!, paymentMethod: r.paymentMethod }))),
      db.select().from(expenses)
        .where(and(isNull(expenses.deletedAt), gte(expenses.expenseDate, dateFrom), lte(expenses.expenseDate, dateTo)))
        .orderBy(desc(expenses.expenseDate)),
      this.getSummary(dateFrom, dateTo),
    ]);

    return generateExcelReport({
      orders: ordersData, expenses: expensesData,
      totalIncome: summary.totalIncome, totalExpenses: summary.totalExpenses,
      netProfit: summary.netProfit, reportTitle: `Report ${dateFrom} - ${dateTo}`,
    });
  },
};
