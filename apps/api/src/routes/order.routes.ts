import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { orderService } from "../services/order.service.js";
import type { Response } from "express";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page, limit, dateFrom, dateTo } = req.query;
    const result = await orderService.list({
      status: status as string, search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      dateFrom: dateFrom as string, dateTo: dateTo as string,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to list orders" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const order = await orderService.getById(req.params.id as string);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to get order" });
  }
});

router.post("/", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, categoryId, quantity, notes } = req.body;
    if (!customerId || !categoryId || !quantity) {
      res.status(400).json({ error: "customerId, categoryId, and quantity are required" }); return;
    }
    const order = await orderService.create({ customerId, categoryId, quantity: Number(quantity), notes }, req.user!.id);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create order" });
  }
});

router.put("/:id", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const order = await orderService.update(req.params.id as string, req.body);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Status transition — all authenticated users can advance status
router.patch("/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "status is required" }); return; }
    const order = await orderService.updateStatus(req.params.id as string, status);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update status" });
  }
});

router.delete("/:id", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const order = await orderService.delete(req.params.id as string);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json({ message: "Order deleted", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// WhatsApp notification link
router.get("/:id/wa-link", async (req: AuthRequest, res: Response) => {
  try {
    const result = await orderService.generateWhatsAppLink(req.params.id as string);
    if (!result) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate WhatsApp link" });
  }
});

export default router;
