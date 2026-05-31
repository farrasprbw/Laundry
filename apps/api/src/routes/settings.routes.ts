import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { settingsService } from "../services/settings.service.js";
import type { Response, Request } from "express";

const router = Router();

router.use(requireAuth);

// GET all settings (authenticated users can read)
router.get("/", async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getAll();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// PUT update settings (admin and super_admin only)
router.put("/", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    await settingsService.bulkUpsert(settings);
    
    // Return the updated settings
    const updatedSettings = await settingsService.getAll();
    res.json(updatedSettings);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
