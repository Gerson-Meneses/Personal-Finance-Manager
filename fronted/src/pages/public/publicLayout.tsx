import { Navigate, Outlet } from "react-router-dom";
import "./publicLayout.css"
import { useAuthContext } from "../../features/auth/authContext";
import LoadingScreen from "../../shared/components/LoadingScreen/LoadingScreen";

export function PublicLayout() {

  const { user, loading } = useAuthContext()
  if (loading) return <LoadingScreen />

  if (user) {
    return <Navigate to="/" replace />
  }

  return <div className="container"><Outlet></Outlet></div>;
}
