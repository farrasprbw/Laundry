import { db } from "../db/index.js";
import { orders, customers, categories, paymentMethods } from "../db/schema.js";
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
import { whatsappService } from "./whatsapp.service.js";
import { env } from "../env.js";

interface CreateOrderInput {
  customerId: string;
  categoryId: string;
  quantity: number;
  notes?: string;
  paymentMethodId?: string;
  paymentStatus?: string;
  discount?: number;
  parfume?: string;
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
            estimatedDurationDays: categories.estimatedDurationDays,
          },
          paymentMethod: {
            id: paymentMethods.id,
            name: paymentMethods.name,
          },
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(categories, eq(orders.categoryId, categories.id))
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

    return {
      data: data.map((row) => ({
        ...row.order,
        customer: row.customer,
        category: row.category,
        paymentMethod: row.paymentMethod,
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
        paymentMethod: paymentMethods,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(categories, eq(orders.categoryId, categories.id))
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

    if (!result) return null;

    return {
      ...result.order,
      customer: result.customer,
      category: result.category,
      paymentMethod: result.paymentMethod,
    };
  },

  async create(input: CreateOrderInput, createdById: string) {
    const category = await categoryService.getById(input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const invoiceNumber = await generateInvoiceNumber();
    const subtotal = Math.round(input.quantity * category.pricePerUnit);
    const discountAmount = input.discount ?? 0;
    const totalPrice = Math.max(0, subtotal - discountAmount);

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
        paymentMethodId: input.paymentMethodId ?? null,
        paymentStatus: input.paymentStatus ?? "UNPAID",
        discount: input.discount ?? 0,
        parfume: input.parfume ?? null,
      })
      .returning();

    // Auto-send new order notification
    this.sendNewOrderWhatsAppNotification(order.id).catch((err) =>
      console.error(`Failed to send new order WA for ${order.id}:`, err)
    );

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

    const phone = order.customer.phone.replace(/\D/g, "");
    // Convert 0xxx to 62xxx for Indonesian numbers
    const intlPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;

    const qty = Number(order.quantity);
    const unitLabel = order.category?.unit ?? "kg";
    const categoryName = order.category?.name ?? "Laundry";
    const totalAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalPrice);
    const statusLabel = order.paymentStatus === 'PAID' ? 'LUNAS ✅' : 'BELUM BAYAR ❌';

    const message = `Halo Kak *${order.customer.name}*! 👋✨

Pakaian bersih dan wangi sudah menanti! Cucian Kakak dengan detail berikut telah *SELESAI* dan siap untuk dijemput:

🧾 *No. Invoice:* ${order.invoiceNumber}
🧺 *Layanan:* ${categoryName} (${qty} ${unitLabel})
💰 *Total Tagihan:* ${totalAmount}
💳 *Status Pembayaran:* ${statusLabel}

Terima kasih telah mempercayakan cucian Kakak kepada *Maxpress Laundromat*! 🙏✨

---
*Syarat & Ketentuan Pengambilan:*
⚠️ Pengambilan barang harus disertai invoice.
⚠️ Komplain berlaku maksimal 24 jam setelah barang diambil.
⚠️ Kain luntur/berkerut karena sifat kain di luar tanggung jawab kami.
⚠️ Cucian yang tidak diambil dalam waktu 1 bulan, bila rusak/hilang bukan tanggung jawab kami.`;

    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;

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

    // Use Fonnte to send message directly from server
    return await whatsappService.sendMessage(data.phone, data.message);
  },

  async sendNewOrderWhatsAppNotification(id: string) {
    const order = await this.getById(id);
    if (!order || !order.customer) return false;

    const phone = order.customer.phone.replace(/\D/g, "");
    const intlPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;

    const qty = Number(order.quantity);
    const unitLabel = order.category?.unit ?? "kg";
    const categoryName = order.category?.name ?? "Laundry";
    
    // Formatting currency
    const formatCurrency = (val: number) => 
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const pricePerUnit = order.category?.pricePerUnit ?? 0;
    const paymentStatusLabel = order.paymentStatus === "PAID" ? "LUNAS ✅" : "BELUM BAYAR ❌";
    const pmName = order.paymentMethod?.name ?? "-";
    const parfumeLabel = order.parfume ?? "Standard";

    // Estimated completion time
    const createdAt = new Date(order.createdAt);
    const estimatedDays = order.category?.estimatedDurationDays ?? 1;
    const estDate = new Date(createdAt);
    estDate.setDate(estDate.getDate() + estimatedDays - 1);
    estDate.setHours(17, 0, 0, 0);
    const estSelesai = estDate.toLocaleDateString("id-ID", {
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

    const invoiceUrl = `${env.CORS_ORIGIN}/invoice/${order.id}`;

    const message = `*MAXPRESS LAUNDROMAT*
Apartment Amethys, Jl. Rajawali Selatan II No. 6 B, Jakarta Pusat
HP : 0812-9678-8330

━━━━━━━━━━━━━━━━━━━━

📋 *DETAIL ORDER*
No Invoice  : ${order.invoiceNumber}
Pelanggan   : *${order.customer.name}*
Tgl Masuk   : ${formattedDate}
Est Selesai : ${estSelesai}

━━━━━━━━━━━━━━━━━━━━

🧺 *${categoryName}*
   ${qty} ${unitLabel} x ${formatCurrency(pricePerUnit)}
   *Total       : ${formatCurrency(order.totalPrice)}*

━━━━━━━━━━━━━━━━━━━━

💳 Status Bayar : ${paymentStatusLabel}
💰 Pembayaran : ${pmName}
📌 Status     : SEDANG DIPROSES
🌸 Parfum     : ${parfumeLabel}
📝 Notes      : ${order.notes || "-"}
   BCA 6565125439 a/n NUR PUJI LESTARI

━━━━━━━━━━━━━━━━━━━━

📄 *Lihat Invoice Online:*
${invoiceUrl}

Terima kasih telah mempercayakan cucian Kakak kepada *Maxpress Laundromat*! 🙏
Cucian sedang kami proses, kami akan hubungi kembali setelah selesai.`;

    return await whatsappService.sendMessage(intlPhone, message);
  },
};
