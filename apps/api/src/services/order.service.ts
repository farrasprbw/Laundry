import { db } from "../db/index.js";
import { orders, customers, categories, paymentMethods, orderItems } from "../db/schema.js";
import {
  eq,
  isNull,
  and,
  sql,
  desc,
  ilike,
  gte,
  lte,
  inArray,
} from "drizzle-orm";
import { generateInvoiceNumber } from "../lib/invoice.js";
import { categoryService } from "./category.service.js";
import { whatsappService } from "./whatsapp.service.js";
import { env } from "../env.js";

interface CreateOrderInput {
  customerId: string;
  items: { categoryId: string; quantity: number }[];
  notes?: string;
  paymentMethodId?: string;
  paymentStatus?: string;
  discount?: number;
  promotionId?: string;
  pointsUsed?: number;
  parfume?: string;
}

interface ListOrdersParams {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const orderService = {
  async list({
    status,
    paymentStatus,
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

    if (paymentStatus) {
      conditions.push(sql`${eq(orders.paymentStatus, paymentStatus)}`);
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
          paymentMethod: {
            id: paymentMethods.id,
            name: paymentMethods.name,
          },
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(where),
    ]);

    const orderIds = data.map((d) => d.order.id);
    let itemsData: any[] = [];
    if (orderIds.length > 0) {
      itemsData = await db
        .select({
          orderId: orderItems.orderId,
          item: orderItems,
          category: categories,
        })
        .from(orderItems)
        .innerJoin(categories, eq(orderItems.categoryId, categories.id))
        .where(inArray(orderItems.orderId, orderIds));
    }

    return {
      data: data.map((row) => {
        const orderItemsList = itemsData
          .filter((i) => i.orderId === row.order.id)
          .map((i) => ({
            ...i.item,
            category: i.category,
          }));
        return {
          ...row.order,
          customer: row.customer,
          paymentMethod: row.paymentMethod,
          items: orderItemsList,
        };
      }),
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
        paymentMethod: paymentMethods,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

    if (!result) return null;

    const itemsData = await db
      .select({
        item: orderItems,
        category: categories,
      })
      .from(orderItems)
      .innerJoin(categories, eq(orderItems.categoryId, categories.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...result.order,
      customer: result.customer,
      paymentMethod: result.paymentMethod,
      items: itemsData.map((i) => ({ ...i.item, category: i.category })),
    };
  },

  async create(input: CreateOrderInput, createdById: string) {
    const invoiceNumber = await generateInvoiceNumber();
    let totalSubtotal = 0;
    const itemsToInsert: { categoryId: string; quantity: string; pricePerUnit: number; subtotal: number }[] = [];

    for (const item of input.items) {
      const category = await categoryService.getById(item.categoryId);
      if (!category) {
        throw new Error(`Category ${item.categoryId} not found`);
      }
      const subtotal = Math.round(item.quantity * category.pricePerUnit);
      totalSubtotal += subtotal;
      itemsToInsert.push({
        categoryId: category.id,
        quantity: String(item.quantity),
        pricePerUnit: category.pricePerUnit,
        subtotal,
      });
    }

    const discountAmount = input.discount ?? 0;
    const totalPrice = Math.max(0, totalSubtotal - discountAmount);
    const pointsEarned = Math.floor(totalPrice / 10000);
    const pointsUsed = input.pointsUsed ?? 0;

    const order = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          invoiceNumber,
          customerId: input.customerId,
          createdById,
          totalPrice,
          notes: input.notes ?? null,
          paymentMethodId: input.paymentMethodId ?? null,
          paymentStatus: input.paymentStatus ?? "UNPAID",
          discount: discountAmount,
          promotionId: input.promotionId || null,
          pointsEarned,
          pointsUsed,
          parfume: input.parfume ?? null,
        })
        .returning();

      for (const item of itemsToInsert) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          ...item,
        });
      }

      // Update customer points
      if (pointsEarned > 0 || pointsUsed > 0) {
        await tx.update(customers)
          .set({ points: sql`${customers.points} + ${pointsEarned} - ${pointsUsed}` })
          .where(eq(customers.id, input.customerId));
      }

      return newOrder;
    });

    // Auto-send new order notification
    this.sendNewOrderWhatsAppNotification(order.id).catch((err) =>
      console.error(`Failed to send new order WA for ${order.id}:`, err)
    );

    return order;
  },

  async update(id: string, input: Partial<CreateOrderInput>) {
    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.paymentMethodId !== undefined) updateData.paymentMethodId = input.paymentMethodId;
      if (input.paymentStatus !== undefined) updateData.paymentStatus = input.paymentStatus;
      if (input.parfume !== undefined) updateData.parfume = input.parfume;
      if (input.discount !== undefined) updateData.discount = input.discount;

      if (input.items && input.items.length > 0) {
        let totalSubtotal = 0;
        const newItemsToInsert: { orderId: string; categoryId: string; quantity: string; pricePerUnit: number; subtotal: number }[] = [];

        for (const item of input.items) {
          const category = await categoryService.getById(item.categoryId);
          if (!category) throw new Error(`Category ${item.categoryId} not found`);
          const subtotal = Math.round(item.quantity * category.pricePerUnit);
          totalSubtotal += subtotal;
          newItemsToInsert.push({
            orderId: id,
            categoryId: category.id,
            quantity: String(item.quantity),
            pricePerUnit: category.pricePerUnit,
            subtotal,
          });
        }

        // Delete old items
        await tx.delete(orderItems).where(eq(orderItems.orderId, id));
        // Insert new ones
        await tx.insert(orderItems).values(newItemsToInsert);

        const existing = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
        const currentDiscount = input.discount !== undefined ? input.discount : (existing[0]?.discount ?? 0);
        updateData.totalPrice = Math.max(0, totalSubtotal - currentDiscount);
      } else if (input.discount !== undefined) {
        // Just recalculate based on existing items
        const existingItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
        const totalSubtotal = existingItems.reduce((acc, curr) => acc + curr.subtotal, 0);
        updateData.totalPrice = Math.max(0, totalSubtotal - input.discount);
      }

      if (Object.keys(updateData).length > 1) { // more than just updatedAt
        await tx
          .update(orders)
          .set(updateData)
          .where(and(eq(orders.id, id), isNull(orders.deletedAt)));
      }
    });

    return await this.getById(id);
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
        `Invalid status transition: ${existing.status} -> ${newStatus}`
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

    // Auto-send WhatsApp notification if status changed to FINISHED
    if (newStatus === "FINISHED") {
      // Run asynchronously without blocking the request
      this.sendWhatsAppNotification(id).catch((err) =>
        console.error(`Failed to send WA for order ${id}:`, err)
      );
    }

    return order;
  },

  async updatePayment(id: string, paymentStatus: string) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const [order] = await db
      .update(orders)
      .set({ paymentStatus, updatedAt: new Date() })
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

    const { settingsService } = await import("./settings.service.js");
    const settings = await settingsService.getAll();

    const phone = order.customer.phone.replace(/\D/g, "");
    // Convert 0xxx to 62xxx for Indonesian numbers
    const intlPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(val);

    const totalAmount = formatCurrency(order.totalPrice);
    const statusLabel =
      order.paymentStatus === "PAID" ? "LUNAS ✅" : "BELUM BAYAR ❌";

    // Parse disclaimers
    const disclaimers = settings.store_disclaimer
      .split("|")
      .map((d) => `⚠️ ${d.trim()}`)
      .join("\n");

    const itemsStr = order.items
      .map((item: any) => {
        const qty = Number(item.quantity);
        const label = item.category?.unit ?? "kg";
        const name = item.category?.name ?? "Laundry";
        return `🧺 *${name}* (${qty} ${label})`;
      })
      .join("\n");

    const message = `Halo Kak *${order.customer.name}*! 👋✨

Pakaian bersih dan wangi sudah menanti! Cucian Kakak dengan detail berikut telah *SELESAI* dan siap untuk dijemput:

🧾 *No. Invoice:* ${order.invoiceNumber}
${itemsStr}

💰 *Total Tagihan:* ${totalAmount}
💳 *Status Pembayaran:* ${statusLabel}

Terima kasih telah mempercayakan cucian Kakak kepada *${settings.store_name}*! 🙏✨

---
*Syarat & Ketentuan Pengambilan:*
${disclaimers}`;

    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
      message
    )}`;

    // Mark notification as sent
    await db
      .update(orders)
      .set({ waNotificationSent: true, updatedAt: new Date() })
      .where(eq(orders.id, id));

    return { waLink, message, phone: intlPhone };
  },

  async sendWhatsAppNotification(id: string) {
    const data = await this.generateWhatsAppLink(id);
    if (!data) return false;

    return await whatsappService.sendMessage(data.phone, data.message);
  },

  async sendNewOrderWhatsAppNotification(id: string) {
    const order = await this.getById(id);
    if (!order || !order.customer) return false;

    const { settingsService } = await import("./settings.service.js");
    const settings = await settingsService.getAll();

    const phone = order.customer.phone.replace(/\D/g, "");
    const intlPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(val);

    const paymentStatusLabel =
      order.paymentStatus === "PAID" ? "LUNAS ✅" : "BELUM BAYAR ❌";
    const pmName = order.paymentMethod?.name ?? "-";
    const parfumeLabel = order.parfume ?? "Standard";

    // Estimated completion time based on max duration
    const maxDays = Math.max(...order.items.map((i: any) => i.category?.estimatedDurationDays ?? 1));
    const createdAt = new Date(order.createdAt);
    const estDate = new Date(createdAt);
    estDate.setDate(estDate.getDate() + maxDays - 1);
    estDate.setHours(17, 0, 0, 0);
    const estSelesai =
      estDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }) + " 17:00 WIB";

    const formattedDate = createdAt.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const invoiceUrl = `${env.CORS_ORIGIN}/invoice/${encodeURIComponent(
      order.invoiceNumber
    )}`;

    const itemsStr = order.items
      .map((item: any) => {
        const qty = Number(item.quantity);
        const label = item.category?.unit ?? "kg";
        const name = item.category?.name ?? "Laundry";
        const price = item.pricePerUnit;
        return `🧺 *${name}*\n   ${qty} ${label} x ${formatCurrency(price)}`;
      })
      .join("\n\n");

    const message = `*${settings.store_name}*
${settings.store_address_full}
HP : ${settings.store_phone}

━━━━━━━━━━━━━━━━━━━━

📋 *DETAIL ORDER*
No Invoice  : ${order.invoiceNumber}
Pelanggan   : *${order.customer.name}*
Tgl Masuk   : ${formattedDate}
Est Selesai : ${estSelesai}

━━━━━━━━━━━━━━━━━━━━

${itemsStr}

   *Total : ${formatCurrency(order.totalPrice)}*

━━━━━━━━━━━━━━━━━━━━

💳 Status Bayar : ${paymentStatusLabel}
💰 Pembayaran : ${pmName}
📌 Status     : SEDANG DIPROSES
🌸 Parfum     : ${parfumeLabel}
📝 Notes      : ${order.notes || "-"}
   ${settings.bank_account.replace(/\n/g, "\n   ")}

━━━━━━━━━━━━━━━━━━━━

📄 *Lihat Invoice Online:*
${invoiceUrl}

Terima kasih telah mempercayakan cucian Kakak kepada *${settings.store_name}*! 🙏
Cucian sedang kami proses, kami akan hubungi kembali setelah selesai.`;

    return await whatsappService.sendMessage(intlPhone, message);
  },
};
