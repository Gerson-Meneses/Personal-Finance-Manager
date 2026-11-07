import { useAuthContext } from "../../features/auth/authContext";
import { useLogout } from "../../features/auth/useLogout";
import { matchPath, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ArrowLeftRight, HandCoins, Home, Menu, Plus, ShieldCheck, Tags, Wallet, X } from "lucide-react";
import ModalPortal from "../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../shared/components/InfoModal/InfoModal";
import TransactionForm from "../../features/transactions/components/TransactionForm/TransactionForm";
import { useTransactions } from "../../features/transactions/hooks";
import LoadingScreen from "../../shared/components/LoadingScreen/LoadingScreen";
import "./privateLayout.css"
import { getIcon } from "../../shared/utils/GetIcon";
import { useIsAdmin } from "../../features/auth/useIsAdmin";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export function PrivateLayout() {
  const { user, loading } = useAuthContext()
  const logout = useLogout()
  const location = useLocation()
  const navigate = useNavigate()
  const { saveTransaction } = useTransactions()
  const [modal, setModal] = useState(false)
  const [createdInfo, setCreatedInfo] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = useIsAdmin()

  const isHome = location.pathname === "/"

  // Si estamos en el detalle de una tarjeta/cuenta, preseleccionarla en el form
  const accountMatch = matchPath("/accounts/:id", location.pathname)
  const defaultAccountId = accountMatch?.params.id

  if (loading) return <LoadingScreen />
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            {getIcon("LayersIcon", { color: "#f1c40f" })}
          </div>
          <div className="header-titles">
            <span className="header-app-name">Finance App</span>
            <span className="header-user-name">{user?.name}</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Navegación principal">
          <NavLink to="/" end className="header-nav-link">
            <Home size={17} />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/transactions" className="header-nav-link">
            <ArrowLeftRight size={17} />
            <span>Transacciones</span>
          </NavLink>
          <NavLink to="/accounts" className="header-nav-link">
            <Wallet size={17} />
            <span>Cuentas</span>
          </NavLink>
          <NavLink to="/loans" className="header-nav-link">
            <HandCoins size={17} />
            <span>Préstamos</span>
          </NavLink>
          <NavLink to="/categories" className="header-nav-link">
            <Tags size={17} />
            <span>Categorías</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="header-nav-link">
              <ShieldCheck size={17} />
              <span>Administración</span>
            </NavLink>
          )}
        </nav>

        <div className="header-right">
          <button
            className="header-menu-btn tooltip-left"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            data-tooltip={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            className="header-avatar tooltip-left"
            data-tooltip="Mi perfil"
            onClick={() => { setMenuOpen(false); navigate("/perfil") }}
            role="button"
            tabIndex={0}
            aria-label="Mi perfil"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMenuOpen(false);
                navigate("/perfil");
              }
            }}
          >
            {user?.name ? getInitials(user.name) : "?"}
          </div>

          <button
            className="header-logout-btn tooltip-left tooltip-danger"
            data-tooltip="Cerrar Sesión"
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            {getIcon("logOut")}
          </button>
        </div>

        {/* Menú hamburguesa (solo móvil) */}
        {menuOpen && (
          <div className="header-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        )}
        {menuOpen && (
          <nav id="mobile-menu" className="header-mobile-menu" aria-label="Menú de navegación">
            <NavLink to="/" end className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <Home size={18} />
              <span>Inicio</span>
            </NavLink>
            <NavLink to="/transactions" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <ArrowLeftRight size={18} />
              <span>Transacciones</span>
            </NavLink>
            <NavLink to="/accounts" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <Wallet size={18} />
              <span>Cuentas</span>
            </NavLink>
            <NavLink to="/loans" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <HandCoins size={18} />
              <span>Préstamos</span>
            </NavLink>
            <NavLink to="/categories" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <Tags size={18} />
              <span>Categorías</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
                <ShieldCheck size={18} />
                <span>Administración</span>
              </NavLink>
            )}
          </nav>
        )}
      </header>

      <main>
        <div className="page-transition" key={location.pathname}>
          <Outlet></Outlet>
        </div>

        {/* FAB + navegación contextual alineados en una sola columna */}
        <div className="fab-stack">
          {!isHome && (
            <div className="nav-pills">
              <button
                className="nav-pill tooltip-left"
                data-tooltip="Atrás"
                onClick={() => navigate(-1)}
                aria-label="Atrás"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
          )}

          <button
            className="fab tooltip-left"
            data-tooltip="Agregar Transacción"
            onClick={() => {
              // Limpia isSuccess/error de una creación anterior: si no,
              // al reabrir se montaría el SuccessToast viejo (flash).
              saveTransaction.reset()
              setModal(true)
            }}
            aria-label="Nueva transacción"
          >
            <Plus size={22} />
          </button>
        </div>

        <ModalPortal isOpen={modal} onClose={() => setModal(false)}>
          <TransactionForm
            mutation={saveTransaction}
            onClose={() => setModal(false)}
            onSuccess={() => {
              setModal(false)
              setCreatedInfo(true)
            }}
            defaultAccountId={defaultAccountId}
          />
        </ModalPortal>

        <InfoModal
          isOpen={createdInfo}
          onClose={() => setCreatedInfo(false)}
          type="success"
          title="Transacción creada"
          message="La transacción se registró correctamente."
          buttonText="Entendido"
        />
      </main>

      <footer className="app-footer">GEMA© 2026</footer>
    </>
  )
}