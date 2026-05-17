import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

/**
 * Better Auth React client.
 *
 * Uses a relative baseURL so requests go through the Vite dev proxy
 * (which forwards /api/auth/* to the Express backend).
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:5173",
  plugins: [usernameClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
