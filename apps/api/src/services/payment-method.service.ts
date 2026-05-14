import { db } from "../db/index.js";
import { paymentMethods } from "../db/schema.js";
import { eq, isNull, and, sql } from "drizzle-orm";

interface CreatePaymentMethodInput {
  name: string;
}

interface UpdatePaymentMethodInput {
  name?: string;
  isActive?: boolean;
}

export const paymentMethodService = {
  async listActive() {
    return db
      .select()
      .from(paymentMethods)
      .where(isNull(paymentMethods.deletedAt));
  },

  async getById(id: string) {
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, id), isNull(paymentMethods.deletedAt)));

    return method ?? null;
  },

  async create(input: CreatePaymentMethodInput) {
    const [method] = await db
      .insert(paymentMethods)
      .values({
        name: input.name,
      })
      .returning();

    return method;
  },

  async update(id: string, input: UpdatePaymentMethodInput) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [method] = await db
      .update(paymentMethods)
      .set(updateData)
      .where(and(eq(paymentMethods.id, id), isNull(paymentMethods.deletedAt)))
      .returning();

    return method ?? null;
  },

  async delete(id: string) {
    const [method] = await db
      .update(paymentMethods)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(paymentMethods.id, id), isNull(paymentMethods.deletedAt)))
      .returning();

    return method ?? null;
  },
};
