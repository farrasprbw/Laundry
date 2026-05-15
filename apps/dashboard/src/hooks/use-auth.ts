import { useNavigate } from "react-router-dom";
import { useSession, signIn, signUp, signOut } from "../lib/auth-client";
import type { UserRole } from "../types/api";

export { useSession };

/**
 * Hook for logging in with username + password.
 * Returns a handler function + loading / error state.
 */
export function useLogin() {
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    const { data, error } = await signIn.username({ username, password });
    if (error) {
      throw new Error(error.message ?? "Login failed");
    }
    if ((data?.user as { role?: UserRole })?.role === "worker") {
      navigate("/orders");
    } else {
      navigate("/dashboard");
    }
  };

  return { login };
}

/**
 * Hook for signing up a new user.
 */
export function useSignUp() {
  const navigate = useNavigate();

  const register = async (
    username: string,
    password: string,
    name: string,
  ) => {
    const { data, error } = await signUp.email({
      email: `${username}@dummy.com`, // dummy email if email is still required
      username,
      password,
      name,
    });
    if (error) {
      throw new Error(error.message ?? "Sign up failed");
    }
    if ((data?.user as { role?: UserRole })?.role === "worker") {
      navigate("/orders");
    } else {
      navigate("/dashboard");
    }
  };

  return { register };
}

/**
 * Hook for logging out.
 */
export function useLogout() {
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    navigate("/login");
  };

  return { logout };
}
