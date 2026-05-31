import { db } from "../db/index.js";
import { promotions } from "../db/schema.js";
import { eq, isNull, and, sql } from "drizzle-orm";

interface CreatePromotionInput {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
}

export const promotionService = {
  async listActive() {
    return db
      .select()
      .from(promotions)
      .where(and(eq(promotions.isActive, true), isNull(promotions.deletedAt)));
  },

  async listAll() {
    return db
      .select()
      .from(promotions)
      .where(isNull(promotions.deletedAt));
  },

  async getById(id: string) {
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.id, id), isNull(promotions.deletedAt)));

    return promotion ?? null;
  },

  async getByCode(code: string) {
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.code, code), isNull(promotions.deletedAt), eq(promotions.isActive, true)));

    return promotion ?? null;
  },

  async create(input: CreatePromotionInput) {
    const [promotion] = await db
      .insert(promotions)
      .values({
        code: input.code.toUpperCase(),
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderValue: input.minOrderValue ?? 0,
        maxDiscount: input.maxDiscount ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return promotion;
  },

  async update(id: string, input: Partial<CreatePromotionInput>) {
    const [promotion] = await db
      .update(promotions)
      .set({
        ...input,
        code: input.code?.toUpperCase(),
        updatedAt: new Date(),
      })
      .where(and(eq(promotions.id, id), isNull(promotions.deletedAt)))
      .returning();

    return promotion ?? null;
  },

  async delete(id: string) {
    const [promotion] = await db
      .update(promotions)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(promotions.id, id), isNull(promotions.deletedAt)))
      .returning();

    return promotion ?? null;
  },
};
