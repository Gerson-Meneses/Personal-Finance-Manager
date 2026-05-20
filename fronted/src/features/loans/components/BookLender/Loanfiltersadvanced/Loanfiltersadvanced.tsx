import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextInput } from "../../../../../shared/components/TextInput/TextInput";
import { SelectInput } from "../../../../../shared/components/SelectInput/SelectInput";
import { NumericInput } from "../../../../../shared/components/NumericInput/NumericInput";
import { DatePicker } from "../../../../../shared/components/DateInput/DateInput";

import "./LoanFiltersAdvanced.css";
import { defaultLoanQueryFilters, LoanQueryFiltersSchema, type LoanQueryFiltersFormInput } from "../../../LoanPayments/types";

interface LoanFiltersAdvancedProps {
  onApplyFilters: (filters: LoanQueryFiltersFormInput) => void;
  onClose: () => void;
  initialFilters?: Partial<LoanQueryFiltersFormInput>;
}

export const LoanFiltersAdvanced = ({
  onApplyFilters,
  onClose,
  initialFilters,
}: LoanFiltersAdvancedProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<LoanQueryFiltersFormInput>({
    resolver: zodResolver(LoanQueryFiltersSchema),
    mode: "onChange",
    defaultValues: { ...defaultLoanQueryFilters, ...initialFilters },
  });

  const onSubmit = (data: LoanQueryFiltersFormInput) => {
    onApplyFilters(data);
    onClose();
  };

  const handleReset = () => {
    reset(defaultLoanQueryFilters);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="loan-filters-advanced">
      <h2 className="filters-advanced-title">Filtros Avanzados</h2>

      {/* ─── Sección 1: Tipo y Estado ────────────────────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Tipo y Estado</h3>
        
        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <SelectInput
                label="Tipo de Préstamo"
                value={field.value || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                options={[
                  { value: "", label: "Todos" },
                  { value: "GIVEN", label: "Le Presté" },
                  { value: "RECEIVED", label: "Me Prestó" },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <SelectInput
                label="Estado"
                value={field.value || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                options={[
                  { value: "", label: "Todos" },
                  { value: "PENDING", label: "Pendiente" },
                  { value: "PAID", label: "Pagado" },
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* ─── Sección 2: Acreedor ─────────────────────────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Acreedor</h3>
        
        <Controller
          control={control}
          name="lender"
          render={({ field, fieldState }) => (
            <TextInput
              label="Nombre del Acreedor"
              icon="User"
              placeholder="Ej: Juan, María..."
              value={field.value || ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      {/* ─── Sección 3: Rango de Fechas de Inicio ────────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Período de Inicio del Préstamo</h3>
        
        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="from"
            render={({ field }) => (
              <DatePicker
                label="Desde"
                value={field.value || ""}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="to"
            render={({ field }) => (
              <DatePicker
                label="Hasta"
                value={field.value || ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* ─── Sección 4: Rango de Monto ──────────────────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Rango de Monto Principal</h3>
        
        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="minAmount"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Monto Mínimo"
                icon="DollarSign"
                symbol="S/"
                value={field.value?.toString() || ""}
                onChange={(val) => field.onChange(val || undefined)}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="maxAmount"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Monto Máximo"
                icon="DollarSign"
                symbol="S/"
                value={field.value?.toString() || ""}
                onChange={(val) => field.onChange(val || undefined)}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      {/* ─── Sección 5: Filtros de Pagos ────────────────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Filtros de Pagos</h3>
        
        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="hasPayments"
            render={({ field }) => (
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked || undefined)}
                />
                <span>Solo con pagos registrados</span>
              </label>
            )}
          />
        </div>

        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="minPaymentAmount"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Monto de Pago Mín."
                icon="DollarSign"
                symbol="S/"
                value={field.value?.toString() || ""}
                onChange={(val) => field.onChange(val || undefined)}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="maxPaymentAmount"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Monto de Pago Máx."
                icon="DollarSign"
                symbol="S/"
                value={field.value?.toString() || ""}
                onChange={(val) => field.onChange(val || undefined)}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      {/* ─── Sección 6: Rango de Fechas de Pagos ────────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Período de Pagos</h3>
        
        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="paymentDateFrom"
            render={({ field }) => (
              <DatePicker
                label="Pago Desde"
                value={field.value || ""}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="paymentDateTo"
            render={({ field }) => (
              <DatePicker
                label="Pago Hasta"
                value={field.value || ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* ─── Sección 7: Ordenamiento y Paginación ──────────── */}
      <div className="filters-advanced-section">
        <h3 className="filters-section-title">Ordenamiento y Paginación</h3>
        
        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="orderBy"
            render={({ field, fieldState }) => (
              <SelectInput
                label="Ordenar Por"
                value={field.value || "startDate"}
                onChange={field.onChange}
                error={fieldState.error?.message}
                options={[
                  { value: "startDate", label: "Fecha de Inicio" },
                  { value: "createdAt", label: "Fecha de Creación" },
                  { value: "principalAmount", label: "Monto Principal" },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="order"
            render={({ field, fieldState }) => (
              <SelectInput
                label="Orden"
                value={field.value || "DESC"}
                onChange={field.onChange}
                error={fieldState.error?.message}
                options={[
                  { value: "DESC", label: "Descendente" },
                  { value: "ASC", label: "Ascendente" },
                ]}
              />
            )}
          />
        </div>

        <div className="filters-advanced-grid">
          <Controller
            control={control}
            name="limit"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Resultados por Página"
                icon="Layout"
                value={field.value?.toString() || "20"}
                onChange={(val) => field.onChange(val || 20)}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      {/* ─── Botones de acción ─────────────────────────────── */}
      <div className="filters-advanced-actions">
        <button
          type="submit"
          className="btn-filters-apply-advanced"
          disabled={!isDirty}
        >
          Aplicar Filtros
        </button>

        <button
          type="button"
          className="btn-filters-reset"
          onClick={handleReset}
        >
          Resetear
        </button>

        <button
          type="button"
          className="btn-filters-cancel"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};