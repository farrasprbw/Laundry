import { db } from "../db/index.js";
import { categories } from "../db/schema.js";
import { eq, isNull, and, sql } from "drizzle-orm";

interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  pricePerUnit: number;
  unit: string;
  estimatedDurationDays: number;
}

export const categoryService = {
  async listActive() {
    return db
      .select()
      .from(categories)
      .where(and(eq(categories.isActive, true), isNull(categories.deletedAt)));
  },

  async getById(id: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)));

    return category ?? null;
  },

  async create(input: CreateCategoryInput) {
    const [category] = await db
      .insert(categories)
      .values({
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? "styler",
        pricePerUnit: input.pricePerUnit,
        unit: input.unit,
        estimatedDurationDays: input.estimatedDurationDays,
      })
      .returning();

    return category;
  },

  async update(id: string, input: Partial<CreateCategoryInput>) {
    const [category] = await db
      .update(categories)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();

    return category ?? null;
  },

  async delete(id: string) {
    // Soft-delete + deactivate
    const [category] = await db
      .update(categories)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();

    return category ?? null;
  },
};
