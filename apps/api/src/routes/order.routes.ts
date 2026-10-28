import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { orderService } from "../services/order.service.js";
import type { Response } from "express";

const router = Router();

// Helper: get branch scope based on user role
function getBranchScope(req: AuthRequest): string | null | undefined {
  if (req.user?.role === "super_admin") {
    return (req.query.branchId as string) || null;
  }
  return req.user?.branchId || null;
}

router.use(requireAuth);

// GET /api/orders — list orders with pagination & filters (isolated per branch)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const branchId = getBranchScope(req);
    if (req.user?.role !== "super_admin" && !branchId) {
      return res.status(403).json({ error: "User is not assigned to any branch" });
    }

    const { status, paymentStatus, search, page, limit, dateFrom, dateTo } = req.query;
    const result = await orderService.list({
      status: status as string,
      paymentStatus: paymentStatus as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      branchId,
    });
    res.json(result);
  } catch (err) {
    console.error("[Order List Error]", { userId: req.user?.id, error: err });
    res.status(500).json({ error: "Failed to list orders" });
  }
});

// GET /api/orders/:id — order detail (prevent IDOR)
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const branchId = getBranchScope(req);
    const order = await orderService.getById(req.params.id as string, branchId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error("[Order Detail Error]", { orderId: req.params.id, userId: req.user?.id, error: err });
    res.status(500).json({ error: "Failed to get order" });
  }
});

// POST /api/orders — create new order
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, notes, paymentMethodId, paymentStatus, discount, promotionId, pointsUsed, parfume } = req.body;
    if (!customerId || !items || !items.length) {
      return res.status(400).json({ error: "customerId and items are required" });
    }
    const userBranchId = req.user?.branchId || null;
    const order = await orderService.create({ 
      customerId, items, notes, paymentMethodId, paymentStatus, 
      discount: discount ? Number(discount) : 0, 
      promotionId,
      pointsUsed: pointsUsed ? Number(pointsUsed) : 0,
      parfume 
    }, req.user!.id, userBranchId);
    res.status(201).json(order);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(400).json({ error: err.message || "Failed to create order" });
  }
});

// PUT /api/orders/:id — edit order (admin only, verified branch)
router.put("/:id", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { items, notes, paymentMethodId, paymentStatus, discount, parfume } = req.body;
    const branchId = getBranchScope(req);
    const existing = await orderService.getById(req.params.id as string, branchId);
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }
    const order = await orderService.update(req.params.id as string, { items, notes, paymentMethodId, paymentStatus, discount: discount ? Number(discount) : 0, parfume });
    res.json(order);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(400).json({ error: err.message || "Failed to update order" });
  }
});

// PATCH /api/orders/:id/status — advance status (verified branch)
router.patch("/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });

    const branchId = getBranchScope(req);
    const order = await orderService.updateStatus(req.params.id as string, status, branchId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(400).json({ error: err.message || "Failed to update order status" });
  }
});

// PATCH /api/orders/:id/payment — update payment status (verified branch)
router.patch("/:id/payment", async (req: AuthRequest, res: Response) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) return res.status(400).json({ error: "paymentStatus is required" });

    const branchId = getBranchScope(req);
    const order = await orderService.updatePayment(req.params.id as string, paymentStatus, branchId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(400).json({ error: err.message || "Failed to update payment status" });
  }
});

// DELETE /api/orders/:id — soft delete (admin only, verified branch)
router.delete("/:id", requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const branchId = getBranchScope(req);
    const order = await orderService.delete(req.params.id as string, branchId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted", order });
  } catch (err) {
    console.error("[Order Delete Error]", { orderId: req.params.id, userId: req.user?.id, error: err });
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
