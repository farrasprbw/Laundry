import { eq, sql, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, customers, categories } from "../db/schema.js";
import { whatsappService } from "./whatsapp.service.js";

export const receivableService = {
  /** Get receivables summary */
  async getSummary() {
    const summary = await db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`.mapWith(Number),
        unpaidCount: sql<number>`COUNT(${orders.id})`.mapWith(Number),
        customerCount: sql<number>`COUNT(DISTINCT ${orders.customerId})`.mapWith(Number),
      })
      .from(orders)
      .where(eq(orders.paymentStatus, "UNPAID"));

    return {
      totalAmount: summary[0].totalAmount || 0,
      unpaidCount: summary[0].unpaidCount || 0,
      customerCount: summary[0].customerCount || 0,
    };
  },

  /** Get receivables aging analysis */
  async getAging() {
    // 1-7 days, 8-14 days, 15-30 days, >30 days
    const now = new Date();
    
    const rawData = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        totalPrice: orders.totalPrice,
      })
      .from(orders)
      .where(eq(orders.paymentStatus, "UNPAID"));

    const buckets = [
      { label: "1-7 Hari", minDays: 0, maxDays: 7, count: 0, amount: 0 },
      { label: "8-14 Hari", minDays: 8, maxDays: 14, count: 0, amount: 0 },
      { label: "15-30 Hari", minDays: 15, maxDays: 30, count: 0, amount: 0 },
      { label: ">30 Hari", minDays: 31, maxDays: 99999, count: 0, amount: 0 },
    ];

    rawData.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      for (const bucket of buckets) {
        if (diffDays >= bucket.minDays && diffDays <= bucket.maxDays) {
          bucket.count++;
          bucket.amount += Number(order.totalPrice);
          break;
        }
      }
    });

    return buckets.map(b => ({
      label: b.label,
      count: b.count,
      amount: b.amount,
    }));
  },

  /** Get receivables by customer */
  async getByCustomer() {
    const data = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        totalAmount: sql<number>`SUM(${orders.totalPrice})`.mapWith(Number),
        orderCount: sql<number>`COUNT(${orders.id})`.mapWith(Number),
        oldestOrderDate: sql<string>`MIN(${orders.createdAt})`,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(
        and(
          eq(orders.paymentStatus, "UNPAID"),
          sql`${orders.customerId} IS NOT NULL`
        )
      )
      .groupBy(customers.id, customers.name, customers.phone)
      .orderBy(sql`SUM(${orders.totalPrice}) DESC`);

    return data;
  },

  /** Get UNPAID orders for a specific customer */
  async getOrdersByCustomer(customerId: string) {
    const data = await db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
        }
      })
      .from(orders)
      .leftJoin(categories, eq(orders.categoryId, categories.id))
      .where(and(
        eq(orders.customerId, customerId),
        eq(orders.paymentStatus, "UNPAID")
      ))
      .orderBy(sql`${orders.createdAt} DESC`);
      
    return data;
  },

  /** Send WhatsApp reminder to customer */
  async sendReminder(customerId: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer || !customer.phone) {
      throw new Error("Customer not found or has no phone number");
    }

    const unpaidOrders = await this.getOrdersByCustomer(customerId);
    
    if (unpaidOrders.length === 0) {
      throw new Error("No unpaid orders found for this customer");
    }

    const totalAmount = unpaidOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
    const formattedAmount = `Rp ${totalAmount.toLocaleString('id-ID')}`;

    let message = `Halo Kak ${customer.name}! 👋\n\n`;
    message += `Semoga harinya menyenangkan ya. Sekadar mengingatkan nih Kak, ada tagihan laundry yang belum diselesaikan sebesar *${formattedAmount}*.\n\n`;
    message += `Berikut detail transaksinya:\n`;
    
    unpaidOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('id-ID');
      const orderAmount = `Rp ${Number(order.totalPrice).toLocaleString('id-ID')}`;
      message += `• ${order.invoiceNumber} (${orderDate}): ${orderAmount}\n`;
    });

    message += `\nBoleh minta tolong untuk segera diselesaikan pembayarannya ya Kak 🙏\n`;
    message += `Kalau Kakak merasa sudah bayar, boleh abaikan saja pesan ini ya.\n\n`;
    message += `Terima kasih banyak!\n- Admin Laundry ✨`;

    const success = await whatsappService.sendMessage(customer.phone, message);
    
    return {
      success,
      message: success ? "Reminder sent successfully" : "Failed to send reminder"
    };
  }
};
