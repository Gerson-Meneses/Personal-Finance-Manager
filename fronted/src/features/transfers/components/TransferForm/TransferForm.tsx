import { useEffect } from "react";
import {
    ArrowLeftRight,
    ArrowRightLeft,
} from "lucide-react";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";

import { Transfer, type TransferInput, type TransferOutput } from "../../types";
import type { Transaction } from "../../../transactions/types";
import type { Account } from "../../../accounts/types";
import type { DataError } from "../../../../shared/dataApiInterface";

import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";

import "./TransferForm.css";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
    mutation: UseMutationResult<Transaction, DataError<TransferOutput>, TransferOutput>;
    /** Cuenta pre-seleccionada como origen (ej. al abrir desde el detalle de cuenta) */
    account?: Account;
    onSuccess?: (tx?: Transaction) => void;
    onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */
const buildDefaults = (account?: Account): TransferInput => ({
    fromAccount: account?.id ?? "",
    toAccount:   "",
    amount:      "" as any,      // el schema lo transforma a number
    date:        dayjs().format("YYYY-MM-DD"),
    time:        dayjs().format("HH:mm"),
    description: "",
});

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function TransferForm({ mutation, account, onSuccess, onClose }: Props) {
    const { mutateAsync, isPending, error, isSuccess, reset: resetMutation } = mutation;

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isDirty, isValid },
    } = useForm<TransferInput, unknown, TransferOutput>({
        resolver: zodResolver(Transfer),
        mode: "onChange",
        defaultValues: buildDefaults(account),
    });

    /* Necesitamos el id de fromAccount para excluirlo del selector destino */
    const fromAccountId = watch("fromAccount");

    /* Resetear cuando la mutación tiene éxito */
    useEffect(() => {
        if (!isSuccess) return;
        reset(buildDefaults(account));
        resetMutation();
    }, [isSuccess]);

    /* ---------- submit ---------- */
    const onSubmit = async (data: TransferOutput) => {
        const result = await mutateAsync(data, {
            onSuccess: (tx) => onSuccess?.(tx),
        });
        void result;
    };

    return (
        <FormContainer
            title="Transferencia"
            icon={<ArrowLeftRight size={20} />}
            error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="form-default-container">

                {/* ── CUENTAS (origen → destino) ───────────────────────────── */}
                <div className="transfer-accounts-row">

                    <Controller
                        control={control}
                        name="fromAccount"
                        render={({ field, fieldState }) => (
                            <SelectAccount
                                label="Cuenta origen"
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                noCredit
                                required
                                icon="BanknoteArrowUp"
                            />
                        )}
                    />

                    {/* Flecha central decorativa */}
                    <div className="transfer-arrow-badge" aria-hidden="true">
                        <ArrowRightLeft size={16} />
                    </div>

                    <Controller
                        control={control}
                        name="toAccount"
                        render={({ field, fieldState }) => (
                            <SelectAccount
                                label="Cuenta destino"
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                noAccountId={fromAccountId}
                                noCredit
                                required
                                icon="BanknoteArrowDown"
                            />
                        )}
                    />
                </div>

                {/* ── MONTO ────────────────────────────────────────────────── */}
                <Controller
                    control={control}
                    name="amount"
                    render={({ field, fieldState }) => (
                        <NumericInput
                            label="Monto a transferir"
                            value={field.value?.toString()}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            icon="CircleDollarSign"
                            symbol="S/"
                        />
                    )}
                />

                {/* ── FECHA + HORA ──────────────────────────────────────────── */}
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
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                selectedDate={watch("date")}
                            />
                        )}
                    />
                </div>

                {/* ── DESCRIPCIÓN ───────────────────────────────────────────── */}
                <Controller
                    control={control}
                    name="description"
                    render={({ field, fieldState }) => (
                        <TextInput
                            label="Descripción"
                            placeholder="Notas adicionales…"
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            textarea
                            icon="AlignLeft"
                        />
                    )}
                />

                {/* ── ACTIONS ──────────────────────────────────────────────── */}
                <div className="form-default-row form-actions-container">
                    <SuccessToast
                        isSucces={isSuccess}
                        successText="Transferencia realizada con éxito."
                    >
                        <button
                            type="submit"
                            className="btn-submit transfer"
                            disabled={isPending || !isDirty || !isValid}
                        >
                            <ArrowLeftRight size={15} />
                            {isPending ? "Procesando…" : "Confirmar transferencia"}
                        </button>
                    </SuccessToast>
                </div>

            </form>
        </FormContainer>
    );
}