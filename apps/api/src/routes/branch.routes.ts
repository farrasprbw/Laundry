import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth/middleware.js";
import { branchService } from "../services/branch.service.js";
import type { Response } from "express";

const router = Router();

// GET /api/branches — list all active branches
router.get("/", requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await branchService.listBranches();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to list branches" });
  }
});

export default router;
