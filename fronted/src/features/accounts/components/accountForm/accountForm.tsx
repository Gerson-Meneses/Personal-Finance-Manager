import { useEffect, useState } from "react";
import {
    AccountSchema,
    type Account,
    type AccountSchemaInput,
    type AccountSchemaOutput,
    type AccountType,
    type UpdateAccountOutput,
} from "../../types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError } from "../../../../shared/dataApiInterface";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { ColorPicker } from "../../../../shared/components/ColorPicker/ColorPicker";
import { IconPicker } from "../../../../shared/components/IconPicker/IconPicker";
import "./accountForm.css";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";
import { useAccounts } from "../../hooks";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Wallet,
    CreditCard,
    Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface Fields {
    name?: boolean;
    balance?: boolean;
    type?: boolean;
    color?: boolean;
    icon?: boolean;
    creditLimit?: boolean;
    billingCloseDay?: boolean;
    paymentDueDay?: boolean;
    overdraft?: boolean;
    all?: boolean;
    delete?: boolean;
}

interface PropsAccountForm {
    mutation: UseMutationResult<
        Account,
        DataError<AccountSchemaOutput>,
        AccountSchemaOutput | UpdateAccountOutput
    >;
    account?: Account;
    fieldsHidden?: Fields;
    fieldsDisabled?: Fields;
    isEdit?: boolean;
    /** Nombre precargado al crear una cuenta */
    initialName?: string;
    onSuccess?: (account?: Account) => void;
    onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Default values                                                      */
/* ------------------------------------------------------------------ */
const defaultDebitValues: AccountSchemaInput = {
    type: "DEBIT",
    name: "",
    color: "#000",
    icon: "landmark",
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function AccountForm({
    mutation,
    account,
    fieldsHidden,
    fieldsDisabled,
    isEdit,
    initialName,
    onSuccess,
    onClose,
}: PropsAccountForm) {
    const { mutateAsync, isPending, error, isSuccess } = mutation;
    const { deleteAccount } = useAccounts();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { isDirty, isValid },
    } = useForm<AccountSchemaInput, unknown, AccountSchemaOutput>({
        resolver: zodResolver(AccountSchema),
        mode: "onChange",
        defaultValues: {
            ...defaultDebitValues,
            ...(initialName ? { name: initialName } : {}),
        },
    });

    const accountType = useWatch({ control, name: "type" });
    const isCredit = accountType === "CREDIT";

    /* ---------- populate on edit ---------- */
    useEffect(() => {
        if (!isEdit || !account) return;

        const credit = account.type === "CREDIT";
        reset({
            type: account.type as AccountSchemaInput["type"],
            name: account.name,
            color: account.color,
            icon: account.icon,
            creditLimit: credit ? account.creditLimit : undefined,
            overdraft: credit ? account.overdraft : undefined,
            paymentDueDay: credit ? account.paymentDueDay : undefined,
            billingCloseDay: credit ? account.billingCloseDay : undefined,
        });
        mutation.reset();
    }, [isEdit, account, reset]);

    /* ---------- toggle type ---------- */
    useEffect(() => {
        if (isEdit) return;
        if (isCredit) {
            setValue("creditLimit", 0);
            setValue("overdraft", 0);
            setValue("paymentDueDay", 0);
            setValue("billingCloseDay", 0);
        } else {
            reset(defaultDebitValues, { keepValues: true });
        }
    }, [accountType, isEdit, setValue, reset]);

    /* ---------- submit ---------- */
    const onSubmit = async (data: AccountSchemaOutput) => {
        console.log("Submitting account data:", data);
        let newAccount: Account;
        if (isEdit && account) {
            const updateData: UpdateAccountOutput = { ...data, accountId: account.id };
            newAccount = await mutateAsync(updateData, {
            });
            console.log("Account updated:", newAccount);
            return;
        }
        newAccount = await mutateAsync(data, {
            onSuccess: () => {
                reset(defaultDebitValues);
            },
        });
        onSuccess?.(newAccount);
        console.log("New account created:", newAccount);
    };

    /* ---------- helpers ---------- */
    const headerIcon = isCredit
        ? <ArrowUpCircle size={20} />
        : <ArrowDownCircle size={20} />;

    const successText = isCredit
        ? "Cuenta de Crédito guardada con éxito."
        : "Cuenta de Débito guardada con éxito.";

    return (
        <>
        <FormContainer
            title={isEdit ? "Editar Cuenta" : "Nueva Cuenta"}
            icon={headerIcon}
            error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-2xl mx-auto"
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="form-default-container">

                {/* ── TYPE TOGGLE ─────────────────────────────────────────── */}
                {!fieldsHidden?.type && (
                    <Controller
                        control={control}
                        name="type"
                        render={({ field, fieldState }) => (
                            <TypeToggle<AccountType>
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending || fieldsDisabled?.type || fieldsDisabled?.all}
                                leftOption={{
                                    color: "#378ADD",
                                    value: "DEBIT",
                                    label: "DÉBITO",
                                    icon: "wallet",
                                }}
                                rightOption={{
                                    color: "#993C1D",
                                    value: "CREDIT",
                                    label: "CRÉDITO",
                                    icon: "CreditCard",
                                }}
                            />
                        )}
                    />
                )}

                {/* ── NOMBRE ──────────────────────────────────────────────── */}
                {!fieldsHidden?.name && (
                    <Controller
                        control={control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <TextInput
                                label="Nombre de la cuenta"
                                placeholder="Ej. Nómina, Tarjeta Platinum…"
                                icon={isCredit ? "CreditCard" : "Wallet"}
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending || fieldsDisabled?.name || fieldsDisabled?.all}
                            />
                        )}
                    />
                )}

                {/* ── COLOR + ICONO ────────────────────────────────────────── */}
                <div className="form-default-grid-2col">
                    {!fieldsHidden?.color && (
                        <Controller
                            control={control}
                            name="color"
                            render={({ field, fieldState }) => (
                                <ColorPicker
                                    label="Color"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                    disabled={isPending || fieldsDisabled?.color || fieldsDisabled?.all}
                                />
                            )}
                        />
                    )}

                    {!fieldsHidden?.icon && (
                        <Controller
                            control={control}
                            name="icon"
                            render={({ field, fieldState }) => (
                                <IconPicker
                                    label="Icono"
                                    icon="LayoutGrid"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                    disabled={isPending || fieldsDisabled?.icon || fieldsDisabled?.all}
                                />
                            )}
                        />
                    )}
                </div>

                {/* ── CAMPOS EXCLUSIVOS DE CRÉDITO ────────────────────────── */}
                {isCredit && (
                    <div className="form-credit-section">

                        {/* Separador decorativo */}
                        <div className="form-credit-divider">Datos de crédito</div>

                        {/* Límite + Sobregiro */}
                        <div className="form-default-grid-2col">
                            {!fieldsHidden?.creditLimit && (
                                <Controller
                                    control={control}
                                    name="creditLimit"
                                    render={({ field, fieldState }) => (
                                        <NumericInput
                                            label="Límite de crédito"
                                            value={field.value as string | undefined}
                                            icon="dollarSign"
                                            symbol="S/"
                                            onChange={field.onChange}
                                            error={fieldState.error?.message}
                                            disabled={isPending || fieldsDisabled?.creditLimit || fieldsDisabled?.all}
                                        />
                                    )}
                                />
                            )}

                            {!fieldsHidden?.overdraft && (
                                <Controller
                                    control={control}
                                    name="overdraft"
                                    render={({ field, fieldState }) => (
                                        <NumericInput
                                            label="Sobregiro permitido"
                                            value={field.value as string | undefined}
                                            icon="percent"
                                            symbol="%"
                                            onChange={field.onChange}
                                            error={fieldState.error?.message}
                                            disabled={isPending || fieldsDisabled?.overdraft || fieldsDisabled?.all}
                                        />
                                    )}
                                />
                            )}
                        </div>

                        {/* Cierre + Vencimiento */}
                        <div className="form-default-grid-2col">
                            {!fieldsHidden?.billingCloseDay && (
                                <Controller
                                    control={control}
                                    name="billingCloseDay"
                                    render={({ field, fieldState }) => (
                                        <NumericInput
                                            label="Día de cierre"
                                            placeholder="1 – 31"
                                            value={field.value as string | undefined}
                                            icon="calendarCheck"
                                            onChange={field.onChange}
                                            error={fieldState.error?.message}
                                            disabled={isPending || fieldsDisabled?.billingCloseDay || fieldsDisabled?.all}
                                        />
                                    )}
                                />
                            )}

                            {!fieldsHidden?.paymentDueDay && (
                                <Controller
                                    control={control}
                                    name="paymentDueDay"
                                    render={({ field, fieldState }) => (
                                        <NumericInput
                                            label="Día límite de pago"
                                            placeholder="1 – 31"
                                            value={field.value as string | undefined}
                                            icon="calendarClock"
                                            onChange={field.onChange}
                                            error={fieldState.error?.message}
                                            disabled={isPending || fieldsDisabled?.paymentDueDay || fieldsDisabled?.all}
                                        />
                                    )}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ── ACTIONS ─────────────────────────────────────────────── */}
                <div className="form-default-row form-actions-container">

                    {!fieldsDisabled?.all && (
                        <SuccessToast successText={successText} isSucces={isSuccess}>
                            <button
                                type="submit"
                                className={`btn-submit ${accountType.toLowerCase()}`}
                                disabled={isPending || !isDirty || !isValid}
                            >
                                {isCredit
                                    ? <CreditCard size={15} />
                                    : <Wallet size={15} />
                                }
                                {isEdit ? "Actualizar" : "Crear cuenta"}
                            </button>
                        </SuccessToast>
                    )}

                    {(!fieldsHidden?.delete && account) && (
                        <button
                            type="button"
                            className="btn-icon btn-icon-delete"
                            disabled={deleteAccount.isPending}
                            onClick={() => setConfirmDelete(true)}
                        >
                            <Trash2 size={15} />
                            {deleteAccount.isPending ? "Eliminando…" : "Eliminar"}
                        </button>
                    )}
                </div>

            </form>
            </FormContainer>

            <InfoModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    if (!account) return;
                    deleteAccount.mutate(account.id, {
                        onSuccess: () => {
                            setConfirmDelete(false);
                            onClose?.();
                        },
                    });
                }}
                type="error"
                title="Eliminar cuenta"
                message="¿Seguro que deseas eliminar esta cuenta? Esta acción no se puede deshacer."
                confirmText={deleteAccount.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deleteAccount.isPending}
            />
        </>
    );
}