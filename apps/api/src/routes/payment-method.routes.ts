import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { paymentMethodService } from "../services/payment-method.service.js";
import type { Response } from "express";

const router = Router();

// GET routes: any authenticated user
router.get("/", requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const methods = await paymentMethodService.listActive();
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: "Failed to list payment methods" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const method = await paymentMethodService.getById(req.params.id as string);
    if (!method) { res.status(404).json({ error: "Payment method not found" }); return; }
    res.json(method);
  } catch (err) {
    res.status(500).json({ error: "Failed to get payment method" });
  }
});

// CUD routes: admin or super_admin only
router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Missing required field: name" }); return;
    }
    const method = await paymentMethodService.create({ name });
    res.status(201).json(method);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Payment method with this name already exists" }); return;
    }
    res.status(500).json({ error: "Failed to create payment method" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const method = await paymentMethodService.update(req.params.id as string, req.body);
    if (!method) { res.status(404).json({ error: "Payment method not found" }); return; }
    res.json(method);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Payment method with this name already exists" }); return;
    }
    res.status(500).json({ error: "Failed to update payment method" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const method = await paymentMethodService.delete(req.params.id as string);
    if (!method) { res.status(404).json({ error: "Payment method not found" }); return; }
    res.json({ message: "Payment method deleted", method });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});

export default router;
