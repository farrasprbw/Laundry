import { db } from "../db/index.js";
import { branches } from "../db/schema.js";
import { eq, isNull, and } from "drizzle-orm";

export const branchService = {
  async listBranches() {
    return db
      .select()
      .from(branches)
      .where(and(isNull(branches.deletedAt), eq(branches.isActive, true)))
      .orderBy(branches.name);
  },

  async getBranchById(id: string) {
    const [b] = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, id), isNull(branches.deletedAt)));
    return b ?? null;
  },
};
