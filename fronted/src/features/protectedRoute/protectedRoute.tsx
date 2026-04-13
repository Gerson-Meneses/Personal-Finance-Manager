import { Navigate } from "react-router-dom";

import type { JSX } from "react";
import { useAuthContext } from "../auth/authContext";
import LoadingScreen from "../../shared/components/LoadingScreen/LoadingScreen";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthContext();

  if (loading) return <LoadingScreen></LoadingScreen>;

  if (!user) return <Navigate to="/login" />;

  return children;
}
