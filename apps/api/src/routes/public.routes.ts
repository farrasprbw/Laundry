import { Router } from "express";
import { db } from "../db/index.js";
import { orders, customers, categories, paymentMethods } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import type { Request, Response } from "express";

const router = Router();

// GET /api/public/invoice/:invoiceNumber — fetch full order details (no auth)
router.get("/invoice/:invoiceNumber", async (req: Request, res: Response) => {
  try {
    const invoiceNumber = decodeURIComponent(req.params.invoiceNumber as string);

    const [result] = await db
      .select({
        order: orders,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          address: customers.address,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          pricePerUnit: categories.pricePerUnit,
          unit: categories.unit,
          estimatedDurationMinutes: categories.estimatedDurationMinutes,
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
      .where(
        and(eq(orders.invoiceNumber, invoiceNumber), isNull(orders.deletedAt))
      );

    if (!result) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    res.json({
      ...result.order,
      customer: result.customer,
      category: result.category,
      paymentMethod: result.paymentMethod,
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
