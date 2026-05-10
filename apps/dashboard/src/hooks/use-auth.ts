import { useNavigate } from "react-router-dom";
import { useSession, signIn, signUp, signOut } from "../lib/auth-client";

export { useSession };

/**
 * Hook for logging in with email + password.
 * Returns a handler function + loading / error state.
 */
export function useLogin() {
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const { error } = await signIn.email({ email, password });
    if (error) {
      throw new Error(error.message ?? "Login failed");
    }
    navigate("/dashboard");
  };

  return { login };
}

/**
 * Hook for signing up a new user.
 */
export function useSignUp() {
  const navigate = useNavigate();

  const register = async (
    email: string,
    password: string,
    name: string,
  ) => {
    const { error } = await signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      throw new Error(error.message ?? "Sign up failed");
    }
    navigate("/dashboard");
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
