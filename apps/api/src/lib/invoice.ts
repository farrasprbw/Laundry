import { db } from "../db/index.js";
import { orders } from "../db/schema.js";
import { sql, eq, and, gte, lt } from "drizzle-orm";

/**
 * Generate a unique invoice number in the format: #L{YYMMDD}-{3-digit-seq}
 * Example: #L260510-001, #L260510-002
 */
export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePrefix = `#ML${dd}${mm}${yy}`;

  // Find the highest sequence number for today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const result = await db
    .select({ invoiceNumber: orders.invoiceNumber })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startOfDay),
        lt(orders.createdAt, startOfNextDay)
      )
    )
    .orderBy(sql`${orders.invoiceNumber} DESC`)
    .limit(1);

  let seq = 1;
  if (result.length > 0) {
    // Extract sequence from existing invoice: #L260510-003 -> 3
    const parts = result[0].invoiceNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${datePrefix}-${String(seq).padStart(3, "0")}`;
}
