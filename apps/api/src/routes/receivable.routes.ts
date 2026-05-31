import { Router, Request, Response } from "express";
import { receivableService } from "../services/receivable.service.js";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";

const router = Router();

// Only admin and super_admin can access receivable data
router.use(requireAuth);
router.use(requireRole("admin", "super_admin"));

// GET /api/receivables/summary
router.get("/summary", async (_req: AuthRequest, res: Response) => {
  try {
    const summary = await receivableService.getSummary();
    res.json(summary);
  } catch (err) {
    console.error("Failed to get receivables summary:", err);
    res.status(500).json({ error: "Failed to get receivables summary" });
  }
});

// GET /api/receivables/aging
router.get("/aging", async (_req: AuthRequest, res: Response) => {
  try {
    const aging = await receivableService.getAging();
    res.json(aging);
  } catch (err) {
    console.error("Failed to get receivables aging:", err);
    res.status(500).json({ error: "Failed to get receivables aging" });
  }
});

// GET /api/receivables/by-customer
router.get("/by-customer", async (_req: AuthRequest, res: Response) => {
  try {
    const customers = await receivableService.getByCustomer();
    res.json(customers);
  } catch (err) {
    console.error("Failed to get receivables by customer:", err);
    res.status(500).json({ error: "Failed to get receivables by customer" });
  }
});

// GET /api/receivables/by-customer/:customerId/orders
router.get("/by-customer/:customerId/orders", async (req: AuthRequest, res: Response) => {
  try {
    const orders = await receivableService.getOrdersByCustomer(req.params.customerId as string);
    res.json(orders);
  } catch (err) {
    console.error("Failed to get customer unpaid orders:", err);
    res.status(500).json({ error: "Failed to get customer unpaid orders" });
  }
});

// POST /api/receivables/reminder/:customerId
router.post("/reminder/:customerId", async (req: AuthRequest, res: Response) => {
  try {
    const result = await receivableService.sendReminder(req.params.customerId as string);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (err) {
    console.error("Failed to send reminder:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to send reminder" });
  }
});

export default router;
