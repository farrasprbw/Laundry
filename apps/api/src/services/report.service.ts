import { db } from "../db/index.js";
import { orders, expenses, customers, categories, paymentMethods, orderItems } from "../db/schema.js";
import { sql, eq, isNull, and, gte, lt, lte, desc, inArray } from "drizzle-orm";
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
    const data = await db
      .select({
        order: orders,
        customer: { id: customers.id, name: customers.name, phone: customers.phone },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    const orderIds = data.map((d) => d.order.id);
    let itemsData: any[] = [];
    if (orderIds.length > 0) {
      itemsData = await db
        .select({
          orderId: orderItems.orderId,
          categoryName: categories.name,
        })
        .from(orderItems)
        .innerJoin(categories, eq(orderItems.categoryId, categories.id))
        .where(inArray(orderItems.orderId, orderIds));
    }

    return data.map((row) => {
      const items = itemsData
        .filter((i) => i.orderId === row.order.id)
        .map((i) => i.categoryName);
      return {
        ...row.order,
        customer: row.customer,
        category: { id: "", name: items.join(", "), unit: "" },
      };
    });
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

    const data = await db
      .select({
        order: orders,
        customer: { id: customers.id, name: customers.name, phone: customers.phone },
        paymentMethod: { id: paymentMethods.id, name: paymentMethods.name },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(filter)
      .orderBy(desc(orders.createdAt));

    const orderIds = data.map((d) => d.order.id);
    let itemsData: any[] = [];
    if (orderIds.length > 0) {
      itemsData = await db
        .select({
          orderId: orderItems.orderId,
          categoryName: categories.name,
        })
        .from(orderItems)
        .innerJoin(categories, eq(orderItems.categoryId, categories.id))
        .where(inArray(orderItems.orderId, orderIds));
    }

    return data.map((row) => {
      const items = itemsData
        .filter((i) => i.orderId === row.order.id)
        .map((i) => i.categoryName);
      return {
        ...row.order,
        customer: row.customer,
        paymentMethod: row.paymentMethod,
        category: { id: "", name: items.join(", "), unit: "" },
      };
    });
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
    const ordersData = await this.getTransactions(dateFrom, dateTo);

    const [expensesData, summary] = await Promise.all([
      db.select().from(expenses)
        .where(and(isNull(expenses.deletedAt), gte(expenses.expenseDate, dateFrom), lte(expenses.expenseDate, dateTo)))
        .orderBy(desc(expenses.expenseDate)),
      this.getSummary(dateFrom, dateTo),
    ]);

    return generateExcelReport({
      // @ts-expect-error Types might slightly mismatch because of missing customer details but it's ok for excel
      orders: ordersData, 
      expenses: expensesData,
      totalIncome: summary.totalIncome, totalExpenses: summary.totalExpenses,
      netProfit: summary.netProfit, reportTitle: `Report ${dateFrom} - ${dateTo}`,
    });
  },

  async getCategoryBreakdown(dateFrom?: string, dateTo?: string) {
    let filter: ReturnType<typeof and> = isNull(orders.deletedAt);
    if (dateFrom && dateTo) {
      filter = and(
        filter,
        gte(orders.createdAt, new Date(dateFrom)),
        lte(orders.createdAt, new Date(`${dateTo}T23:59:59.999Z`))
      );
    }

    const data = await db
      .select({
        id: categories.id,
        name: categories.name,
        orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`.mapWith(Number),
        totalRevenue: sql<number>`SUM(${orderItems.subtotal})`.mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(categories, eq(orderItems.categoryId, categories.id))
      .where(filter)
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`SUM(${orderItems.subtotal})`));

    return data;
  },

  async getPaymentBreakdown(dateFrom?: string, dateTo?: string) {
    let filter: ReturnType<typeof and> = and(isNull(orders.deletedAt), sql`${orders.paymentMethodId} IS NOT NULL`);
    if (dateFrom && dateTo) {
      filter = and(
        filter,
        gte(orders.createdAt, new Date(dateFrom)),
        lte(orders.createdAt, new Date(`${dateTo}T23:59:59.999Z`))
      );
    }

    const data = await db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
        orderCount: sql<number>`COUNT(${orders.id})`.mapWith(Number),
        totalRevenue: sql<number>`SUM(${orders.totalPrice})`.mapWith(Number),
      })
      .from(orders)
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(filter)
      .groupBy(paymentMethods.id, paymentMethods.name)
      .orderBy(desc(sql`SUM(${orders.totalPrice})`));

    return data;
  },

  async getMonthlyComparison(months: number = 6) {
    const data = [];
    const now = new Date();
    
    // We go backwards to calculate properly, then reverse
    for (let i = months - 1; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthStr = targetMonth.toLocaleDateString("id-ID", { month: 'short', year: 'numeric' });
      
      const [incomeResult, expResult] = await Promise.all([
        db.select({ total: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`.mapWith(Number) })
          .from(orders)
          .where(and(
            isNull(orders.deletedAt),
            gte(orders.createdAt, targetMonth),
            lt(orders.createdAt, nextMonth)
          )),
        db.select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`.mapWith(Number) })
          .from(expenses)
          .where(and(
            isNull(expenses.deletedAt),
            sql`${expenses.expenseDate} >= ${targetMonth.toISOString().split('T')[0]}`,
            sql`${expenses.expenseDate} < ${nextMonth.toISOString().split('T')[0]}`
          ))
      ]);

      data.push({
        month: monthStr,
        income: incomeResult[0].total,
        expenses: expResult[0].total,
      });
    }

    return data;
  }
};
