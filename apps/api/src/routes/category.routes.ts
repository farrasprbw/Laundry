import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { categoryService } from "../services/category.service.js";
import type { Response } from "express";

const router = Router();

// GET routes: any authenticated user (for dropdown selectors)
router.get("/", requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await categoryService.listActive();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to list categories" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const category = await categoryService.getById(req.params.id as string);
    if (!category) { res.status(404).json({ error: "Category not found" }); return; }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to get category" });
  }
});

// CUD routes: admin or super_admin only
router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, pricePerUnit, unit, estimatedDurationDays } = req.body;
    if (!name || !pricePerUnit || !unit || !estimatedDurationDays) {
      res.status(400).json({ error: "Missing required fields: name, pricePerUnit, unit, estimatedDurationDays" }); return;
    }
    const category = await categoryService.create({ name, description, icon, pricePerUnit, unit, estimatedDurationDays });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const category = await categoryService.update(req.params.id as string, req.body);
    if (!category) { res.status(404).json({ error: "Category not found" }); return; }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const category = await categoryService.delete(req.params.id as string);
    if (!category) { res.status(404).json({ error: "Category not found" }); return; }
    res.json({ message: "Category deleted", category });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
