import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Wallet, CreditCard, TrendingUp, CircleDollarSign } from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { useAccounts } from "../../../features/accounts/hooks";
import { getCreditDebt, getCreditMax } from "../../../features/accounts/utils";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import AccountCard from "../../../features/accounts/components/accountCard/accountCard";
import AccountForm from "../../../features/accounts/components/accountForm/accountForm";
import { CreditHealthCard } from "../../../features/accounts/components/CreditHealthCard";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import "./accountPage.css";

type TypeFilter = "all" | "liquid" | "credit";
type SortMode = "name-asc" | "name-desc" | "balance-desc" | "balance-asc";

export function AccountPage() {
  const { accounts, loading, error, refetch, saveAccount } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortMode>("name-asc");

  const navigate = useNavigate();

  // Cálculos rápidos para el resumen superior
  const liquidAccounts = accounts.filter(a => a.type === "DEBIT" || a.type === "CASH");
  const creditAccounts = accounts.filter(a => a.type === "CREDIT");

  const debitBalance = liquidAccounts.reduce((sum, account) => sum + account.balance, 0);

  const creditDebt = creditAccounts.reduce((sum, account) => sum + getCreditDebt(account), 0);

  const creditCapacity = creditAccounts.reduce((sum, account) => sum + getCreditMax(account), 0);
  const creditAvailable = Math.max(0, creditCapacity - creditDebt);
  const netWorth = debitBalance - creditDebt;
  const breakdownTotal = debitBalance + creditDebt;
  const liquidShare = breakdownTotal > 0 ? (debitBalance / breakdownTotal) * 100 : 0;
  const debtShare = breakdownTotal > 0 ? (creditDebt / breakdownTotal) * 100 : 0;

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
    <header className="page-header card accounts-header">
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
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Nueva Cuenta
        </button>
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

      {/* Resumen patrimonial */}
      <section className="acc-overview">
        <article className="acc-overview__hero card">
          <span className="acc-overview__eyebrow">
            <TrendingUp size={15} />
            Patrimonio neto
          </span>
          <p className="acc-overview__amount amount-font">{formatCurrency(netWorth)}</p>

          <div
            className="acc-overview__bar"
            role="img"
            aria-label={`Liquidez ${formatCurrency(debitBalance)} y deuda ${formatCurrency(creditDebt)}`}
          >
            <span className="acc-overview__bar-liquid" style={{ width: `${liquidShare}%` }} />
            <span className="acc-overview__bar-debt" style={{ width: `${debtShare}%` }} />
          </div>

          <div className="acc-overview__legend">
            <span>
              <i className="acc-dot acc-dot--liquid" />
              Liquidez <strong>{formatCurrency(debitBalance)}</strong>
            </span>
            <span>
              <i className="acc-dot acc-dot--debt" />
              Deuda <strong>{formatCurrency(creditDebt)}</strong>
            </span>
          </div>

          <p className="acc-overview__hint">
            {liquidAccounts.length} cuenta{liquidAccounts.length !== 1 ? "s" : ""} líquida{liquidAccounts.length !== 1 ? "s" : ""}
            {" · "}
            {creditAccounts.length} tarjeta{creditAccounts.length !== 1 ? "s" : ""} de crédito
          </p>
        </article>

        <div className="acc-overview__stats">
          <article className="acc-stat card">
            <span className="acc-stat__icon acc-stat__icon--liquid">
              <Wallet size={18} />
            </span>
            <div className="acc-stat__text">
              <span>Saldo disponible</span>
              <strong className="amount-font text-success">{formatCurrency(debitBalance)}</strong>
            </div>
            <small>{liquidAccounts.length} cuenta{liquidAccounts.length !== 1 ? "s" : ""}</small>
          </article>

          <article className="acc-stat card">
            <span className="acc-stat__icon acc-stat__icon--debt">
              <CreditCard size={18} />
            </span>
            <div className="acc-stat__text">
              <span>Deuda actual</span>
              <strong className="amount-font text-danger">{formatCurrency(creditDebt)}</strong>
            </div>
            <small>{creditAccounts.length} tarjeta{creditAccounts.length !== 1 ? "s" : ""}</small>
          </article>

          <article className="acc-stat card">
            <span className="acc-stat__icon acc-stat__icon--available">
              <CircleDollarSign size={18} />
            </span>
            <div className="acc-stat__text">
              <span>Crédito disponible</span>
              <strong className="amount-font text-warning">{formatCurrency(creditAvailable)}</strong>
            </div>
            <small>de {formatCurrency(creditCapacity)}</small>
          </article>
        </div>
      </section>

      <CreditHealthCard accounts={creditAccounts} />

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
          onSuccess={() => setIsModalOpen(false)}
        />

      </ModalPortal>

    </div>
  );
}
