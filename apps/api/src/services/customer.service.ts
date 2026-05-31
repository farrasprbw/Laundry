import { db } from "../db/index.js";
import { customers } from "../db/schema.js";
import { eq, isNull, ilike, or, sql, asc, desc } from "drizzle-orm";
import { orders } from "../db/schema.js";

interface CreateCustomerInput {
  name: string;
  phone: string;
  address?: string;
}

interface ListCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}

export const customerService = {
  async list({ search, page = 1, limit = 20, sort = "desc" }: ListCustomersParams) {
    const offset = (page - 1) * limit;

    const baseWhere = isNull(customers.deletedAt);
    const searchWhere = search
      ? or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`)
        )
      : undefined;

    const where = searchWhere
      ? sql`${baseWhere} AND ${searchWhere}`
      : baseWhere;

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          address: customers.address,
          points: customers.points,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
          deletedAt: customers.deletedAt,
          orderCount: sql<number>`(SELECT count(*)::int FROM orders WHERE customer_id = customers.id AND deleted_at IS NULL)`,
        })
        .from(customers)
        .where(where)
        .orderBy(sort === "asc" ? asc(customers.createdAt) : desc(customers.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(where),
    ]);

    const dataWithTier = data.map((c) => {
      let tier = "Bronze";
      if (c.orderCount >= 50) tier = "Gold";
      else if (c.orderCount >= 10) tier = "Silver";
      return { ...c, tier };
    });

    return {
      data: dataWithTier,
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
    };
  },

  async getById(id: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(sql`${eq(customers.id, id)} AND ${isNull(customers.deletedAt)}`);

    if (!customer) return null;

    // Get order count
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        sql`${eq(orders.customerId, id)} AND ${isNull(orders.deletedAt)}`
      );

    let tier = "Bronze";
    if (orderCount.count >= 50) tier = "Gold";
    else if (orderCount.count >= 10) tier = "Silver";

    return { ...customer, orderCount: orderCount.count, tier };
  },

  async create(input: CreateCustomerInput) {
    const [customer] = await db
      .insert(customers)
      .values({
        name: input.name,
        phone: input.phone,
        address: input.address ?? null,
      })
      .returning();

    return customer;
  },

  async update(id: string, input: Partial<CreateCustomerInput>) {
    const [customer] = await db
      .update(customers)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(sql`${eq(customers.id, id)} AND ${isNull(customers.deletedAt)}`)
      .returning();

    return customer ?? null;
  },

  async delete(id: string) {
    const [customer] = await db
      .update(customers)
      .set({ deletedAt: new Date() })
      .where(sql`${eq(customers.id, id)} AND ${isNull(customers.deletedAt)}`)
      .returning();

    return customer ?? null;
  },
};
