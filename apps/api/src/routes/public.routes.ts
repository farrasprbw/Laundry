import { Router } from "express";
import { db } from "../db/index.js";
import { orders, customers, categories, paymentMethods } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { settingsService } from "../services/settings.service.js";
import type { Request, Response } from "express";

const router = Router();

// GET /api/public/settings — fetch public store settings (no auth)
router.get("/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await settingsService.getAll();
    // Only return safe public settings
    const publicSettings = {
      store_name: settings.store_name,
      store_address: settings.store_address,
      store_address_full: settings.store_address_full,
      store_phone: settings.store_phone,
      store_logo_url: settings.store_logo_url,
      store_maps_url: settings.store_maps_url,
    };
    res.json(publicSettings);
  } catch (err) {
    console.error("Failed to fetch public settings:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// GET /api/public/invoice/:invoiceNumber — fetch full order details (no auth)
router.get("/invoice/:invoiceNumber", async (req: Request, res: Response) => {
  try {
    const invoiceNumber = decodeURIComponent(req.params.invoiceNumber as string);

    const { orderItems } = await import("../db/schema.js");
    const [result] = await db
      .select({
        order: orders,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          address: customers.address,
        },
        paymentMethod: {
          id: paymentMethods.id,
          name: paymentMethods.name,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(
        and(eq(orders.invoiceNumber, invoiceNumber), isNull(orders.deletedAt))
      );

    if (!result) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const itemsData = await db
      .select({
        item: orderItems,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          pricePerUnit: categories.pricePerUnit,
          unit: categories.unit,
          estimatedDurationDays: categories.estimatedDurationDays,
        },
      })
      .from(orderItems)
      .innerJoin(categories, eq(orderItems.categoryId, categories.id))
      .where(eq(orderItems.orderId, result.order.id));

    res.json({
      ...result.order,
      customer: result.customer,
      paymentMethod: result.paymentMethod,
      items: itemsData.map((i) => ({ ...i.item, category: i.category })),
    });
  } catch (err) {
    console.error("Failed to fetch invoice:", err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// POST /api/public/invoice/:invoiceNumber/rating — submit a rating (1-5)
router.post(
  "/invoice/:invoiceNumber/rating",
  async (req: Request, res: Response) => {
    try {
      const invoiceNumber = decodeURIComponent(req.params.invoiceNumber as string);
      const { rating } = req.body;

      if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
        res
          .status(400)
          .json({ error: "Rating must be a number between 1 and 5" });
        return;
      }

      // Find the order
      const [existing] = await db
        .select({ id: orders.id, rating: orders.rating })
        .from(orders)
        .where(
          and(
            eq(orders.invoiceNumber, invoiceNumber),
            isNull(orders.deletedAt)
          )
        );

      if (!existing) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }

      // Check if already rated
      if (existing.rating !== null) {
        res.status(400).json({ error: "Rating already submitted" });
        return;
      }

      // Save rating
      const [updated] = await db
        .update(orders)
        .set({ rating, updatedAt: new Date() })
        .where(eq(orders.id, existing.id))
        .returning();

      res.json({ message: "Rating submitted successfully", rating: updated.rating });
    } catch (err) {
      console.error("Failed to submit rating:", err);
      res.status(500).json({ error: "Failed to submit rating" });
    }
  }
);

export default router;
