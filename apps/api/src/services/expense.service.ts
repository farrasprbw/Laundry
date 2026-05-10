import { db } from "../db/index.js";
import { expenses } from "../db/schema.js";
import { eq, isNull, and, sql, desc, ilike, gte, lte } from "drizzle-orm";

interface CreateExpenseInput {
  category: string;
  description?: string;
  amount: number;
  expenseDate: string;
}

interface ListExpensesParams {
  month?: number;
  year?: number;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const expenseService = {
  async list({ month, year, category, search, page = 1, limit = 20 }: ListExpensesParams) {
    const offset = (page - 1) * limit;
    const conditions: ReturnType<typeof sql>[] = [sql`${isNull(expenses.deletedAt)}`];

    if (month && year) {
      const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];
      conditions.push(sql`${gte(expenses.expenseDate, startDate)}`);
      conditions.push(sql`${lte(expenses.expenseDate, endDate)}`);
    }
    if (category) conditions.push(sql`${eq(expenses.category, category)}`);
    if (search) {
      conditions.push(sql`(${ilike(expenses.description, `%${search}%`)} OR ${ilike(expenses.category, `%${search}%`)})`);
    }

    const where = sql.join(conditions, sql` AND `);
    const [data, countResult] = await Promise.all([
      db.select().from(expenses).where(where).orderBy(desc(expenses.expenseDate)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(expenses).where(where),
    ]);

    return { data, pagination: { page, limit, total: countResult[0].count, totalPages: Math.ceil(countResult[0].count / limit) } };
  },

  async getById(id: string) {
    const [expense] = await db.select().from(expenses).where(and(eq(expenses.id, id), isNull(expenses.deletedAt)));
    return expense ?? null;
  },

  async create(input: CreateExpenseInput, recordedById: string) {
    const [expense] = await db.insert(expenses).values({
      category: input.category, description: input.description ?? null,
      amount: input.amount, expenseDate: input.expenseDate, recordedById,
    }).returning();
    return expense;
  },

  async update(id: string, input: Partial<CreateExpenseInput>) {
    const [expense] = await db.update(expenses).set({ ...input, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt))).returning();
    return expense ?? null;
  },

  async delete(id: string) {
    const [expense] = await db.update(expenses).set({ deletedAt: new Date() })
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt))).returning();
    return expense ?? null;
  },
};
