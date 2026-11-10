import { useAuthContext } from "../../features/auth/authContext";
import { useLogout } from "../../features/auth/useLogout";
import { matchPath, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ArrowLeftRight, CalendarClock, HandCoins, Home, Menu, PiggyBank, Plus, ShieldCheck, Tags, Wallet, X } from "lucide-react";
import ModalPortal from "../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "../../features/transactions/components/TransactionForm/TransactionForm";
import { AddAnotherTransactionPrompt } from "../../features/transactions/components/AddAnotherTransactionPrompt";
import { NotificationsBell } from "../../features/recurring/components/NotificationsBell";
import { ThemeToggle } from "../../shared/theme/ThemeToggle";
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
  const [askAnother, setAskAnother] = useState(false)
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
          <NavLink to="/recurring" className="header-nav-link">
            <CalendarClock size={17} />
            <span>Previstos</span>
          </NavLink>
          <NavLink to="/budgets" className="header-nav-link">
            <PiggyBank size={17} />
            <span>Presupuestos</span>
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
          <NotificationsBell />
          <ThemeToggle />

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
            <NavLink to="/recurring" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <CalendarClock size={18} />
              <span>Pagos previstos</span>
            </NavLink>
            <NavLink to="/budgets" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <PiggyBank size={18} />
              <span>Presupuestos</span>
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
            <div className="header-mobile-theme">
              <span>Tema</span>
              <ThemeToggle />
            </div>
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
              // Limpia el error de una creación anterior antes de reabrir el formulario
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
              setAskAnother(true)
            }}
            defaultAccountId={defaultAccountId}
          />
        </ModalPortal>

        <AddAnotherTransactionPrompt
          isOpen={askAnother}
          onClose={() => setAskAnother(false)}
          onAddAnother={() => {
            setAskAnother(false)
            saveTransaction.reset()
            setModal(true)
          }}
        />
      </main>

      {/* Navegación inferior móvil */}
      <nav className="bottom-nav" aria-label="Navegación móvil">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <Home size={20} />
          <span>Inicio</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <ArrowLeftRight size={20} />
          <span>Movs.</span>
        </NavLink>

        <button
          type="button"
          className="bottom-nav__fab"
          aria-label="Nueva transacción"
          onClick={() => {
            saveTransaction.reset();
            setModal(true);
          }}
        >
          <Plus size={22} />
        </button>

        <NavLink
          to="/recurring"
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <CalendarClock size={20} />
          <span>Previstos</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-nav__item ${menuOpen ? "is-active" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>Más</span>
        </button>
      </nav>

      <footer className="app-footer">GEMA© 2026</footer>
    </>
  )
}
