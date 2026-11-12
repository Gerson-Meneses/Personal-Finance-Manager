import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CheckCircle2, Repeat } from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { TypeToggle } from "../../../shared/components/TypeToggle/TypeToggle";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { DatePicker } from "../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import SelectCategory from "../../categories/components/selectCategory";
import { useLoansQuery } from "../../loans/hooks";
import { useCategories } from "../../categories/hooks";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import {
    RecurringPaymentFormSchema,
    type RecurringPayment,
    type RecurringLoanAction,
    type RecurringPaymentFormInput,
    type RecurringPaymentFormOutput,
} from "../types";

interface Props {
    payment?: RecurringPayment;
    defaults?: Partial<RecurringPaymentFormInput>;
    isPending?: boolean;
    onSubmit: (data: RecurringPaymentFormOutput) => Promise<void>;
    onSuccess?: () => void;
    onClose?: () => void;
}

const WEEKDAYS = [
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" },
    { value: "0", label: "Domingo" },
];

const LOAN_ACTIONS = [
    { value: "NONE", label: "Solo movimiento de caja" },
    { value: "PAY_LOAN", label: "Pagar un préstamo existente" },
    { value: "GIVE_LOAN", label: "Registrar préstamo que otorgo" },
    { value: "RECEIVE_LOAN", label: "Registrar préstamo que recibo" },
];

const FREQUENCIES = [
    { value: "ONCE", label: "Una sola vez" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "BIWEEKLY", label: "Quincenal" },
    { value: "FIFTEEN_DAYS", label: "Cada 15 días" },
    { value: "YEARLY", label: "Anual" },
];

const buildDefaults = (
    payment?: RecurringPayment,
    overrides?: Partial<RecurringPaymentFormInput>
): RecurringPaymentFormInput => ({
    name: payment?.name ?? "",
    description: payment?.description ?? "",
    type: payment?.type ?? "EXPENSE",
    amount: String(payment?.amount ?? ""),
    frequency: payment?.frequency ?? "MONTHLY",
    intervalCount: String(payment?.intervalCount ?? 1),
    dayOfMonth: String(payment?.dayOfMonth ?? dayjs().date()),
    dayOfWeek: String(payment?.dayOfWeek ?? dayjs().day()),
    startDate: payment?.startDate ?? dayjs().format("YYYY-MM-DD"),
    endDate: payment?.endDate ?? "",
    maxOccurrences: payment?.maxOccurrences ? String(payment.maxOccurrences) : "",
    autoDebit: payment?.autoDebit ?? false,
    loanAction: payment?.loanAction ?? "NONE",
    loanId: payment?.loanId ?? "",
    loanCounterparty: payment?.loanCounterparty ?? "",
    accountId: payment?.account?.id ?? "",
    categoryId: payment?.category?.id ?? "",
    ...overrides,
});

const normalizeCategoryName = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

