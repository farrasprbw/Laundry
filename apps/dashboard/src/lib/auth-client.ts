import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client.
 *
 * Uses a relative baseURL so requests go through the Vite dev proxy
 * (which forwards /api/auth/* to the Express backend).
 */
export const authClient = createAuthClient({
  baseURL: "http://localhost:5173",
});

export const { useSession, signIn, signUp, signOut } = authClient;
