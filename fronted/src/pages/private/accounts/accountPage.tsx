import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Wallet, CreditCard, TrendingUp } from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { useAccounts } from "../../../features/accounts/hooks";
import { getCreditDebt } from "../../../features/accounts/utils";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import AccountCard from "../../../features/accounts/components/accountCard/accountCard";
import AccountForm from "../../../features/accounts/components/accountForm/accountForm";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import "./accountPage.css";

type TypeFilter = "all" | "liquid" | "credit";
type SortMode = "name-asc" | "name-desc" | "balance-desc" | "balance-asc";

export function AccountPage() {
  const { accounts, loading, error, refetch, saveAccount } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortMode>("name-asc");

  const navigate = useNavigate();

  // Cálculos rápidos para el resumen superior
  const debitBalance = accounts
    .filter(a => a.type === "DEBIT" || a.type === "CASH")
    .reduce((sum, account) => sum + account.balance, 0);

  const creditDebt = accounts
    .filter(a => a.type === "CREDIT")
    .reduce((sum, account) => sum + getCreditDebt(account), 0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = accounts.filter((a) => {
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "credit" ? a.type === "CREDIT" : a.type !== "CREDIT");
      const matchesSearch = !q || a.name.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
    return [...list].sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name, "es");
      if (sort === "name-desc") return b.name.localeCompare(a.name, "es");
      if (sort === "balance-desc") return b.balance - a.balance;
      return a.balance - b.balance;
    });
  }, [accounts, search, typeFilter, sort]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
  };

  if (loading) return <LoadingScreen />;

  const header = (
    <header className="page-header card">
      <div>
        <h1>Mis Cuentas</h1>
        <p className="text-muted">Gestiona tus bancos, efectivo y tarjetas</p>
      </div>
      <div className="accounts-toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar cuenta..."
        />
        <SelectInput
          compact
          label="Filtrar por tipo"
          hideLabel
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          options={[
            { value: "all", label: "Todos los tipos" },
            { value: "liquid", label: "Débito y efectivo" },
            { value: "credit", label: "Crédito" },
          ]}
          className="acc-select"
        />
        <SelectInput
          compact
          label="Ordenar cuentas"
          hideLabel
          value={sort}
          onChange={(v) => setSort(v as SortMode)}
          options={[
            { value: "name-asc", label: "A-Z" },
            { value: "name-desc", label: "Z-A" },
            { value: "balance-desc", label: "Mayor saldo" },
            { value: "balance-asc", label: "Menor saldo" },
          ]}
          className="acc-select"
        />
        <SuccessToast isSucces={toast} successText="Cuenta creada con exito" >
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            Nueva Cuenta
          </button>
        </SuccessToast>
      </div>
    </header>
  );

  if (error) {
    return (
      <div className="page-container">
        {header}
        <div className="card accounts-error-card">
          <p>No se pudieron cargar las cuentas.</p>
          <p className="text-muted">{error?.message || "Error inesperado"}</p>
          <button className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {header}

      {/* Widgets de Resumen Rápido — mismas balance-card que el dashboard */}
      <section className="default-row accounts-summary">
        <article className="balance-card card-debit">
          <div className="card-head">
            <Wallet size={24} className="text-success" />
            <p className="card-label">Total en Débito</p>
          </div>
          <h2 className="card-amount text-success">{formatCurrency(debitBalance)}</h2>
        </article>

        <article className="balance-card card-credit">
          <div className="card-head">
            <CreditCard size={24} className="text-danger" />
            <p className="card-label">Deuda en Crédito</p>
          </div>
          <h2 className="card-amount text-danger">{formatCurrency(creditDebt)}</h2>
        </article>

        <article className="balance-card card-net">
          <div className="card-head">
            <TrendingUp size={24} className="text-warning" />
            <p className="card-label">Patrimonio Neto</p>
          </div>
          <h2 className="card-amount">{formatCurrency(debitBalance - creditDebt)}</h2>
        </article>
      </section>

      {/* Grid de Cuentas */}
      {accounts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🏜️</div>
          <h3>No tienes cuentas registradas</h3>
          <p>Agrega tu primera cuenta de ahorros o tarjeta para empezar.</p>
          <button className="btn-outline" onClick={() => setIsModalOpen(true)}>
            Crear mi primera cuenta
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state card">
          <h3>No se encontraron cuentas</h3>
          <p className="text-muted">
            {search ? `Ninguna coincide con «${search}».` : "Ninguna coincide con el filtro seleccionado."}
          </p>
          <button className="btn-ghost" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid-auto">
          {visible.map((account) => (
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
          onSuccess={() => {
            setIsModalOpen(false);
            setToast(true);
          }}
        />

      </ModalPortal>

    </div>
  );
}
