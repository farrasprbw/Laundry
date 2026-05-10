import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { expenseService } from "../services/expense.service.js";
import type { Response } from "express";

const router = Router();
router.use(requireAuth);
router.use(requireRole("admin", "super_admin"));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, category, search, page, limit } = req.query;
    const result = await expenseService.list({
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
      category: category as string, search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to list expenses" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.getById(req.params.id as string);
    if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to get expense" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { category, description, amount, expenseDate } = req.body;
    if (!category || !amount || !expenseDate) {
      res.status(400).json({ error: "category, amount, and expenseDate are required" }); return;
    }
    const expense = await expenseService.create({ category, description, amount: Number(amount), expenseDate }, req.user!.id);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.update(req.params.id as string, req.body);
    if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to update expense" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const expense = await expenseService.delete(req.params.id as string);
    if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
    res.json({ message: "Expense deleted", expense });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
