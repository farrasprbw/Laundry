import type { Request, Response, NextFunction } from "express";
import { auth } from "./auth.js";
import { fromNodeHeaders } from "better-auth/node";

/**
 * Extended Express Request with auth context.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  session?: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * Middleware: Require any authenticated user.
 * Populates `req.user` and `req.session`.
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!result) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = result.user as AuthRequest["user"];
    req.session = result.session as AuthRequest["session"];
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Middleware factory: Require user to have one of the specified roles.
 * Must be used AFTER `requireAuth`.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Required role: ${roles.join(" or ")}`,
      });
      return;
    }

    next();
  };
}
