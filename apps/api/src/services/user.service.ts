import { db } from "../db/index.js";
import { user, account, session } from "../db/schema.js";
import { eq, isNull, and } from "drizzle-orm";
import { auth } from "../auth/auth.js";
import { hashPassword } from "better-auth/crypto";

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
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(isNull(user.deletedAt))
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
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(and(eq(user.id, id), isNull(user.deletedAt)));

    return result ?? null;
  },

  /**
   * Create a new user with a specific role using Better Auth's
   * sign-up mechanism under the hood.
   */
  async createUser(input: {
    name: string;
    email?: string;
    username: string;
    password: string;
    role: UserRole;
  }) {
    if (!VALID_ROLES.includes(input.role)) {
      throw new Error(`Invalid role: ${input.role}. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    // Since email is required by better-auth base config, fallback to a dummy if missing
    const finalEmail = input.email || `${input.username.toLowerCase().replace(/\s+/g, '')}@laundry.local`;

    // Use Better Auth API to create user (handles password hashing)
    const result = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: finalEmail,
        password: input.password,
        username: input.username,
        role: input.role,
      },
    });

    if (!result?.user) {
      throw new Error("Failed to create user");
    }

    return {
      id: result.user.id,
      username: (result.user as any).username ?? input.username,
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
        username: user.username,
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
  async updateUser(id: string, input: { name?: string; email?: string; username?: string; password?: string }) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.username !== undefined) updateData.username = input.username;

    let updatedUser = null;

    if (Object.keys(updateData).length > 1) { // more than just updatedAt
      const [updated] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, id))
        .returning({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt,
        });
      updatedUser = updated;
    } else {
      updatedUser = await this.getUserById(id);
    }

    if (input.password) {
      const hashedPassword = await hashPassword(input.password);
      await db.update(account)
        .set({ password: hashedPassword })
        .where(eq(account.userId, id));
    }

    return updatedUser ?? null;
  },

  /**
   * Delete a user and their associated accounts/sessions.
   */
  async deleteUser(id: string) {
    // Delete associated sessions to log them out immediately
    await db.delete(session).where(eq(session.userId, id));

    // Delete associated accounts
    await db.delete(account).where(eq(account.userId, id));

    // Soft delete the user
    const [deleted] = await db
      .update(user)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(user.id, id), isNull(user.deletedAt)))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
      });

    return deleted ?? null;
  },
};
