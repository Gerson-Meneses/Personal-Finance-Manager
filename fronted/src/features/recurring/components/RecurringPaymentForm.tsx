import { useState } from "react";
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
import {
    RecurringPaymentFormSchema,
    type RecurringPayment,
    type RecurringPaymentFormInput,
    type RecurringPaymentFormOutput,
} from "../types";

interface Props {
    payment?: RecurringPayment;
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

const FREQUENCIES = [
    { value: "MONTHLY", label: "Mensual" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "BIWEEKLY", label: "Quincenal" },
    { value: "YEARLY", label: "Anual" },
];

const buildDefaults = (payment?: RecurringPayment): RecurringPaymentFormInput => ({
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
    autoDebit: payment?.autoDebit ?? false,
    accountId: payment?.account?.id ?? "",
    categoryId: payment?.category?.id ?? "",
});

export function RecurringPaymentForm({ payment, isPending, onSubmit, onSuccess, onClose }: Props) {
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { isValid },
    } = useForm<RecurringPaymentFormInput, unknown, RecurringPaymentFormOutput>({
        resolver: zodResolver(RecurringPaymentFormSchema),
        mode: "onChange",
        defaultValues: buildDefaults(payment),
    });

    const type = useWatch({ control, name: "type" });
    const frequency = useWatch({ control, name: "frequency" });
    const endDate = useWatch({ control, name: "endDate" });
    const isWeekly = frequency === "WEEKLY" || frequency === "BIWEEKLY";
    const isMonthly = frequency === "MONTHLY" || frequency === "YEARLY";

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
        await onSubmit(data);
        onSuccess?.();
    };

    return (
        <FormContainer
            title={payment ? "Editar pago previsto" : "Nuevo pago previsto"}
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
                            }}
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
                                noLoan
                                label="Categoría"
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
                        name="frequency"
                        render={({ field, fieldState }) => (
                            <SelectInput
                                label="Periodicidad"
                                icon="Repeat"
                                value={field.value}
                                onChange={field.onChange}
                                options={FREQUENCIES}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                required
                            />
                        )}
                    />

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
                </div>

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

                <div className="form-default-grid-2col">
                    <Controller
                        control={control}
                        name="startDate"
                        render={({ field, fieldState }) => (
                            <DatePicker
                                label="Inicio"
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                disableFuture={false}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="endDate"
                        render={({ field, fieldState }) => (
                            <DatePicker
                                label="Fin (opcional)"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                disableFuture={false}
                            />
                        )}
                    />
                </div>

                {endDate && (
                    <button
                        type="button"
                        className="btn-ghost recurring-clear-end"
                        onClick={() => setValue("endDate", "", { shouldValidate: true, shouldDirty: true })}
                    >
                        Quitar fecha límite
                    </button>
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

                {type === "EXPENSE" && (
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
                        {isPending ? "Guardando…" : payment ? "Actualizar pago" : "Crear pago previsto"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
