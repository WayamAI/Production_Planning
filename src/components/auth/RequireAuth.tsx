import { Navigate, useLocation } from "react-router-dom";

/**
 * Route guard for the demo app: any email/password accepted at /login sets
 * `matrixops_auth` in localStorage. This component just checks that flag
 * exists and redirects to /login (preserving the intended destination) if not.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthed = localStorage.getItem("matrixops_auth") === "true";

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
