import { useEffect } from "react";
import { HandCoins, CheckCircle2, Calendar, User } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateLoanPaymentInput, CreateLoanPaymentOutput } from "../types";
import { useLoanPayments } from "../../loans/hooks";
import { CreateLoanPaymentSchema, initialLoanPayment } from "../types";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import type { Loan, LoanType } from "../../loans/types";
import { TypeToggle } from "../../../shared/components/TypeToggle/TypeToggle";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import dayjs from "dayjs";
import "./PayLoanForm.css";

interface Props {
  loanId: string;
  loan?: Loan;
  initialValues?: Partial<CreateLoanPaymentInput>;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const CreateLoanPaymentForm = ({ loanId, loan, initialValues, onSuccess, onClose }: Props) => {
  const { createPayment } = useLoanPayments();
  const { mutate, isPending, error, isSuccess, reset: resetMutation } = createPayment;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<CreateLoanPaymentInput, unknown, CreateLoanPaymentOutput>({
    resolver: zodResolver(CreateLoanPaymentSchema),
    mode: "onChange",
    defaultValues: {
      ...initialLoanPayment,
      ...initialValues,
      id: loanId,
    },
  });

  // Observamos el monto actual que escribe el usuario para calcular el impacto en vivo
  const currentAmountInput = useWatch({ control, name: "amount" }) || 0;

  useEffect(() => {
    if (!isSuccess) return;
    reset({
      ...initialLoanPayment,
      ...initialValues,
      id: loanId,
    });
    resetMutation();
    onSuccess?.();
  }, [isSuccess]);

  const onSubmit = (data: CreateLoanPaymentOutput) => {
    mutate(data);
  };

  const isGiven = loan?.type === "GIVEN";
  const remainingCalculated = Math.max(0, (loan?.amountRemaining || 0) - Number(currentAmountInput));

  return (
    <FormContainer
      title={`Registrar Pago`}
      icon={<HandCoins size={20} />}
      error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
      className="max-w-lg mx-auto payment-form-popup"
      onClose={onClose}
    >
      {/* ── TARGETA DE CONTEXTO / RESUMEN DEL PRÉSTAMO ── */}
      {loan && (
        <div className="loan-context-summary">
          <div className="loan-context-summary__top">
            <div className="loan-context-summary__identity">
              <span className={`loan-context-summary__badge ${isGiven ? "given" : "received"}`}>
                {isGiven ? "PRESTASTE A" : "RECIBISTE DE"}
              </span>
              <h3 className="loan-context-summary__title">
                { loan.lender || loan.transaction?.name }
              </h3>
            </div>
            <div className="loan-context-summary__total">
              <span className="loan-context-summary__label">Total Inicial</span>
              <span className="loan-context-summary__value">{formatCurrency(loan.principalAmount)}</span>
            </div>
          </div>

          <div className="loan-context-summary__meta">
            <div className="loan-context-summary__meta-item">
              <User size={13} />
              <span>{loan.lender}</span>
            </div>
            <div className="loan-context-summary__meta-item">
              <Calendar size={13} />
              <span>{dayjs(loan.startDate).format("D MMM, YYYY")}</span>
            </div>
          </div>

          <div className="loan-context-summary__footer-grid">
            <div>
              <span className="loan-context-summary__sublabel">Deuda Pendiente</span>
              <span className="loan-context-summary__subvalue text-danger">
                {formatCurrency(loan.amountRemaining)}
              </span>
            </div>
            <div>
              <span className="loan-context-summary__sublabel">Nuevo Balance si pagas</span>
              <span className="loan-context-summary__subvalue target-balance">
                {formatCurrency(remainingCalculated)}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form-default-container updated-payment-form">
        
        {/* ── TIPO (SOLO LECTURA INFORMATIVO) ── */}
        <TypeToggle<LoanType>
          value={loan?.type || "GIVEN"}
          label="Naturaleza de la Transacción"
          onChange={() => console.log("No se puede cambiar el tipo de pago")}
          disabled={true}
          leftOption={{
            value: "GIVEN",
            label: "Dinero Prestado (Flujo Saliente)",
            color: "#ef4444",
            icon: "TrendingUp",
          }}
          rightOption={{
            value: "RECEIVED",
            label: "Dinero Recibido (Flujo Entrante)",
            color: "#22c55e",
            icon: "TrendingDown",
          }}
        />

        {/* ── MONTO + CUENTA ── */}
        <div className="form-default-grid-2col">
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Monto a Abonar"
                icon="CircleDollarSign"
                symbol="S/"
                value={field.value?.toString()}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPending}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="accountId"
            render={({ field, fieldState }) => (
              <SelectAccount
                label={isGiven ? "Cuenta donde ingresa el dinero" : "Cuenta desde donde pagas"}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPending}
                noCredit={isGiven}
                balance={!isGiven}
                required
              />
            )}
          />
        </div>

        {/* ── FECHA + HORA ── */}
        <div className="form-default-grid-2col">
          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="time"
            render={({ field, fieldState }) => (
              <TimePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPending}
                selectedDate={useWatch({ control, name: "date" })}
              />
            )}
          />
        </div>

        {/* ── DESCRIPCIÓN ── */}
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <TextInput
              label="Notas del Abono"
              icon="AlignLeft"
              placeholder={`Ej: Pago cuota del mes de ${dayjs().format("MMMM")}...`}
              value={field.value ?? ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
              disabled={isPending}
              textarea
            />
          )}
        />

        {/* ── ACCIONES / BOTÓN ACCIÓN ── */}
        <div className="form-actions-container spec-payment-actions">
          <SuccessToast isSucces={isSuccess} successText="Pago registrado con éxito.">
            <button
              type="submit"
              className={`btn-submit quickpay ${isPending ? "is-pending" : ""}`}
              disabled={isPending || !isDirty || !isValid}
            >
              <CheckCircle2 size={16} />
              {isPending ? "Procesando abono..." : "Confirmar e Inyectar Pago"}
            </button>
          </SuccessToast>
        </div>
      </form>
    </FormContainer>
  );
};