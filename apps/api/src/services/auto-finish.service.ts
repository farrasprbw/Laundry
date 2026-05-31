import { db } from "../db/index.js";
import { orders, categories } from "../db/schema.js";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import { orderService } from "./order.service.js";

/**
 * Auto-finish service — automatically transitions orders from PROCESS → FINISHED
 * when the estimated duration (in days) has elapsed at 17:00.
 */
export const autoFinishService = {
  /**
   * Find all PROCESS orders whose estimated completion time has passed (17:00 on the target day),
   * and update their status to FINISHED.
   *
   * @returns number of orders that were auto-finished
   */
  async autoFinishOrders(): Promise<number> {
    // Finish time = DATE(createdAt in WIB) + (estimatedDurationDays - 1) days + 17 hours
    // e.g. 1 day (express) → same day at 17:00 WIB, 2 days → next day at 17:00 WIB
    // All times converted to Asia/Jakarta to avoid UTC mismatch
    // createdAt is stored as 'timestamp without time zone' but contains UTC values
    // (standard Node.js/Drizzle behavior). We need to:
    // 1. Interpret createdAt as UTC → convert to Jakarta time to get the correct date
    // 2. Calculate target finish = that Jakarta date + (estimatedDays - 1) days + 17 hours
    // 3. Compare with current Jakarta time
    const overdueOrders = await db
      .select({
        orderId: orders.id,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "PROCESS"),
          isNull(orders.deletedAt),
          sql`(NOW() AT TIME ZONE 'Asia/Jakarta') >= (
            (${orders.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date
            + make_interval(days => ((SELECT MAX(c.estimated_duration_days) FROM order_items oi JOIN categories c ON oi.category_id = c.id WHERE oi.order_id = ${orders.id}) - 1))
            + INTERVAL '17 hours'
          )`
        )
      );

    if (overdueOrders.length === 0) {
      return 0;
    }

    const orderIds = overdueOrders.map((o) => o.orderId);
    const now = new Date();

    // Batch update all overdue orders to FINISHED using inArray + returning
    const updated = await db
      .update(orders)
      .set({
        status: "FINISHED",
        finishedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          inArray(orders.id, orderIds),
          eq(orders.status, "PROCESS") // safety check
        )
      )
      .returning({ id: orders.id });

    console.log(`[AUTO-FINISH] Updated ${updated.length} orders to FINISHED:`, updated.map((o) => o.id));

    // Send WhatsApp notification for each auto-finished order asynchronously
    for (const o of updated) {
      orderService.sendWhatsAppNotification(o.id).catch(err => 
        console.error(`[AUTO-FINISH] Failed to send WA for order ${o.id}:`, err)
      );
    }

    return updated.length;
  },
};
