import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../auth/middleware.js";
import { userService } from "../services/user.service.js";
import type { Response } from "express";

const router = Router();

// All user management routes require super_admin
router.use(requireAuth, requireRole("super_admin"));

// GET /api/users — list all users
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to list users" });
  }
});

// GET /api/users/:id — get user detail
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id as string);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// POST /api/users — create a new user
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) {
      res.status(400).json({ error: "Missing required fields: name, username, password, role" }); return;
    }
    const user = await userService.createUser({ name, username, password, role });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create user" });
  }
});

// PATCH /api/users/:id/role — update user role
router.patch("/:id/role", async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!role) { res.status(400).json({ error: "role is required" }); return; }

    // Prevent super_admin from changing their own role
    if (req.params.id === req.user?.id) {
      res.status(400).json({ error: "Cannot change your own role" }); return;
    }

    const user = await userService.updateUserRole(req.params.id as string, role);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update user role" });
  }
});

// PUT /api/users/:id — update user profile
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.id as string, req.body);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/users/:id — delete user
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user?.id) {
      res.status(400).json({ error: "Cannot delete your own account" }); return;
    }

    const user = await userService.deleteUser(req.params.id as string);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ message: "User deleted", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
