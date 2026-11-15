import { useAuthContext } from "../../features/auth/useAuthContext";
import { useLogout } from "../../features/auth/useLogout";
import { matchPath, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowLeftRight, CalendarClock, HandCoins, Home, Menu, PiggyBank, Plus, ShieldCheck, Sparkles, Tags, Users, Wallet, X } from "lucide-react";
import ModalPortal from "../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "../../features/transactions/components/TransactionForm/TransactionForm";
import { AddAnotherTransactionPrompt } from "../../features/transactions/components/AddAnotherTransactionPrompt";
import { NotificationsBell } from "../../features/recurring/components/NotificationsBell";
import { ThemeToggle } from "../../shared/theme/ThemeToggle";
import { OnboardingTour } from "../../components/OnboardingTour/OnboardingTour";
import { useTransactions } from "../../features/transactions/hooks";
import LoadingScreen from "../../shared/components/LoadingScreen/LoadingScreen";
import "./privateLayout.css"
import { getIcon } from "../../shared/utils/GetIcon";
import { useIsAdmin } from "../../features/auth/useIsAdmin";

interface NavItem {
  to: string;
  label: string;
  mobileLabel?: string;
  shortLabel?: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
}

const HOME_NAV: NavItem = { to: "/", label: "Inicio", icon: Home, end: true };

const TRANSACTIONS_NAV: NavItem = {
  to: "/transactions",
  label: "Transacciones",
  shortLabel: "Movs.",
  icon: ArrowLeftRight,
};

const RECURRING_NAV: NavItem = {
  to: "/recurring",
  label: "Futuros",
  mobileLabel: "Pagos futuros",
  shortLabel: "Futuros",
  icon: CalendarClock,
};

const NAV_ITEMS: NavItem[] = [
  HOME_NAV,
  TRANSACTIONS_NAV,
  { to: "/accounts", label: "Cuentas", icon: Wallet },
  { to: "/loans", label: "Préstamos", icon: HandCoins },
  { to: "/contacts", label: "Contactos", icon: Users },
  RECURRING_NAV,
  { to: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { to: "/categories", label: "Categorías", icon: Tags },
  { to: "/admin", label: "Administración", icon: ShieldCheck, adminOnly: true },
];

const BOTTOM_NAV_ROUTES = [HOME_NAV.to, TRANSACTIONS_NAV.to, RECURRING_NAV.to];

function isRouteActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

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
  // Guardamos la ruta en la que se abrió el menú: si cambia la ruta, se cierra solo
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const isAdmin = useIsAdmin()

  const isHome = location.pathname === "/"
  const menuOpen = menuPath === location.pathname
  const closeMenu = () => setMenuPath(null)
  const toggleMenu = () => setMenuPath(open => (open === location.pathname ? null : location.pathname))

  // Si estamos en el detalle de una tarjeta/cuenta, preseleccionarla en el form
  const accountMatch = matchPath("/accounts/:id", location.pathname)
  const defaultAccountId = accountMatch?.params.id

  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)
  const menuOnlyItems = visibleNavItems.filter(item => !BOTTOM_NAV_ROUTES.includes(item.to))
  // El botón "Más" se marca activo cuando la ruta actual vive en el menú desplegable
  const isMoreActive = menuOnlyItems.some(item => isRouteActive(location.pathname, item.to))

  // Escape cierra el menú y, en móvil, se bloquea el scroll de fondo
  useEffect(() => {
    if (!menuOpen) return

    const isMobile = window.matchMedia("(max-width: 640px)").matches
    if (!isMobile) return

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPath(null)
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  // Si se agranda la ventana, el menú móvil deja de tener sentido
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 641px)")
    const onChange = () => {
      if (desktopQuery.matches) setMenuPath(null)
    }

    desktopQuery.addEventListener("change", onChange)
    return () => desktopQuery.removeEventListener("change", onChange)
  }, [])

  if (loading) return <LoadingScreen />
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <header className="app-header">
        <NavLink to="/" end className="header-left header-brand" aria-label="Ir al inicio">
          <div className="header-logo">
            {getIcon("LayersIcon", { color: "#f1c40f" })}
          </div>
          <div className="header-titles">
            <span className="header-app-name">Finance App</span>
            <span className="header-user-name">{user?.name}</span>
          </div>
        </NavLink>

        <nav className="header-nav" aria-label="Navegación principal" data-tour="nav">
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="header-nav-link"
              title={label}
              aria-label={label}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="header-right">
          <NotificationsBell />
          <ThemeToggle />

          <button
            type="button"
            className="header-avatar tooltip-left"
            data-tooltip="Mi perfil"
            onClick={() => { closeMenu(); navigate("/perfil") }}
            aria-label="Mi perfil"
          >
            {user?.name ? getInitials(user.name) : "?"}
          </button>

          <button
            type="button"
            className="header-logout-btn tooltip-left tooltip-danger"
            data-tooltip="Cerrar Sesión"
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            {getIcon("logOut")}
          </button>
        </div>

        {/* Menú desplegable (solo móvil) */}
        {menuOpen && (
          <div className="header-menu-backdrop" onClick={() => closeMenu()} aria-hidden="true" />
        )}
        {menuOpen && (
          <nav id="mobile-menu" className="header-mobile-menu" aria-label="Menú de navegación">
            {visibleNavItems.map(({ to, label, mobileLabel, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="header-mobile-link"
                onClick={() => closeMenu()}
              >
                <Icon size={18} />
                <span>{mobileLabel ?? label}</span>
              </NavLink>
            ))}
            <div className="header-mobile-theme">
              <span>Tema</span>
              <ThemeToggle />
            </div>
            <button
              type="button"
              className="header-mobile-link header-mobile-tutorial"
              onClick={() => {
                closeMenu();
                window.dispatchEvent(new Event("finance:open-onboarding"));
              }}
            >
              <Sparkles size={18} />
              <span>Ver tutorial</span>
            </button>
          </nav>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>
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
            data-tour="new-transaction"
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
      <nav className="bottom-nav" aria-label="Navegación móvil" data-tour="bottom-nav">
        <NavLink
          to={HOME_NAV.to}
          end
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <Home size={20} />
          <span>{HOME_NAV.label}</span>
        </NavLink>

        <NavLink
          to={TRANSACTIONS_NAV.to}
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <ArrowLeftRight size={20} />
          <span>{TRANSACTIONS_NAV.shortLabel}</span>
        </NavLink>

        <button
          type="button"
          className="bottom-nav__fab"
          data-tour="new-transaction-mobile"
          aria-label="Nueva transacción"
          onClick={() => {
            saveTransaction.reset();
            setModal(true);
          }}
        >
          <Plus size={22} />
        </button>

        <NavLink
          to={RECURRING_NAV.to}
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <CalendarClock size={20} />
          <span>{RECURRING_NAV.shortLabel}</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-nav__item ${menuOpen || isMoreActive ? "is-active" : ""}`}
          onClick={() => toggleMenu()}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Más opciones de navegación"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>Más</span>
        </button>
      </nav>

      <OnboardingTour userId={user.id} autoStart={isHome} />

      <footer className="app-footer">GEMA© 2026</footer>
    </>
  )
}
