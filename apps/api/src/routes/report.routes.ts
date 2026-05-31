import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { reportService } from "../services/report.service.js";
import type { Response } from "express";

const router = Router();
router.use(requireAuth);

// Dashboard endpoints — any authenticated user
router.get("/dashboard-stats", async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await reportService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

router.get("/financial-trend", async (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period ? parseInt(req.query.period as string) : 7;
    const trend = await reportService.getFinancialTrend(period);
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: "Failed to get financial trend" });
  }
});

router.get("/recent-orders", async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await reportService.getRecentOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get recent orders" });
  }
});

router.get("/pending-pickups", async (_req: AuthRequest, res: Response) => {
  try {
    const pickups = await reportService.getPendingPickups();
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ error: "Failed to get pending pickups" });
  }
});

// Report endpoints — admin & super_admin
router.get("/transactions", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const transactions = await reportService.getTransactions(dateFrom as string | undefined, dateTo as string | undefined);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

router.get("/summary", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (!dateFrom || !dateTo) { res.status(400).json({ error: "dateFrom and dateTo are required" }); return; }
    const summary = await reportService.getSummary(dateFrom as string, dateTo as string);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to get report summary" });
  }
});

router.get("/export", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (!dateFrom || !dateTo) { res.status(400).json({ error: "dateFrom and dateTo are required" }); return; }
    const buffer = await reportService.exportExcel(dateFrom as string, dateTo as string);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=report_${dateFrom}_${dateTo}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Failed to export report" });
  }
});

router.get("/category-breakdown", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await reportService.getCategoryBreakdown(dateFrom as string | undefined, dateTo as string | undefined);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get category breakdown" });
  }
});

router.get("/payment-breakdown", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await reportService.getPaymentBreakdown(dateFrom as string | undefined, dateTo as string | undefined);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get payment breakdown" });
  }
});

router.get("/monthly-comparison", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const data = await reportService.getMonthlyComparison(months);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get monthly comparison" });
  }
});

export default router;
