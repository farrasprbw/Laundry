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
};
