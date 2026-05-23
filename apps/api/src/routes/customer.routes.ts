import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { customerService } from "../services/customer.service.js";
import type { Response } from "express";

const router = Router();

// All customer routes require admin or super_admin
router.use(requireAuth);
router.use(requireRole("admin", "super_admin"));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { search, page, limit, sort } = req.query;
    const result = await customerService.list({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sort: sort as "asc" | "desc",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to list customers" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const customer = await customerService.getById(req.params.id as string);
    if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
    res.json(customer);
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    res.status(400).json({ error: err.message || "Failed to create customer" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone) { res.status(400).json({ error: "Name and phone are required" }); return; }
    const customer = await customerService.create({ name, phone, address });
    res.status(201).json(customer);
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err?.code === "23505") { res.status(409).json({ error: "Phone number already exists" }); return; }
    res.status(500).json({ error: "Failed to create customer" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const customer = await customerService.update(req.params.id as string, req.body);
    if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
    res.json(customer);
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err?.code === "23505") { res.status(409).json({ error: "Phone number already exists" }); return; }
    res.status(500).json({ error: "Failed to update customer" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const customer = await customerService.delete(req.params.id as string);
    if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
    res.json({ message: "Customer deleted", customer });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(400).json({ error: err.message || "Failed to update customer" });
  }
});

export default router;