export function RecurringPaymentForm({ payment, defaults, isPending, onSubmit, onSuccess, onClose }: Props) {
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [terminationMode, setTerminationMode] = useState<"NEVER" | "DATE" | "COUNT">(
        payment?.maxOccurrences ? "COUNT" : payment?.endDate ? "DATE" : "NEVER"
    );

    const {
        control,
        handleSubmit,
        setValue,
        formState: { isValid },
    } = useForm<RecurringPaymentFormInput, unknown, RecurringPaymentFormOutput>({
        resolver: zodResolver(RecurringPaymentFormSchema),
        mode: "onChange",
        defaultValues: buildDefaults(payment, defaults),
    });

    const type = useWatch({ control, name: "type" });
    const frequency = useWatch({ control, name: "frequency" });
    const loanAction = useWatch({ control, name: "loanAction" }) as RecurringLoanAction;
    const loanCounterparty = useWatch({ control, name: "loanCounterparty" });
    const maxOccurrences = useWatch({ control, name: "maxOccurrences" });
    const startDate = useWatch({ control, name: "startDate" });
    const amount = useWatch({ control, name: "amount" });
    const isWeekly = frequency === "WEEKLY" || frequency === "BIWEEKLY";
    const isMonthly = frequency === "MONTHLY" || frequency === "YEARLY";
    const isOneTime = frequency === "ONCE";
    const isLoanAction = loanAction !== "NONE";
    const { loans, isLoading: loansLoading } = useLoansQuery({ status: "PENDING", limit: 100 });
    const { categories } = useCategories();
    const loanTypeForDebt = type === "INCOME" ? "GIVEN" : "RECEIVED";
    const debtByLender = new Map<string, { lender: string; total: number; count: number }>();
    for (const loan of loans) {
        if (loan.type !== loanTypeForDebt) continue;
        const remaining = loan.amountRemaining ?? 0;
        if (remaining <= 0) continue;
        const current = debtByLender.get(loan.lender) ?? { lender: loan.lender, total: 0, count: 0 };
        current.total += remaining;
        current.count += 1;
        debtByLender.set(loan.lender, current);
    }
    const debts = [...debtByLender.values()].sort((a, b) => b.total - a.total);
    const selectedDebt = debts.find((debt) => debt.lender === loanCounterparty);
    const debtOptions = debts.map((debt) => ({
        value: debt.lender,
        label: `${debt.lender} · ${formatCurrency(debt.total)} · ${debt.count} préstamo${debt.count === 1 ? "" : "s"}`,
    }));
    const isLoanSchedule = loanAction === "PAY_LOAN" && frequency === "FIFTEEN_DAYS";
    const installmentCount = Number(maxOccurrences ?? 0);
    const scheduleTotal = installmentCount > 0 ? Number(amount || 0) * installmentCount : 0;
    const estimatedEnd = startDate && installmentCount > 0
        ? dayjs(startDate).add((installmentCount - 1) * 15, "day").format("D MMM YYYY")
        : "";
    const debtPendingAfterPlan = selectedDebt
        ? Math.max(0, selectedDebt.total - scheduleTotal)
        : 0;
    const scheduleOverpay = selectedDebt
        ? Math.max(0, scheduleTotal - selectedDebt.total)
        : 0;

    const assignLoanCategory = (action: string, paymentType: string) => {
        const targetName = action === "PAY_LOAN" ? "DEVOLUCION DE PRESTAMO" : "PRESTAMOS";
        const category = categories.find(
            (item) =>
                item.type === paymentType &&
                normalizeCategoryName(item.name) === targetName
        );
        if (category) setValue("categoryId", category.id, { shouldValidate: true });
    };

    const applyInstallmentAmount = (count: number) => {
        if (count <= 0) return;
        const total = selectedDebt?.total ?? 0;
        if (total <= 0) return;
        setValue("amount", String(Math.ceil((total / count) * 100) / 100), {
            shouldValidate: true,
        });
    };

    useEffect(() => {
        if (!isLoanAction || !type) return;
        assignLoanCategory(loanAction, type);
    }, [categories.length, isLoanAction, loanAction, type]);

    const changeLoanSchedule = (mode: "ONCE" | "SCHEDULE") => {
        if (mode === "ONCE") {
            setValue("frequency", "ONCE", { shouldValidate: true });
            setValue("maxOccurrences", "", { shouldValidate: true });
            return;
        }

        const count = 4;
        setValue("frequency", "FIFTEEN_DAYS", { shouldValidate: true });
        setValue("intervalCount", "1", { shouldValidate: true });
        setValue("maxOccurrences", String(count), { shouldValidate: true });

        const total = selectedDebt?.total ?? 0;
        const currentAmount = Number(amount || 0);
        if (total > 0 && (!currentAmount || Math.abs(currentAmount - total) < 0.01)) {
            applyInstallmentAmount(count);
        }
    };

    const onInvalid = (errors: FieldErrors<RecurringPaymentFormInput>) => {
        setSubmitAttempted(true);
        const first = Object.keys(errors)[0];
        if (first) {
            requestAnimationFrame(() => {
                document.querySelector<HTMLElement>(
                    ".form-default-container .custom-form-group.has-error input, .form-default-container .custom-form-group.has-error button"
                )?.focus();
            });
        }
    };

    const submit = async (data: RecurringPaymentFormOutput) => {
        setSubmitAttempted(false);
        const payload: RecurringPaymentFormOutput = {
            ...data,
            description: data.description || undefined,
            endDate:
                isOneTime || isLoanSchedule || terminationMode !== "DATE"
                    ? undefined
                    : data.endDate || undefined,
            maxOccurrences:
                isLoanSchedule || (!isOneTime && terminationMode === "COUNT")
                    ? data.maxOccurrences
                    : undefined,
            intervalCount: isOneTime ? 1 : data.intervalCount,
            dayOfMonth: isMonthly ? data.dayOfMonth : undefined,
            dayOfWeek: isWeekly ? data.dayOfWeek : undefined,
            autoDebit: isOneTime || isLoanAction ? false : data.autoDebit,
            loanAction: data.loanAction,
            loanId:
                data.loanAction === "PAY_LOAN" && !data.loanCounterparty
                    ? data.loanId
                    : undefined,
            loanCounterparty:
                data.loanAction === "PAY_LOAN" ||
                data.loanAction === "GIVE_LOAN" ||
                data.loanAction === "RECEIVE_LOAN"
                    ? data.loanCounterparty
                    : undefined,
        };
        await onSubmit(payload);
        onSuccess?.();
    };

    return (
        <FormContainer
            title={payment ? "Editar pago futuro" : "Nuevo pago futuro"}
            icon={<CalendarClock size={20} />}
            error={submitAttempted && !isValid ? "Revisa los campos marcados para continuar." : null}
            className="max-w-2xl mx-auto"
            onClose={onClose}
        >
            <form
                className="form-default-container"
                onSubmit={(event) => {
                    event.stopPropagation();
                    handleSubmit(submit, onInvalid)(event);
                }}
            >
                <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                        <TypeToggle
                            value={field.value}
                            onChange={(value) => {
                                field.onChange(value);
                                setValue("categoryId", "", { shouldValidate: true });
                                if (value === "INCOME") setValue("autoDebit", false);
                                if (loanAction === "PAY_LOAN") {
                                    setValue("loanCounterparty", "", { shouldValidate: true });
                                    setValue("loanId", "", { shouldValidate: true });
                                    setValue("amount", "", { shouldValidate: true });
                                    setValue("maxOccurrences", "", { shouldValidate: true });
                                    setValue("frequency", "ONCE", { shouldValidate: true });
                                    assignLoanCategory("PAY_LOAN", value);
                                }
                            }}
                            disabled={isPending || isLoanAction}
                            leftOption={{ value: "EXPENSE", label: "Gasto", color: "#ef4444", icon: "TrendingDown" }}
                            rightOption={{ value: "INCOME", label: "Ingreso", color: "#22c55e", icon: "TrendingUp" }}
                            label="Tipo de movimiento"
                        />
                    )}
                />

                <div className="form-default-grid-2col">
                    <Controller
                        control={control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <TextInput
                                label="Nombre"
                                icon="PencilLine"
                                placeholder="Ej. Alquiler, Netflix, Salario"
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="amount"
                        render={({ field, fieldState }) => (
                            <NumericInput
                                label="Monto"
                                symbol="S/"
                                icon="CircleDollarSign"
                                value={field.value?.toString() ?? ""}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />
                </div>

                <div className="form-default-grid-2col">
                    <Controller
                        control={control}
                        name="accountId"
                        render={({ field, fieldState }) => (
                            <SelectAccount
                                label={type === "INCOME" ? "Cuenta de destino" : "Cuenta de pago"}
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="categoryId"
                        render={({ field, fieldState }) => (
                            <SelectCategory
                                value={field.value}
                                onChange={field.onChange}
                                type={type}
                                noLoan={!isOneTime && !isLoanAction}
                                label="Categoría"
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />
                </div>

                {!isLoanAction && (
<div className={isOneTime ? "" : "form-default-grid-2col"}>
                    <Controller
                        control={control}
                        name="frequency"
                        render={({ field, fieldState }) => (
                            <SelectInput
                                label="Periodicidad"
                                icon="Repeat"
                                value={field.value}
                                onChange={(value) => {
                                    field.onChange(value);
                                }}
                                options={FREQUENCIES}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />

                    {!isOneTime && (
                        <Controller
                            control={control}
                            name="intervalCount"
                            render={({ field, fieldState }) => (
                                <NumericInput
                                    label="Cada N periodos"
                                    icon="Hash"
                                    value={field.value?.toString() ?? "1"}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                    disabled={isPending}
                                    required
                                />
                            )}
                        />
                    )}
                </div>
                )}

                {(isOneTime || loanAction === "PAY_LOAN") && (
                    <>
                        <p className="recurring-form-hint">
                            {loanAction === "PAY_LOAN"
                                ? "Selecciona la persona para sumar todas sus deudas pendientes y distribuir cada pago entre sus préstamos."
                                : loanAction === "GIVE_LOAN"
                                    ? "Al confirmar se creará el préstamo otorgado y su movimiento de salida."
                                    : loanAction === "RECEIVE_LOAN"
                                        ? "Al confirmar se creará el préstamo recibido y su movimiento de entrada."
                                        : "Ideal para prever un pago único. Elige una acción si también quieres actualizar Préstamos al confirmar."}
                        </p>

                        <Controller
                            control={control}
                            name="loanAction"
                            render={({ field, fieldState }) => (
                                <SelectInput
                                    label="Acción al confirmar"
                                    icon="HandCoins"
                                    value={field.value}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        setValue("loanId", "", { shouldValidate: true });
                                        setValue("loanCounterparty", "", { shouldValidate: true });
                                        setValue("maxOccurrences", "", { shouldValidate: true });
                                        setValue("frequency", "ONCE", { shouldValidate: true });
                                        if (value === "GIVE_LOAN") {
                                            setValue("type", "EXPENSE", { shouldValidate: true });
                                            assignLoanCategory("GIVE_LOAN", "EXPENSE");
                                        }
                                        if (value === "RECEIVE_LOAN") {
                                            setValue("type", "INCOME", { shouldValidate: true });
                                            assignLoanCategory("RECEIVE_LOAN", "INCOME");
                                        }
                                        if (value === "PAY_LOAN") {
                                            assignLoanCategory("PAY_LOAN", type);
                                        }
                                    }}
                                    options={LOAN_ACTIONS}
                                    error={fieldState.error?.message}
                                    disabled={isPending}
                                />
                            )}
                        />

                        {loanAction === "PAY_LOAN" && (
                            <>
                                <Controller
                                    control={control}
                                    name="loanCounterparty"
                                    render={({ field, fieldState }) => (
                                        <SelectInput
                                            label={type === "INCOME" ? "Persona que te debe" : "Persona a la que debes"}
                                            icon="Users"
                                            value={typeof field.value === "string" ? field.value : ""}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                const debt = debts.find((item) => item.lender === value);
                                                setValue("loanId", "", { shouldValidate: true });
                                                setValue("maxOccurrences", "", { shouldValidate: true });
                                                setValue("frequency", "ONCE", { shouldValidate: true });
                                                if (debt) {
                                                    setValue("amount", String(debt.total), { shouldValidate: true });
                                                    setValue(
                                                        "name",
                                                        type === "INCOME" ? `Cobro de ${debt.lender}` : `Pago a ${debt.lender}`,
                                                        { shouldValidate: true }
                                                    );
                                                }
                                                assignLoanCategory("PAY_LOAN", type);
                                            }}
                                            options={debtOptions}
                                            placeholder={loansLoading ? "Cargando deudas..." : "Selecciona una persona"}
                                            error={fieldState.error?.message}
                                            disabled={isPending || loansLoading}
                                            required
                                        />
                                    )}
                                />

                                {selectedDebt && (
                                    <div className="loan-debt-summary">
                                        <div>
                                            <span>Deuda total con {selectedDebt.lender}</span>
                                            <strong className="amount-font">{formatCurrency(selectedDebt.total)}</strong>
                                        </div>
                                        <small>
                                            {selectedDebt.count} préstamo{selectedDebt.count === 1 ? "" : "s"} pendiente{selectedDebt.count === 1 ? "" : "s"}.
                                            Cada pago se distribuye entre todas sus deudas.
                                        </small>
                                    </div>
                                )}

                                {selectedDebt && (
                                    <Controller
                                        control={control}
                                        name="frequency"
                                        render={({ field, fieldState }) => (
                                            <SelectInput
                                                label="Forma de pago"
                                                icon="CalendarClock"
                                                value={field.value === "FIFTEEN_DAYS" ? "SCHEDULE" : "ONCE"}
                                                onChange={(value) => changeLoanSchedule(value as "ONCE" | "SCHEDULE")}
                                                options={[
                                                    { value: "ONCE", label: "Un solo pago" },
                                                    { value: "SCHEDULE", label: "Cronograma cada 15 días" },
                                                ]}
                                                error={fieldState.error?.message}
                                                disabled={isPending}
                                            />
                                        )}
                                    />
                                )}

                                {selectedDebt && isLoanSchedule && (
                                    <>
                                        <Controller
                                            control={control}
                                            name="maxOccurrences"
                                            render={({ field, fieldState }) => (
                                                <NumericInput
                                                    label="Número de cuotas a programar"
                                                    icon="Hash"
                                                    value={String(field.value ?? "")}
                                                    onChange={field.onChange}
                                                    error={fieldState.error?.message}
                                                    disabled={isPending}
                                                    required
                                                />
                                            )}
                                        />

                                        <div className="loan-schedule-preview">
                                            <div>
                                                <span>Monto por cuota</span>
                                                <strong>{formatCurrency(Number(amount || 0))}</strong>
                                            </div>
                                            <div>
                                                <span>Última cuota</span>
                                                <strong>{estimatedEnd}</strong>
                                            </div>
                                            <small>
                                                {installmentCount} cuota{installmentCount === 1 ? "" : "s"} · Total planificado {formatCurrency(scheduleTotal)}
                                                {scheduleOverpay > 0
                                                    ? ` · El último pago se ajustará al saldo restante (${formatCurrency(scheduleOverpay)} de margen).`
                                                    : debtPendingAfterPlan > 0
                                                        ? ` · Quedarán ${formatCurrency(debtPendingAfterPlan)} pendientes al terminar.`
                                                        : " · Cubre la deuda completa."}
                                            </small>
                                            <button
                                                type="button"
                                                className="btn-ghost loan-schedule-preview__adjust"
                                                onClick={() => applyInstallmentAmount(installmentCount)}
                                                disabled={installmentCount <= 0 || isPending}
                                            >
                                                Calcular cuota para saldar toda la deuda
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {(loanAction === "GIVE_LOAN" || loanAction === "RECEIVE_LOAN") && (
                            <Controller
                                control={control}
                                name="loanCounterparty"
                                render={({ field, fieldState }) => (
                                    <TextInput
                                        label={loanAction === "GIVE_LOAN" ? "Persona a la que prestas" : "Persona que te presta"}
                                        icon="User"
                                        placeholder="Nombre de la persona"
                                        value={typeof field.value === "string" ? field.value : ""}
                                        onChange={field.onChange}
                                        error={fieldState.error?.message}
                                        disabled={isPending}
                                        required
                                    />
                                )}
                            />
                        )}

                        {loanAction === "PAY_LOAN" && !loansLoading && debts.length === 0 && (
                            <p className="recurring-form-hint">
                                No tienes deudas pendientes de ese tipo. Cambia Gasto/Ingreso o registra el préstamo primero.
                            </p>
                        )}
                    </>
                )}

                {isMonthly && (
                    <Controller
                        control={control}
                        name="dayOfMonth"
                        render={({ field, fieldState }) => (
                            <NumericInput
                                label="Día del mes"
                                icon="CalendarDays"
                                value={field.value?.toString() ?? ""}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />
                )}

                {isWeekly && (
                    <Controller
                        control={control}
                        name="dayOfWeek"
                        render={({ field, fieldState }) => (
                            <SelectInput
                                label="Día de la semana"
                                icon="CalendarDays"
                                value={String(field.value ?? "")}
                                onChange={field.onChange}
                                options={WEEKDAYS}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />
                )}

                <Controller
                    control={control}
                    name="startDate"
                    render={({ field, fieldState }) => (
                        <DatePicker
                            label={isOneTime ? "Fecha del pago o cobro" : isLoanSchedule ? "Primera cuota" : "Inicio"}
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            disableFuture={false}
                        />
                    )}
                />

                {!isOneTime && !isLoanSchedule && (
                    <>
                        <SelectInput
                            label="Termina"
                            icon="CalendarX"
                            value={terminationMode}
                            onChange={(value) => {
                                const mode = value as "NEVER" | "DATE" | "COUNT";
                                setTerminationMode(mode);
                                if (mode !== "DATE") setValue("endDate", "", { shouldValidate: true });
                                if (mode !== "COUNT") setValue("maxOccurrences", "", { shouldValidate: true });
                                if (mode === "COUNT" && !maxOccurrences) {
                                    setValue("maxOccurrences", "4", { shouldValidate: true });
                                }
                            }}
                            options={[
                                { value: "NEVER", label: "Sin fecha de fin" },
                                { value: "DATE", label: "En una fecha límite" },
                                { value: "COUNT", label: "Después de N repeticiones" },
                            ]}
                            disabled={isPending}
                        />

                        {terminationMode === "DATE" && (
                            <Controller
                                control={control}
                                name="endDate"
                                render={({ field, fieldState }) => (
                                    <DatePicker
                                        label="Fecha límite"
                                        value={typeof field.value === "string" ? field.value : ""}
                                        onChange={field.onChange}
                                        error={fieldState.error?.message}
                                        disabled={isPending}
                                        disableFuture={false}
                                    />
                                )}
                            />
                        )}

                        {terminationMode === "COUNT" && (
                            <Controller
                                control={control}
                                name="maxOccurrences"
                                render={({ field, fieldState }) => (
                                    <NumericInput
                                        label="Número de repeticiones"
                                        icon="Hash"
                                        value={String(field.value ?? "")}
                                        onChange={field.onChange}
                                        error={fieldState.error?.message}
                                        disabled={isPending}
                                        required
                                    />
                                )}
                            />
                        )}
                    </>
                )}

                <Controller
                    control={control}
                    name="description"
                    render={({ field, fieldState }) => (
                        <TextInput
                            label="Descripción"
                            icon="AlignLeft"
                            placeholder="Notas adicionales…"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            textarea
                        />
                    )}
                />

                {type === "EXPENSE" && !isOneTime && (
                    <Controller
                        control={control}
                        name="autoDebit"
                        render={({ field }) => (
                            <label className={`auto-debit-row ${field.value ? "is-active" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(event) => field.onChange(event.target.checked)}
                                    disabled={isPending}
                                />
                                <span className="auto-debit-icon"><Repeat size={16} /></span>
                                <span className="auto-debit-text">
                                    <strong>Débito automático</strong>
                                    <small>Se ejecutará desde la cuenta seleccionada en la fecha programada.</small>
                                </span>
                            </label>
                        )}
                    />
                )}

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Guardando…" : payment ? "Actualizar pago" : "Crear pago futuro"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
