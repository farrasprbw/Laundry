import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/auth.js";

const router = Router();

router.all("/*splat", async (req, res, next) => {
  try {
    const handler = toNodeHandler(auth);
    await handler(req, res);
  } catch (err) {
    console.error("BetterAuth Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    res.status(500).json({ error: "BetterAuth Error", message, stack });
  }
});

export default router;
