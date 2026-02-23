import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import type { JSX } from "react";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Checking session...</p>;

  if (!user) return <Navigate to="/login" />;

  return children;
}
