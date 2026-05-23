import { Router } from "express";
import { autoFinishService } from "../services/auto-finish.service.js";
import type { Request, Response } from "express";

const router = Router();

/**
 * GET /api/cron/auto-finish
 *
 * Endpoint for automated order finishing. Can be called by:
 * - Vercel Cron Jobs in production (protected by CRON_SECRET)
 * - setInterval in development mode
 *
 * Query params:
 *   ?key=<CRON_SECRET>  — required in production for security
 */
router.get("/auto-finish", async (req: Request, res: Response) => {
  try {
    // In production, verify the cron secret (Vercel sends it via Authorization header)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.authorization;
      if (req.query.key !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    const count = await autoFinishService.autoFinishOrders();

    res.json({
      success: true,
      autoFinished: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[CRON] Auto-finish failed:", err);
    res.status(500).json({ error: "Auto-finish failed" });
  }
});

export default router;
