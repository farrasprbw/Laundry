import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/auth.js";

const router = Router();

router.all("/*splat", async (req, res, next) => {
  try {
    const handler = toNodeHandler(auth);
    await handler(req, res);
  } catch (err: any) {
    console.error("BetterAuth Error:", err);
    res.status(500).json({ error: "BetterAuth Error", message: err.message, stack: err.stack });
  }
});

export default router;
