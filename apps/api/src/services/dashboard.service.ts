import { db } from "../db/index.js";
import { orders, expenses, customers, categories } from "../db/schema.js";
import { eq, isNull, and, gte, lte, sql, desc } from "drizzle-orm";

export const dashboardService = {
  /**
   * Get summary stats for today and current month.
   */
  async getStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's income (sum of totalPrice from orders created today)
    const [incomeResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay),
          isNull(orders.deletedAt)
        )
      );

    // Today's expenses
    const todayDateStr = today.toISOString().split("T")[0];
    const [expenseResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(
        and(
          eq(expenses.expenseDate, todayDateStr),
          isNull(expenses.deletedAt)
        )
      );

    // Today's order count
    const [orderCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay),
          isNull(orders.deletedAt)
        )
      );

    // Pending pickups (status = FINISHED, not yet TAKEN)
    const [pendingResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.status, "FINISHED"),
          isNull(orders.deletedAt)
        )
      );

    // Monthly income
    const [monthlyResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfMonth),
          isNull(orders.deletedAt)
        )
      );

    const todayIncome = Number(incomeResult.total);
    const todayExpenses = Number(expenseResult.total);

    return {
      todayIncome,
      todayExpenses,
      todayProfit: todayIncome - todayExpenses,
      todayOrderCount: Number(orderCountResult.count),
      pendingPickups: Number(pendingResult.count),
      monthlyIncome: Number(monthlyResult.total),
    };
  },

  /**
   * Get the most recent orders with customer & category info.
   */
  async getRecentOrders(limit = 5) {
    const result = await db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        },
        category: {
          id: categories.id,
          name: categories.name,
          unit: categories.unit,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(categories, eq(orders.categoryId, categories.id))
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return result;
  },

  /**
   * Get financial trend data for the last N days.
   */
  async getFinancialTrend(days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get daily income from orders
    const incomeData = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        total: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          isNull(orders.deletedAt)
        )
      )
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    const getLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Get daily expenses
    const expenseData = await db
      .select({
        date: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM-DD')`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, getLocalDateStr(startDate)),
          isNull(expenses.deletedAt)
        )
      )
      .groupBy(expenses.expenseDate);

    // Build day-by-day result
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateStr(d);

      const income = Number(incomeData.find((r) => r.date === dateStr)?.total ?? 0);
      const expense = Number(expenseData.find((r) => r.date === dateStr)?.total ?? 0);

      result.push({
        date: dateStr,
        income,
        expenses: expense,
        profit: income - expense,
      });
    }

    return result;
  },

  /**
   * Get full dashboard analytics.
   */
  async getAnalytics() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Month Comparison
    const [currentMonthIncomeRes] = await db.select({ total: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)` })
      .from(orders).where(and(gte(orders.createdAt, currentMonthStart), isNull(orders.deletedAt)));
      
    const [lastMonthIncomeRes] = await db.select({ total: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)` })
      .from(orders).where(and(gte(orders.createdAt, lastMonthStart), lte(orders.createdAt, lastMonthEnd), isNull(orders.deletedAt)));

    const [currentMonthExpRes] = await db.select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses).where(and(gte(expenses.expenseDate, currentMonthStart.toISOString().split('T')[0]), isNull(expenses.deletedAt)));
      
    const [lastMonthExpRes] = await db.select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses).where(and(gte(expenses.expenseDate, lastMonthStart.toISOString().split('T')[0]), lte(expenses.expenseDate, lastMonthEnd.toISOString().split('T')[0]), isNull(expenses.deletedAt)));

    const [currentMonthOrdersRes] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(orders).where(and(gte(orders.createdAt, currentMonthStart), isNull(orders.deletedAt)));

    const [lastMonthOrdersRes] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(orders).where(and(gte(orders.createdAt, lastMonthStart), lte(orders.createdAt, lastMonthEnd), isNull(orders.deletedAt)));

    const currentMonthIncome = Number(currentMonthIncomeRes?.total || 0);
    const lastMonthIncome = Number(lastMonthIncomeRes?.total || 0);
    const currentMonthExpenses = Number(currentMonthExpRes?.total || 0);
    const lastMonthExpenses = Number(lastMonthExpRes?.total || 0);
    const currentMonthOrders = Number(currentMonthOrdersRes?.count || 0);
    const lastMonthOrders = Number(lastMonthOrdersRes?.count || 0);

    const calcChange = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return Number((((current - last) / last) * 100).toFixed(1));
    };

    const monthComparison = {
      currentMonthIncome,
      lastMonthIncome,
      incomeChangePercent: calcChange(currentMonthIncome, lastMonthIncome),
      currentMonthExpenses,
      lastMonthExpenses,
      expenseChangePercent: calcChange(currentMonthExpenses, lastMonthExpenses),
      currentMonthOrders,
      lastMonthOrders,
      orderChangePercent: calcChange(currentMonthOrders, lastMonthOrders),
    };

    // 2. Top 5 Customers (This Month)
    const topCustomers = await db.select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      totalSpent: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(and(gte(orders.createdAt, currentMonthStart), isNull(orders.deletedAt)))
    .groupBy(customers.id, customers.name, customers.phone)
    .orderBy(desc(sql`COALESCE(SUM(${orders.totalPrice}), 0)`))
    .limit(5);

    // 3. Top Categories (This Month)
    const topCategories = await db.select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      orderCount: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`,
    })
    .from(orders)
    .innerJoin(categories, eq(orders.categoryId, categories.id))
    .where(and(gte(orders.createdAt, currentMonthStart), isNull(orders.deletedAt)))
    .groupBy(categories.id, categories.name, categories.icon)
    .orderBy(desc(sql`COUNT(*)`));

    // 4. Average Rating
    const [ratingRes] = await db.select({
      averageRating: sql<number>`AVG(${orders.rating})`,
      totalRatings: sql<number>`COUNT(${orders.rating})`,
    })
    .from(orders)
    .where(and(isNull(orders.deletedAt), sql`${orders.rating} IS NOT NULL`));

    // 5. Peak Hours (This Month)
    const ordersByHourRaw = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})::integer`,
      count: sql<number>`COUNT(*)::integer`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, currentMonthStart), isNull(orders.deletedAt)))
    .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`);

    // Fill missing hours
    const ordersByHour = Array.from({ length: 24 }, (_, i) => {
      const match = ordersByHourRaw.find((o) => Number(o.hour) === i);
      return { hour: i, count: match ? Number(match.count) : 0 };
    });

    return {
      monthComparison,
      topCustomers: topCustomers.map(c => ({ ...c, totalSpent: Number(c.totalSpent), orderCount: Number(c.orderCount) })),
      topCategories: topCategories.map(c => ({ ...c, orderCount: Number(c.orderCount), totalRevenue: Number(c.totalRevenue) })),
      averageRating: ratingRes?.averageRating ? Number(Number(ratingRes.averageRating).toFixed(1)) : null,
      totalRatings: Number(ratingRes?.totalRatings || 0),
      ordersByHour,
    };
  }
};
