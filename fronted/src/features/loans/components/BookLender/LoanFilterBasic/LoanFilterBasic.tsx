import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sliders, X } from "lucide-react";
import "./LoanFilterBasic.css";
import { defaultLoanQueryFilters, LoanQueryFiltersSchema, type LoanQueryFiltersFormInput } from "../../../LoanPayments/types";
import { TextInput } from "../../../../../shared/components/TextInput/TextInput";
import { SelectInput } from "../../../../../shared/components/SelectInput/SelectInput";
import { NumericInput } from "../../../../../shared/components/NumericInput/NumericInput";

interface LoanFiltersBasicProps {
  onApplyFilters: (filters: LoanQueryFiltersFormInput) => void;
  onOpenAdvanced: () => void;
  onClearFilters: () => void;
  initialFilters?: Partial<LoanQueryFiltersFormInput>;
  hasActiveFilters?: boolean;
}

export const LoanFiltersBasic = ({
  onApplyFilters,
  onOpenAdvanced,
  onClearFilters,
  initialFilters,
  hasActiveFilters = false,
}: LoanFiltersBasicProps) => {
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
  };

  const handleClear = () => {
    reset(defaultLoanQueryFilters);
    onClearFilters();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="loan-filters-basic">
      <div className="filters-basic-row">
        {/* Búsqueda general */}
        <Controller
          control={control}
          name="search"
          render={({ field, fieldState }) => (
            <TextInput
              label="Buscar"
              icon="Search"
              placeholder="Acreedor o ID..."
              value={field.value || ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* Tipo de préstamo */}
        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <SelectInput
              label="Tipo"
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

        {/* Estado */}
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

        {/* Monto mínimo */}
        <Controller
          control={control}
          name="minAmount"
          render={({ field, fieldState }) => (
            <NumericInput
              label="Monto Mín."
              icon="DollarSign"
              symbol="S/"
              value={field.value?.toString() || ""}
              onChange={(val) => field.onChange(val || undefined)}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* Monto máximo */}
        <Controller
          control={control}
          name="maxAmount"
          render={({ field, fieldState }) => (
            <NumericInput
              label="Monto Máx."
              icon="DollarSign"
              symbol="S/"
              value={field.value?.toString() || ""}
              onChange={(val) => field.onChange(val || undefined)}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      {/* Botones de acción */}
      <div className="filters-basic-actions">
        <button type="submit" className="btn-filter-apply" disabled={!isDirty && !hasActiveFilters}>
          Aplicar Filtros
        </button>

        <button
          type="button"
          className="btn-filter-advanced"
          onClick={onOpenAdvanced}
          title="Abrir filtros avanzados"
        >
          <Sliders size={16} />
          Avanzado
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-filter-clear"
            onClick={handleClear}
            title="Limpiar todos los filtros"
          >
            <X size={16} />
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
};