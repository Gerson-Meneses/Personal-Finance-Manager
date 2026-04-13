import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Wallet, CreditCard, TrendingUp } from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { useAccounts } from "../../../features/accounts/hooks";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import AccountCard from "../../../features/accounts/components/accountCard/accountCard";
import AccountForm from "../../../features/accounts/components/accountForm/accountForm";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";

export function AccountPage() {
  const { accounts, loading, saveAccount } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(false)

  const navigate = useNavigate()
  // Cálculos rápidos para el resumen superior
  const debitBalance = accounts
    .filter(a => a.type === "DEBIT" || a.type === "CASH")
    .reduce((sum, account) => sum + account.balance, 0);

  const creditDebt = accounts
    .filter(a => a.type === "CREDIT")
    .reduce((sum, account) => sum + (account.creditLimit! * ((account.overdraft || 0) / 100 + 1) - account.balance), 0);

  if (loading) return <LoadingScreen />;

  return (
    <div className="page-container animate-fade-in">
      {/* Cabecera con Resumen */}
      <header className="page-header">
        <div>
          <h1>Mis Cuentas</h1>
          <p className="text-muted">Gestiona tus bancos, efectivo y tarjetas</p>
        </div>
        <SuccessToast isSucces={toast} successText="Cuenta creada con exito" >
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            Nueva Cuenta
          </button>
        </SuccessToast>
      </header>

      {/* Widgets de Resumen Rápido */}
      <section className="accounts-summary-grid mb-8">
        <div className="card summary-item">
          <div className="summary-icon bg-success-soft">
            <Wallet className="text-success" />
          </div>
          <div>
            <span className="text-muted">Total en Débito</span>
            <h3 className="amount-font text-success">{formatCurrency(debitBalance)}</h3>
          </div>
        </div>

        <div className="card summary-item">
          <div className="summary-icon bg-danger-soft">
            <CreditCard className="text-danger" />
          </div>
          <div>
            <span className="text-muted">Deuda en Crédito</span>
            <h3 className="amount-font text-danger">{formatCurrency(creditDebt)}</h3>
          </div>
        </div>

        <div className="card summary-item">
          <div className="summary-icon bg-warning-soft">
            <TrendingUp className="text-warning" />
          </div>
          <div>
            <span className="text-muted">Patrimonio Neto</span>
            <h3 className="amount-font"> {formatCurrency(debitBalance - creditDebt)}</h3>
          </div>
        </div>
      </section>

      {/* Grid de Cuentas */}
      {accounts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🏜️</div>
          <h3>No tienes cuentas registradas</h3>
          <p>Agrega tu primera cuenta de ahorros o tarjeta para empezar.</p>
          <button className="btn-outline mt-4" onClick={() => setIsModalOpen(true)}>
            Crear mi primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid-auto">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={(id) => navigate("/accounts/" + id)}
            />
          ))}
        </div>
      )}

      <ModalPortal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} >

        <AccountForm
          mutation={saveAccount}
          onSuccess={() => { setIsModalOpen(false), setToast(true) }}
        />

      </ModalPortal>

    </div>
  );
}