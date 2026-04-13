import { useAuthContext } from "../../features/auth/authContext";
import { useLogout } from "../../features/auth/useLogout";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Home, Plus } from "lucide-react";
import ModalPortal from "../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "../../features/transactions/components/TransactionForm/TransactionForm";
import { useTransactions } from "../../features/transactions/hooks";
import LoadingScreen from "../../shared/components/LoadingScreen/LoadingScreen";
import "./privateLayout.css"
import { getIcon } from "../../shared/utils/GetIcon";
import Tippy from "@tippyjs/react";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const logout = useLogout()
  const location = useLocation()
  const navigate = useNavigate()
  const { saveTransaction, loading } = useTransactions()
  const [modal, setModal] = useState(false)

  const isHome = location.pathname === "/"

  if (loading) return <LoadingScreen />

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

        <div className="header-right">
          <div className="header-avatar" onClick={() => navigate("/perfil")} aria-hidden="true">
            {user?.name ? getInitials(user.name) : "?"}
          </div>
          
          <Tippy placement="left" offset={[-22, 5]} delay={[300, 50]} content={<span style={{color:"#f65353"}} className="tooltip">Cerrar Sesion</span>}>
            <button className="header-logout-btn" onClick={logout}>
              {getIcon("logOut")}
            </button>
          </Tippy>
        </div>
      </header>

      <main>
        {/* Pills de navegación — solo fuera del home */}
        {!isHome && (
          <div className="nav-pills">

            <Tippy placement="left" offset={[-22, 5]} arrow delay={[300, 50]} content={<span className="tooltip"> Atras </span>} >
              <button className="nav-pill" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </button>
            </Tippy>

            <Tippy placement="left" offset={[-22, 5]} delay={[300, 50]} content={<span className="tooltip">Home</span>}>
              <button className="nav-pill" onClick={() => navigate("/")}>
                <Home size={20} />
              </button>
            </Tippy>
          </div>
        )}

        {children}

        {/* FAB crear transacción */}
        <Tippy placement="left" offset={[-22, 5]} arrow delay={[300, 50]} content={
          <span className="tooltip" >Agregar Transaccion</span>
        } maxWidth={"200px"} >
          <button className="fab" onClick={() => setModal(true)} aria-label="Nueva transacción">
            <Plus size={22} />
          </button>
        </Tippy>

        <ModalPortal isOpen={modal} onClose={() => setModal(false)}>
          <TransactionForm mutation={saveTransaction} />
        </ModalPortal>
      </main>

      <footer className="app-footer">GEMA© 2026</footer>
    </>
  )
}