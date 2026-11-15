import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CheckCircle2, HandCoins, Plus, Repeat } from "lucide-react";
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
import { useContacts } from "../../contacts/hooks";
import { CreateContactModal } from "../../contacts/components/CreateContactModal";
import type { Contact } from "../../contacts/types";
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
    loanContactId: payment?.loanContactId ?? "",
    loanCounterparty: payment?.loanCounterparty ?? "",
    accountId: payment?.account?.id ?? "",
    categoryId: payment?.category?.id ?? "",
    ...overrides,
});

const normalizeCategoryName = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function RecurringPaymentForm({ payment, defaults, isPending, onSubmit, onSuccess, onClose }: Props) {
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [terminationMode, setTerminationMode] = useState<"NEVER" | "DATE" | "COUNT">(
        payment?.maxOccurrences ? "COUNT" : payment?.endDate ? "DATE" : "NEVER"
    );
    const [showCreateContact, setShowCreateContact] = useState(false);

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
    const loanContactId = useWatch({ control, name: "loanContactId" });
    const maxOccurrences = useWatch({ control, name: "maxOccurrences" });
    const startDate = useWatch({ control, name: "startDate" });
    const amount = useWatch({ control, name: "amount" });
    const intervalCount = useWatch({ control, name: "intervalCount" });
    const isWeekly = frequency === "WEEKLY" || frequency === "BIWEEKLY";
    const isMonthly = frequency === "MONTHLY" || frequency === "YEARLY";
    const isOneTime = frequency === "ONCE";
    const isLoanAction = loanAction !== "NONE";
    const { loans, isLoading: loansLoading } = useLoansQuery({ status: "PENDING", limit: 100 });
    const { categories } = useCategories();
    const { contacts, loading: contactsLoading } = useContacts();
    const loanTypeForDebt = type === "INCOME" ? "GIVEN" : "RECEIVED";
    const debtByLender = new Map<string, { contactId: string; lender: string; total: number; count: number }>();
    for (const loan of loans) {
        if (loan.type !== loanTypeForDebt) continue;
        const remaining = loan.amountRemaining ?? 0;
        if (remaining <= 0) continue;
        const contactId = loan.contact?.id ?? loan.lender;
        const current = debtByLender.get(contactId) ?? { contactId, lender: loan.lender, total: 0, count: 0 };
        current.total += remaining;
        current.count += 1;
        debtByLender.set(contactId, current);
    }
    const debts = [...debtByLender.values()].sort((a, b) => b.total - a.total);
    const selectedDebt = debts.find((debt) =>
        loanContactId ? debt.contactId === loanContactId : debt.lender === loanCounterparty
    );
    const debtOptions = debts.map((debt) => ({
        value: debt.contactId,
        label: `${debt.lender} · ${formatCurrency(debt.total)} · ${debt.count} préstamo${debt.count === 1 ? "" : "s"}`,
    }));
    const selectedDebtValue = selectedDebt?.contactId ?? "";
    const contactOptions = contacts.map((contact) => ({
        value: contact.id,
        label: contact.name,
    }));
    const loanTitle = loanAction === "PAY_LOAN"
        ? `${payment ? "Editar" : "Programar"} ${type === "INCOME" ? "cobro" : "pago"} de préstamo`
        : loanAction === "GIVE_LOAN"
            ? `${payment ? "Editar" : "Programar"} préstamo otorgado`
            : loanAction === "RECEIVE_LOAN"
                ? `${payment ? "Editar" : "Programar"} préstamo recibido`
                : loanAction === "ADVANCE_LOAN"
                    ? `${payment ? "Editar" : "Programar"} aumento de deuda`
                    : payment ? "Editar movimiento futuro" : "Nuevo movimiento futuro";
    const isLoanSchedule = loanAction === "PAY_LOAN" && frequency !== "ONCE";
    const installmentCount = Number(maxOccurrences ?? 0);
    const scheduleTotal = installmentCount > 0 ? Number(amount || 0) * installmentCount : 0;
    const estimatedEnd = (() => {
        if (!startDate || installmentCount <= 0) return "";
        const steps = Math.max(1, installmentCount - 1) * Math.max(1, Number(intervalCount) || 1);
        if (frequency === "WEEKLY") return dayjs(startDate).add(steps, "week").format("D MMM YYYY");
        if (frequency === "BIWEEKLY") return dayjs(startDate).add(steps * 2, "week").format("D MMM YYYY");
        if (frequency === "FIFTEEN_DAYS") return dayjs(startDate).add(steps * 15, "day").format("D MMM YYYY");
        if (frequency === "MONTHLY") return dayjs(startDate).add(steps, "month").format("D MMM YYYY");
        if (frequency === "YEARLY") return dayjs(startDate).add(steps, "year").format("D MMM YYYY");
        return dayjs(startDate).add(steps, "day").format("D MMM YYYY");
    })();
    const debtPendingAfterPlan = selectedDebt
        ? Math.max(0, selectedDebt.total - scheduleTotal)
        : 0;
    const scheduleOverpay = selectedDebt
        ? Math.max(0, scheduleTotal - selectedDebt.total)
        : 0;

    const assignLoanCategory = useCallback((action: string, paymentType: string) => {
        const targetName = action === "PAY_LOAN" ? "DEVOLUCION DE PRESTAMO" : "PRESTAMOS";
        const category = categories.find(
            (item) =>
                item.type === paymentType &&
                normalizeCategoryName(item.name) === targetName
        );
        if (category) setValue("categoryId", category.id, { shouldValidate: true });
    }, [categories, setValue]);

    const applyLoanContact = (contact?: Contact) => {
        setValue("loanContactId", contact?.id ?? "", { shouldValidate: true });
        setValue("loanCounterparty", contact?.name ?? "", { shouldValidate: true });
        if (!contact) return;
        setValue(
            "name",
            loanAction === "GIVE_LOAN"
                ? `Préstamo a ${contact.name}`
                : `Préstamo de ${contact.name}`,
            { shouldValidate: true }
        );
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
    }, [assignLoanCategory, categories.length, isLoanAction, loanAction, type]);

    useEffect(() => {
        if (loanAction !== "GIVE_LOAN" && loanAction !== "RECEIVE_LOAN") return;
        if (loanContactId || !loanCounterparty || contactsLoading) return;
        const match = contacts.find(
            (contact) => contact.name.toLowerCase() === String(loanCounterparty).toLowerCase()
        );
        if (match) setValue("loanContactId", match.id, { shouldValidate: true });
    }, [contacts, contactsLoading, loanAction, loanContactId, loanCounterparty, setValue]);

    useEffect(() => {
        if (loanAction !== "GIVE_LOAN" && loanAction !== "RECEIVE_LOAN") return;
        const expectedType = loanAction === "GIVE_LOAN" ? "EXPENSE" : "INCOME";
        if (type !== expectedType) {
            setValue("type", expectedType, { shouldValidate: true });
            assignLoanCategory(loanAction, expectedType);
        }
    }, [assignLoanCategory, loanAction, type, setValue]);

    const changeLoanFrequency = (value: string) => {
        setValue("frequency", value as RecurringPaymentFormInput["frequency"], { shouldValidate: true });
        setValue("intervalCount", "1", { shouldValidate: true });

        if (value === "ONCE") {
            setValue("maxOccurrences", "", { shouldValidate: true });
            return;
        }

        const count = maxOccurrences ? Number(maxOccurrences) : 4;
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
            loanAction: isLoanAction ? data.loanAction : "NONE",
            loanId:
                data.loanAction === "ADVANCE_LOAN" ||
                (data.loanAction === "PAY_LOAN" && !data.loanCounterparty)
                    ? data.loanId
                    : undefined,
            loanContactId:
                data.loanAction === "PAY_LOAN" ||
                data.loanAction === "GIVE_LOAN" ||
                data.loanAction === "RECEIVE_LOAN"
                    ? data.loanContactId
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
            title={loanTitle}
            subtitle={isLoanAction ? "No cuenta como gasto ni ingreso." : undefined}
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
                {!isLoanAction && (
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
                            disabled={isPending}
                            leftOption={{ value: "EXPENSE", label: "Gasto", color: "#ef4444", icon: "TrendingDown" }}
                            rightOption={{ value: "INCOME", label: "Ingreso", color: "#22c55e", icon: "TrendingUp" }}
                            label="Tipo de movimiento"
                        />
                    )}
                />
                )}

                <div className={isLoanAction ? "" : "form-default-grid-2col"}>
                    {!isLoanAction && (
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
                    )}

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

                <div className={isLoanAction ? "" : "form-default-grid-2col"}>
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

                    {!isLoanAction && (
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
                    )}
                </div>

                {loanAction !== "PAY_LOAN" && (
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

                {(loanAction === "GIVE_LOAN" || loanAction === "RECEIVE_LOAN") && !isOneTime && (
                    <p className="recurring-form-hint">
                        Cada fecha programada creará un préstamo independiente para esta persona.
                    </p>
                )}

                {isLoanAction && (
                    <>
                        <div className="loan-future-banner loan-order-banner">
                            <span className="loan-future-banner__icon"><HandCoins size={16} /></span>
                            <div>
                                <strong>
                                    {loanAction === "PAY_LOAN"
                                        ? type === "INCOME" ? "Cobro de un préstamo" : "Pago de un préstamo"
                                        : loanAction === "GIVE_LOAN"
                                            ? "Préstamo que otorgas"
                                            : loanAction === "RECEIVE_LOAN"
                                                ? "Préstamo que recibes"
                                                : "Aumento de deuda"}
                                </strong>
                                <small>Se registrará en Préstamos; no cuenta como gasto ni ingreso en tus reportes.</small>
                            </div>
                        </div>

                        {loanAction === "PAY_LOAN" && (
                            <>
                                <Controller
                                    control={control}
                                    name="loanContactId"
                                    render={({ field, fieldState }) => (
                                        <SelectInput
                                            label={type === "INCOME" ? "Persona que te debe" : "Persona a la que debes"}
                                            icon="Users"
                                            className="loan-order-contact"
                                            value={selectedDebtValue || (typeof field.value === "string" ? field.value : "")}
                                            onChange={(value) => {
                                                const debt = debts.find((item) => item.contactId === value);
                                                setValue("loanContactId", debt && isUuid(debt.contactId) ? debt.contactId : "", { shouldValidate: true });
                                                setValue("loanCounterparty", debt?.lender ?? "", { shouldValidate: true });
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
                                                value={field.value}
                                                onChange={changeLoanFrequency}
                                                options={FREQUENCIES}
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

                                {!loansLoading && debts.length === 0 && (
                                    <p className="recurring-form-hint">
                                        No tienes deudas pendientes de ese tipo. Usa Prestar o Recibir si quieres crear un préstamo nuevo.
                                    </p>
                                )}
                            </>
                        )}

                        {loanAction === "ADVANCE_LOAN" && (
                            <Controller
                                control={control}
                                name="loanId"
                                render={({ field, fieldState }) => (
                                    <SelectInput
                                        label="Préstamo que vas a aumentar"
                                        icon="Landmark"
                                        value={typeof field.value === "string" ? field.value : ""}
                                        onChange={(value) => {
                                            field.onChange(value);
                                            const loan = loans.find((item) => item.id === value);
                                            if (!loan) return;
                                            setValue(
                                                "type",
                                                loan.type === "GIVEN" ? "EXPENSE" : "INCOME",
                                                { shouldValidate: true }
                                            );
                                            setValue("name", `Cargo de ${loan.lender}`, { shouldValidate: true });
                                            assignLoanCategory(
                                                "ADVANCE_LOAN",
                                                loan.type === "GIVEN" ? "EXPENSE" : "INCOME"
                                            );
                                        }}
                                        options={loans.map((loan) => ({
                                            value: loan.id,
                                            label: `${loan.lender} · ${loan.type === "GIVEN" ? "me deben" : "yo debo"} · ${formatCurrency(loan.amountRemaining ?? 0)}`,
                                        }))}
                                        placeholder={loansLoading ? "Cargando préstamos..." : "Selecciona un préstamo"}
                                        error={fieldState.error?.message}
                                        disabled={isPending || loansLoading}
                                        required
                                    />
                                )}
                            />
                        )}

                        {(loanAction === "GIVE_LOAN" || loanAction === "RECEIVE_LOAN") && (
                            <>
                                <Controller
                                    control={control}
                                    name="loanContactId"
                                    render={({ field, fieldState }) => (
                                        <SelectInput
                                            label={loanAction === "GIVE_LOAN" ? "Persona a la que prestas" : "Persona que te presta"}
                                            icon="Users"
                                            className="loan-order-contact"
                                            value={typeof field.value === "string" ? field.value : ""}
                                            onChange={(value) => {
                                                applyLoanContact(contacts.find((contact) => contact.id === value));
                                            }}
                                            options={contactOptions}
                                            placeholder={contactsLoading ? "Cargando contactos..." : "Selecciona una persona"}
                                            error={fieldState.error?.message}
                                            disabled={isPending || contactsLoading}
                                            required
                                        />
                                    )}
                                />
                                <button
                                    type="button"
                                    className="btn-ghost loan-create-contact"
                                    onClick={() => setShowCreateContact(true)}
                                    disabled={isPending}
                                >
                                    <Plus size={13} /> Crear contacto nuevo
                                </button>
                            </>
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
                            label={
                                loanAction === "GIVE_LOAN" || loanAction === "RECEIVE_LOAN"
                                    ? isOneTime ? "Fecha del préstamo" : "Primera fecha"
                                    : isOneTime
                                        ? "Fecha del pago o cobro"
                                        : isLoanSchedule
                                            ? "Primera cuota"
                                            : "Inicio"
                            }
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

                {!isLoanAction && type === "EXPENSE" && !isOneTime && (
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
                        {isPending
                            ? "Guardando…"
                            : payment
                                ? "Actualizar programación"
                                : isLoanAction
                                    ? "Programar movimiento"
                                    : "Crear movimiento futuro"}
                    </button>
                </div>
            </form>

            {showCreateContact && (
                <CreateContactModal
                    isOpen
                    onCreated={(contact) => {
                        applyLoanContact(contact);
                        setShowCreateContact(false);
                    }}
                    onClose={() => setShowCreateContact(false)}
                />
            )}
        </FormContainer>
    );
}
