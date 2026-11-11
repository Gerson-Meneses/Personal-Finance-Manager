import { Navigate, Outlet, useLocation } from "react-router-dom";
import "./publicLayout.css"
import { useAuthContext } from "../../features/auth/useAuthContext";
import LoadingScreen from "../../shared/components/LoadingScreen/LoadingScreen";
import { getIcon } from "../../shared/utils/GetIcon";
import { ThemeToggle } from "../../shared/theme/ThemeToggle";

export function PublicLayout() {

  const { user, loading } = useAuthContext()
  const location = useLocation()
  if (loading) return <LoadingScreen />

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container">
      <div className="public-shell">
        <div className="public-brand">
          <span className="public-brand-icon">{getIcon("LayersIcon", { color: "#f1c40f", size: 24 })}</span>
          <div className="public-brand-copy">
            <span className="public-brand-name">Finance App</span>
            <span className="public-brand-tagline">Tus finanzas, en un solo lugar</span>
          </div>
        </div>
        <ThemeToggle className="public-theme-toggle" />
        <div className="page-transition" key={location.pathname}>
          <Outlet></Outlet>
        </div>
      </div>
    </div>
  );
}
