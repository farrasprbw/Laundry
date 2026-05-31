import { Router } from "express";
import { promotionService } from "../services/promotion.service.js";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";

export const promotionRouter = Router();

promotionRouter.use(requireAuth);

const createPromotionSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

promotionRouter.get("/", async (req, res) => {
  try {
    const promotions = await promotionService.listAll();
    res.json(promotions);
  } catch (error) {
    console.error("Failed to fetch promotions:", error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

promotionRouter.get("/active", async (req, res) => {
  try {
    const promotions = await promotionService.listActive();
    res.json(promotions);
  } catch (error) {
    console.error("Failed to fetch active promotions:", error);
    res.status(500).json({ error: "Failed to fetch active promotions" });
  }
});

promotionRouter.get("/:id", async (req, res) => {
  try {
    const promotion = await promotionService.getById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    res.json(promotion);
  } catch (error) {
    console.error("Failed to fetch promotion:", error);
    res.status(500).json({ error: "Failed to fetch promotion" });
  }
});

promotionRouter.post("/", async (req, res) => {
  try {
    const data = createPromotionSchema.parse(req.body);
    const existing = await promotionService.getByCode(data.code);
    if (existing) {
      return res.status(400).json({ error: "Promotion code already exists" });
    }
    const promotion = await promotionService.create({
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    });
    res.status(201).json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Failed to create promotion:", error);
    res.status(500).json({ error: "Failed to create promotion" });
  }
});

promotionRouter.patch("/:id", async (req, res) => {
  try {
    const data = createPromotionSchema.partial().parse(req.body);
    if (data.code) {
      const existing = await promotionService.getByCode(data.code);
      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ error: "Promotion code already exists" });
      }
    }
    const promotion = await promotionService.update(req.params.id, {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    });
    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    res.json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Failed to update promotion:", error);
    res.status(500).json({ error: "Failed to update promotion" });
  }
});

promotionRouter.delete("/:id", async (req, res) => {
  try {
    const promotion = await promotionService.delete(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete promotion:", error);
    res.status(500).json({ error: "Failed to delete promotion" });
  }
});
