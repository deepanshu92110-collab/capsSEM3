import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceShell from "./WorkspaceShell";
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center">Restoring your session…</div>;
  return user ? (
    <WorkspaceShell><Outlet /></WorkspaceShell>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
