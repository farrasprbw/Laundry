import { Navigate } from "react-router-dom";
import { useSession } from "../hooks/use-auth";
import { Layout } from "../components/layout/Layout";

/**
 * Auth guard component.
 * - Shows a loading spinner while the session is being fetched.
 * - Redirects to /login if no active session or on error.
 * - Renders Layout → Outlet when authenticated.
 */
export function ProtectedRoute() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
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

  return (
    <Layout />
  );
}

/**
 * Reverse guard — redirects authenticated users away from /login.
 * If session check fails, just show the children (login page).
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
