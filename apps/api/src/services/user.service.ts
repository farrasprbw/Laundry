import { db } from "../db/index.js";
import { user, account } from "../db/schema.js";
import { eq, sql, ne } from "drizzle-orm";
import { auth } from "../auth/auth.js";

type UserRole = "super_admin" | "admin" | "worker";

const VALID_ROLES: UserRole[] = ["super_admin", "admin", "worker"];

export const userService = {
  /**
   * List all users with basic info.
   */
  async listUsers() {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(user.createdAt);

    return users;
  },

  /**
   * Get a single user by ID.
   */
  async getUserById(id: string) {
    const [result] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id));

    return result ?? null;
  },

  /**
   * Create a new user with a specific role using Better Auth's
   * sign-up mechanism under the hood.
   */
  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    if (!VALID_ROLES.includes(input.role)) {
      throw new Error(`Invalid role: ${input.role}. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    // Use Better Auth API to create user (handles password hashing)
    const result = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
      },
    });

    if (!result?.user) {
      throw new Error("Failed to create user");
    }

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: (result.user as any).role ?? input.role,
      createdAt: result.user.createdAt,
    };
  },

  /**
   * Update a user's role.
   */
  async updateUserRole(id: string, role: UserRole) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    const [updated] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      });

    return updated ?? null;
  },

  /**
   * Update a user's profile (name, email).
   */
  async updateUser(id: string, input: { name?: string; email?: string }) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;

    const [updated] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      });

    return updated ?? null;
  },

  /**
   * Delete a user and their associated accounts/sessions.
   */
  async deleteUser(id: string) {
    // Delete associated accounts first
    await db.delete(account).where(eq(account.userId, id));

    // Delete the user
    const [deleted] = await db
      .delete(user)
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
      });

    return deleted ?? null;
  },
};
