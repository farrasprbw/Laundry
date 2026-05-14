import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth/middleware.js";
import { dashboardService } from "../services/dashboard.service.js";
import type { Response } from "express";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/stats — summary stats
router.get("/stats", async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

// GET /api/dashboard/recent-orders — last N orders
router.get("/recent-orders", async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const orders = await dashboardService.getRecentOrders(limit);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get recent orders" });
  }
});

// GET /api/dashboard/financial-trend — daily income/expenses for last N days
router.get("/financial-trend", async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const trend = await dashboardService.getFinancialTrend(days);
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: "Failed to get financial trend" });
  }
});

export default router;
