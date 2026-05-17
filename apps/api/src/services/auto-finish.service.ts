import { db } from "../db/index.js";
import { orders, categories } from "../db/schema.js";
import { eq, and, isNull, sql } from "drizzle-orm";

/**
 * Auto-finish service — automatically transitions orders from PROCESS → FINISHED
 * when the estimated duration (from the category) has elapsed since order creation.
 */
export const autoFinishService = {
  /**
   * Find all PROCESS orders whose estimated completion time has passed,
   * and update their status to FINISHED.
   *
   * @returns number of orders that were auto-finished
   */
  async autoFinishOrders(): Promise<number> {
    // Find all PROCESS orders where NOW() > createdAt + estimatedDurationMinutes
    const overdueOrders = await db
      .select({
        orderId: orders.id,
      })
      .from(orders)
      .innerJoin(categories, eq(orders.categoryId, categories.id))
      .where(
        and(
          eq(orders.status, "PROCESS"),
          isNull(orders.deletedAt),
          // createdAt + estimatedDurationMinutes < NOW()
          sql`${orders.createdAt} + (${categories.estimatedDurationMinutes} || ' minutes')::interval < NOW()`
        )
      );

    if (overdueOrders.length === 0) {
      return 0;
    }

    const orderIds = overdueOrders.map((o) => o.orderId);
    const now = new Date();

    // Batch update all overdue orders to FINISHED
    const result = await db
      .update(orders)
      .set({
        status: "FINISHED",
        finishedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          sql`${orders.id} IN (${sql.join(
            orderIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          eq(orders.status, "PROCESS") // safety check — only update if still PROCESS
        )
      );

    return orderIds.length;
  },
};
