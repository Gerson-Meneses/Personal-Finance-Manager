import { useEffect } from "react";
import {
    CreditCard,
    CheckCircle2,
} from "lucide-react";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    PaymentCreditCardSchema,
    type PaymentCreditCardInput,
    type PaymentCreditCardOutput,
} from "../types";
import { usePayCreditCard } from "../hooks";

import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";

import "./CreditPaymentForm.css";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
    cardId: string;
    cardName: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */
const buildDefaults = (cardName: string): PaymentCreditCardInput => ({
    accountId: "",
    amount: "",
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    description: `Pago ${cardName}`,
});

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function PaymentCreditCardForm({ cardId, cardName, onSuccess, onClose }: Props) {
    const { mutate, isPending, error, isSuccess, reset: resetMutation } = usePayCreditCard();

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isDirty, isValid },
    } = useForm<PaymentCreditCardInput, unknown, PaymentCreditCardOutput>({
        resolver: zodResolver(PaymentCreditCardSchema),
        mode: "onChange",
        defaultValues: buildDefaults(cardName),
    });

    /* Resetear al éxito */
    useEffect(() => {
        if (!isSuccess) return;
        reset(buildDefaults(cardName));
        resetMutation();
        onSuccess?.();
    }, [isSuccess]);

    /* ---------- submit ---------- */
    const onSubmit = (data: PaymentCreditCardOutput) => {
        mutate({ cardId, data });
    };

    return (
        <FormContainer
            title="Pagar Tarjeta"
            icon={<CreditCard size={20} />}
            subtitle={cardName}
            error={error ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="form-default-container">

                {/* ── CUENTA ORIGEN ────────────────────────────────────────── */}
                <Controller
                    control={control}
                    name="accountId"
                    render={({ field, fieldState }) => (
                        <SelectAccount
                            label="Cuenta de origen"
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

                {/* ── MONTO ────────────────────────────────────────────────── */}
                <Controller
                    control={control}
                    name="amount"
                    render={({ field, fieldState }) => (
                        <NumericInput
                            label="Monto a pagar"
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
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            textarea
                            icon="AlignLeft"
                        />
                    )}
                />

                {/* ── ACTIONS ──────────────────────────────────────────────── */}
                <div className="form-actions-container">
                    <SuccessToast
                        isSucces={isSuccess}
                        successText={`Pago de "${cardName}" registrado con éxito.`}
                    >
                        <button
                            type="submit"
                            className="btn-submit payment"
                            disabled={isPending || !isDirty || !isValid}
                        >
                            <CheckCircle2 size={15} />
                            {isPending ? "Procesando…" : "Confirmar pago"}
                        </button>
                    </SuccessToast>
                </div>

            </form>
        </FormContainer>
    );
}