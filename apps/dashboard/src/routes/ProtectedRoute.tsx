import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "../hooks/use-auth";
import { Layout } from "../components/layout/Layout";
import { WorkerLayout } from "../components/layout/WorkerLayout";
import { authClient } from "../lib/auth-client";
import type { UserRole } from "../types/api";

/**
 * Auth guard component.
 * - Shows a loading spinner while the session is being fetched.
 * - Redirects to /login if no active session or on error.
 * - Renders Layout → Outlet when authenticated.
 * - Automatically logs out after 1 hour of inactivity.
 */
export function ProtectedRoute() {
  const { data: session, isPending, error } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;

    let timeoutId: number;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 1 hour = 3600000 ms
      timeoutId = window.setTimeout(async () => {
        try {
          await authClient.signOut();
          navigate("/login", { replace: true });
        } catch (e) {
          // ignore
        }
      }, 3600000);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session, navigate]);

  if (isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return <Navigate to="/login" replace />;
  }

  const userRole = ((session?.user as { role?: UserRole })?.role) || "worker";

  if (userRole === "worker") {
    return <WorkerLayout />;
  }

  return (
    <Layout />
  );
}

/**
 * Role-based guard — wraps individual routes.
 * Redirects to /dashboard if user lacks the required role.
 */
export function RoleProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userRole = ((session?.user as { role?: UserRole })?.role) || "worker";

  if (!roles.includes(userRole)) {
    // If worker, they don't have dashboard access, so redirect to worker dashboard
    if (userRole === "worker") {
      return <Navigate to="/worker/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Reverse guard — redirects authenticated users away from /login.
 * If session check fails, just show the children (login page).
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    const userRole = ((session?.user as { role?: UserRole })?.role) || "worker";
    if (userRole === "worker") {
      return <Navigate to="/worker/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
