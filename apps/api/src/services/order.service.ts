import { db } from "../db/index.js";
import { orders, customers, categories } from "../db/schema.js";
import {
  eq,
  isNull,
  and,
  sql,
  desc,
  ilike,
  or,
  gte,
  lte,
} from "drizzle-orm";
import { generateInvoiceNumber } from "../lib/invoice.js";
import { categoryService } from "./category.service.js";

interface CreateOrderInput {
  customerId: string;
  categoryId: string;
  quantity: number;
  notes?: string;
}

interface ListOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const orderService = {
  async list({
    status,
    search,
    page = 1,
    limit = 20,
    dateFrom,
    dateTo,
  }: ListOrdersParams) {
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof sql>[] = [
      sql`${isNull(orders.deletedAt)}`,
    ];

    if (status) {
      conditions.push(sql`${eq(orders.status, status)}`);
    }

    if (search) {
      conditions.push(
        sql`(${ilike(orders.invoiceNumber, `%${search}%`)} OR ${sql`${orders.customerId} IN (SELECT id FROM customers WHERE ${ilike(customers.name, `%${search}%`)})`})`
      );
    }

    if (dateFrom) {
      conditions.push(sql`${gte(orders.createdAt, new Date(dateFrom))}`);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(sql`${lte(orders.createdAt, endDate)}`);
    }

    const where = sql.join(conditions, sql` AND `);

    const [data, countResult] = await Promise.all([
      db
        .select({
          order: orders,
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
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(where),
    ]);

    return {
      data: data.map((row) => ({
        ...row.order,
        customer: row.customer,
        category: row.category,
      })),
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
    };
  },

  async getById(id: string) {
    const [result] = await db
      .select({
        order: orders,
        customer: customers,
        category: categories,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(categories, eq(orders.categoryId, categories.id))
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

    if (!result) return null;

    return {
      ...result.order,
      customer: result.customer,
      category: result.category,
    };
  },

  async create(input: CreateOrderInput, createdById: string) {
    const category = await categoryService.getById(input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const invoiceNumber = await generateInvoiceNumber();
    const totalPrice = Math.round(input.quantity * category.pricePerUnit);

    const [order] = await db
      .insert(orders)
      .values({
        invoiceNumber,
        customerId: input.customerId,
        categoryId: input.categoryId,
        createdById,
        quantity: String(input.quantity),
        totalPrice,
        notes: input.notes ?? null,
      })
      .returning();

    return order;
  },

  async update(id: string, input: Partial<CreateOrderInput>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.quantity !== undefined) {
      updateData.quantity = String(input.quantity);

      // Recalculate total if quantity changes
      const existing = await this.getById(id);
      if (existing?.category) {
        updateData.totalPrice = Math.round(
          input.quantity * existing.category.pricePerUnit
        );
      }
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .returning();

    return order ?? null;
  },

  async updateStatus(id: string, newStatus: string) {
    const existing = await this.getById(id);
    if (!existing) return null;

    // Validate transition
    const validTransitions: Record<string, string> = {
      PROCESS: "FINISHED",
      FINISHED: "TAKEN",
    };

    if (validTransitions[existing.status] !== newStatus) {
      throw new Error(
        `Invalid status transition: ${existing.status} → ${newStatus}`
      );
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "FINISHED") {
      updateData.finishedAt = new Date();
    } else if (newStatus === "TAKEN") {
      updateData.takenAt = new Date();
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    return order;
  },

  async delete(id: string) {
    const [order] = await db
      .update(orders)
      .set({ deletedAt: new Date() })
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .returning();

    return order ?? null;
  },

  async generateWhatsAppLink(id: string) {
    const order = await this.getById(id);
    if (!order || !order.customer) return null;

    const phone = order.customer.phone.replace(/\D/g, "");
    // Convert 0xxx to 62xxx for Indonesian numbers
    const intlPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;

    const qty = Number(order.quantity);
    const unitLabel = order.category?.unit ?? "kg";
    const categoryName = order.category?.name ?? "Laundry";

    const message = `Halo *${order.customer.name}*,

Cucian Anda dengan invoice *${order.invoiceNumber}* (${categoryName} - ${qty} ${unitLabel}) telah *SELESAI* ✅

Silakan diambil. Terima kasih 🙏`;

    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;

    // Mark notification as sent
    await db
      .update(orders)
      .set({ waNotificationSent: true, updatedAt: new Date() })
      .where(eq(orders.id, id));

    return { waLink, message, phone: intlPhone };
  },
};
