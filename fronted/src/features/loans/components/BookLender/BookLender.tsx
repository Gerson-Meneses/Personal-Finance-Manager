import dayjs from "dayjs";
import "dayjs/locale/es";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import type { CreateLoanDTO, LoanPayment, LoanType } from "../../types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import { useLoans } from "../../hooks";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { QuickPayForm } from "../../LoanPayments/QuickPay";
import { useParams, useSearchParams } from "react-router-dom";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";

import { z } from "zod";
import { CreditCard, Plus } from "lucide-react";
import { defaultLoanQueryFilters, type LoanQueryFiltersFormInput } from "../../LoanPayments/types";
import { LoanFiltersBasic } from "./LoanFilterBasic/LoanFilterBasic";
import { LoanFiltersAdvanced } from "./Loanfiltersadvanced/Loanfiltersadvanced";
import "./BookLender.css"

dayjs.locale("es");

// Schema para CreateLoanDTO con RHF
const CreateLoanFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  lender: z.string().min(1, "El acreedor es requerido"),
  type: z.enum(["GIVEN", "RECEIVED"]),
  description: z.string().optional(),
  accountId: z.string().min(1, "La cuenta es requerida"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
});

type CreateLoanFormInput = z.infer<typeof CreateLoanFormSchema>;

export const BookLender = () => {
  const { lender } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModalQuickPay, setShowModalQuickPay] = useState(false);
  const [showModalAdvancedFilters, setShowModalAdvancedFilters] = useState(false);

  if (!lender) return <div>Acreedor no encontrado</div>;

  // ============ PARSEAR FILTROS DE LA URL ============
  const parseFiltersFromURL = (): Partial<LoanQueryFiltersFormInput> => {
    const params = Object.fromEntries(searchParams);
    try {
      const parsed: any = {};
      
      // String fields
      if (params.search) parsed.search = params.search;
      if (params.type) parsed.type = params.type;
      if (params.status) parsed.status = params.status;
      if (params.lender) parsed.lender = params.lender;
      if (params.startDate) parsed.startDate = params.startDate;
      if (params.from) parsed.from = params.from;
      if (params.to) parsed.to = params.to;
      
      // Number fields
      if (params.minAmount) parsed.minAmount = parseFloat(params.minAmount);
      if (params.maxAmount) parsed.maxAmount = parseFloat(params.maxAmount);
      if (params.minPaymentAmount) parsed.minPaymentAmount = parseFloat(params.minPaymentAmount);
      if (params.maxPaymentAmount) parsed.maxPaymentAmount = parseFloat(params.maxPaymentAmount);
      if (params.limit) parsed.limit = parseInt(params.limit);
      if (params.page) parsed.page = parseInt(params.page);
      
      // Boolean fields
      if (params.hasPayments === "true") parsed.hasPayments = true;
      
      // Enum fields
      if (params.orderBy) parsed.orderBy = params.orderBy;
      if (params.order) parsed.order = params.order;
      if (params.paymentDateFrom) parsed.paymentDateFrom = params.paymentDateFrom;
      if (params.paymentDateTo) parsed.paymentDateTo = params.paymentDateTo;

      return parsed;
    } catch {
      return {};
    }
  };

  // ============ GUARDAR FILTROS EN LA URL ============
  const saveFiltersToURL = (filters: LoanQueryFiltersFormInput) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== defaultLoanQueryFilters[key as keyof LoanQueryFiltersFormInput]) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);
  };

  // ============ STATE Y HOOKS ============
  const initialFiltersFromURL = parseFiltersFromURL();
  const [activeFilters, setActiveFilters] = useState<Partial<LoanQueryFiltersFormInput>>(initialFiltersFromURL);

  const { createLoan, loans } = useLoans({
    lender,
    ...activeFilters,
  });

  // Form para nuevo préstamo
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { isDirty: isCreateDirty, isValid: isCreateValid },
  } = useForm<CreateLoanFormInput>({
    resolver: zodResolver(CreateLoanFormSchema),
    mode: "onChange",
    defaultValues: {
      date: dayjs().format("YYYY-MM-DD"),
      startDate: dayjs().format("YYYY-MM-DD"),
      lender: lender,
      type: "GIVEN",
      description: "",
      accountId: "",
      amount: 0,
    },
  });

  // ============ COMBINAR Y CALCULAR MOVIMIENTOS ============
  const allEntries = loans.flatMap((loan) => {
    const loanEntry = {
      date: dayjs(loan.startDate).toDate(),
      type: loan.type,
      description: loan.description || loan.transaction?.name || "Préstamo registrado",
      account: loan.transaction?.account?.name,
      amount: loan.principalAmount,
      isPayment: false,
    };

    const paymentEntries = (loan.payments || []).map((p: LoanPayment) => ({
      date: dayjs(p.date).toDate(),
      type: "Pago",
      description: p.description || p.transaction?.name || "Pago recibido",
      account: p.transaction?.account?.name,
      amount: p.amount,
      isPayment: true,
    }));

    return [loanEntry, ...paymentEntries];
  });

  const sortedEntries = allEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // ============ CÁLCULOS DE TOTALES ============
  const totalGersonsDebt = loans
    .filter((l) => l.type === "RECEIVED")
    .reduce((acc, curr) => acc + curr.amountRemaining, 0);

  const totalLenderDebt = loans
    .filter((l) => l.type === "GIVEN")
    .reduce((acc, curr) => acc + curr.amountRemaining, 0);

  // ============ HANDLERS ============
  const handleApplyFilters = (filters: LoanQueryFiltersFormInput) => {
    setActiveFilters(filters);
    saveFiltersToURL(filters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchParams(new URLSearchParams());
  };

  const handleCreateLoan = (data: CreateLoanFormInput) => {
    const payload: CreateLoanDTO = {
      ...data,
      amount: data.amount,
    };
    createLoan.mutate(payload, {
      onSuccess: () => {
        resetCreateForm();
      },
    });
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="page-container">
      {/* ============ HEADER ============ */}
      <div className="book-lender-header">
        <div className="header-title-section">
          <h2 className="header-title">
            Libro Contable: <span className="lender-name">{lender}</span>
          </h2>
        </div>

        {/* Totales */}
        <div className="header-totals">
          <div className="total-item">
            <span className="total-label">Me debe</span>
            <span className="total-amount text-success">S/ {totalLenderDebt.toFixed(2)}</span>
          </div>
          <div className="total-divider"></div>
          <div className="total-item">
            <span className="total-label">Le debo</span>
            <span className="total-amount text-danger">S/ {totalGersonsDebt.toFixed(2)}</span>
          </div>
        </div>

        {/* Botones superiores */}
        <div className="header-actions">
          <button
            className="btn-quick-pay"
            onClick={() => setShowModalQuickPay(true)}
            title="Registrar un pago rápido"
          >
            <CreditCard size={16} />
            Pago Rápido
          </button>
        </div>
      </div>

      {/* ============ FILTROS BÁSICOS ============ */}
      <LoanFiltersBasic
        onApplyFilters={handleApplyFilters}
        onOpenAdvanced={() => setShowModalAdvancedFilters(true)}
        onClearFilters={handleClearFilters}
        initialFilters={activeFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ============ TABLA DE MOVIMIENTOS ============ */}
      <div className="book-lender-table-wrapper">
        <table className="book-lender-table">
          <thead>
            {/* Fila de inputs para nuevo registro */}
            <tr className="table-input-row">
              <td className="cell-date">
                <Controller
                  control={createControl}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      label="Fecha"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </td>
              <td className="cell-type">
                <Controller
                  control={createControl}
                  name="type"
                  render={({ field }) => (
                    <SelectInput
                      value={field.value}
                      placeholder="Tipo"
                      label="Tipo"
                      onChange={(op) => field.onChange(op as LoanType)}
                      options={[
                        { value: "GIVEN", label: "Le Presté" },
                        { value: "RECEIVED", label: "Me prestó" },
                      ]}
                    />
                  )}
                />
              </td>
              <td className="cell-description">
                <Controller
                  control={createControl}
                  name="description"
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      icon="AlignLeft"
                      label="Descripción"
                      placeholder="Descripción..."
                      onChange={field.onChange}
                    />
                  )}
                />
              </td>
              <td className="cell-account">
                <Controller
                  control={createControl}
                  name="accountId"
                  render={({ field }) => (
                    <SelectAccount
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </td>
              <td className="cell-amount">
                <Controller
                  control={createControl}
                  name="amount"
                  render={({ field }) => (
                    <NumericInput
                      label="Monto"
                      icon="DollarSign"
                      symbol="S/"
                      value={field.value.toString()}
                      onChange={field.onChange}
                    />
                  )}
                />
              </td>
              <td className="cell-actions">
                <button
                  type="submit"
                  className="btn-table-action btn-add"
                  onClick={handleCreateSubmit(handleCreateLoan)}
                  disabled={!isCreateValid || !isCreateDirty}
                  title="Guardar nuevo registro"
                >
                  <Plus size={16} />
                </button>
              </td>
            </tr>

            {/* Headers */}
            <tr className="table-header-row">
              <th className="cell-date">Fecha</th>
              <th className="cell-type">Tipo</th>
              <th className="cell-description">Descripción</th>
              <th className="cell-account">Cuenta</th>
              <th className="cell-amount">Monto</th>
              <th className="cell-actions"></th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sortedEntries.length > 0 ? (
              sortedEntries.map((entry, index) => (
                <tr key={index} className="table-body-row">
                  <td className="cell-date">
                    {dayjs(entry.date).format("dddd D MMMM")}
                  </td>
                  <td className="cell-type">
                    <span className={`badge badge-2 ${entry.isPayment ? "badge-info" : "badge-muted"}`}>
                      {entry.type ?? "Pago"}
                    </span>
                  </td>
                  <td className="cell-description italic">{entry.description}</td>
                  <td className="cell-account font-mono text-xs">{entry.account}</td>
                  <td className={`cell-amount font-bold ${
                    (entry.type === "GIVEN" && !entry.isPayment) ||
                    (entry.type === "RECEIVED" && entry.isPayment)
                      ? "text-danger"
                      : "text-success"
                  }`}>
                    {entry.type === "RECEIVED" && !entry.isPayment ? "+" : ""}
                    S/ {entry.amount.toFixed(2)}
                  </td>
                  <td className="cell-actions"></td>
                </tr>
              ))
            ) : (
              <tr className="table-empty-row">
                <td colSpan={6} className="text-center py-8">
                  <p className="text-muted">No hay registros de préstamos o pagos</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============ MODALES ============ */}
      <ModalPortal
        isOpen={showModalAdvancedFilters}
        onClose={() => setShowModalAdvancedFilters(false)}
      >
        <LoanFiltersAdvanced
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowModalAdvancedFilters(false)}
          initialFilters={activeFilters}
        />
      </ModalPortal>

      <ModalPortal
        isOpen={showModalQuickPay}
        onClose={() => setShowModalQuickPay(false)}
      >
        <QuickPayForm lender={lender} />
      </ModalPortal>
    </div>
  );
};