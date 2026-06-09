import { useEffect } from "react";
import {
    HandCoins,
    CheckCircle2,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    QuickPaySchema,
    initialQuickPay,
    type QuickpayInput,
    type QuickpayOutput,
} from "./types";
import type { LoanType } from "../loans/types";
import { useLoanPayments } from "../loans/hooks";

import { TypeToggle } from "../../shared/components/TypeToggle/TypeToggle";
import { NumericInput } from "../../shared/components/NumericInput/NumericInput";
import { SelectAccount } from "../accounts/components/selectAccount/selectAccount";
import { DatePicker, TimePicker } from "../../shared/components/DateInput/DateInput";
import { TextInput } from "../../shared/components/TextInput/TextInput";
import { SuccessToast } from "../../shared/components/SuccesToast/SuccesToast";
import { FormContainer } from "../../shared/components/FormContainer/FormContainer";

import "./QuickPayForm.css";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
    lender: string;
    type?: LoanType;
    onSuccess?: () => void;
    onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export const QuickPayForm = ({ lender, type, onSuccess, onClose }: Props) => {
    const { quickPay } = useLoanPayments();
    const { mutate, isPending, error, isSuccess, reset: resetMutation } = quickPay;

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { isDirty, isValid },
    } = useForm<QuickpayInput, unknown, QuickpayOutput>({
        resolver: zodResolver(QuickPaySchema),
        mode: "onChange",
        defaultValues: {
            ...initialQuickPay,
            lender,
            type: type ?? initialQuickPay.type,
        },
    });

    /* Sincroniza props externas (lender / type) sin destruir lo que el
       usuario ya escribió en los otros campos                          */
    useEffect(() => {
        if (lender) setValue("lender", lender, { shouldDirty: false, shouldValidate: true });
    }, [lender, setValue]);

    useEffect(() => {
        if (type) setValue("type", type, { shouldDirty: false, shouldValidate: true });
    }, [type, setValue]);

    /* Reset al éxito */
    useEffect(() => {
        if (!isSuccess) return;
        reset({ ...initialQuickPay, lender, type: type ?? initialQuickPay.type });
        resetMutation();
        onSuccess?.();
    }, [isSuccess]);

    /* Observamos el tipo para derivar lógica de UI */
    const loanType = useWatch({ control, name: "type" });
    const isGiven = loanType === "GIVEN";     // "Presté dinero"
    const typeClass = isGiven ? "given" : "received";

    /* ---------- submit ---------- */
    const onSubmit = (data: QuickpayOutput) => {
        mutate(data);
    };

    return (
        <FormContainer
            title={`Pago rapido de ${lender}`}
            icon={<HandCoins size={20} />}
            error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form
                onSubmit={handleSubmit(onSubmit)}
                className={`form-default-container quickpay-form ${typeClass}`}
            >

                {/* ── TIPO ─────────────────────────────────────────────────── */}
                <Controller
                    control={control}
                    name="type"
                    render={({ field, fieldState }) => (
                        <TypeToggle<LoanType>
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            label="Dinero que..."
                            disabled={isPending}
                            leftOption={{
                                value: "GIVEN",
                                label: "Presté",
                                color: "#7C3AED",
                                icon: "TrendingUp",
                            }}
                            rightOption={{
                                value: "RECEIVED",
                                label: "Recibí",
                                color: "#0891B2",
                                icon: "TrendingDown",
                            }}
                        />
                    )}
                />

                {/* ── MONTO + CUENTA ───────────────────────────────────────── */}
                <div className="form-default-grid-2col">
                    <Controller
                        control={control}
                        name="amount"
                        render={({ field, fieldState }) => (
                            <NumericInput
                                label="Monto"
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
                                label={isGiven ? "Cuenta de origen" : "Cuenta de destino"}
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                /* Si presté (GIVEN) el dinero sale de mi cuenta → sin crédito
                                   Si me prestaron (RECEIVED) puede entrar a cualquiera        */
                                noCredit={!!isGiven}
                                balance={!isGiven}
                                required
                            />
                        )}
                    />
                </div>

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
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                selectedDate={useWatch({ control, name: "date" })}
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

                {/* ── ACTIONS ──────────────────────────────────────────────── */}
                <div className="form-actions-container">
                    <SuccessToast
                        isSucces={isSuccess}
                        successText="Pago registrado con éxito."
                    >
                        <button
                            type="submit"
                            className={`btn-submit quickpay ${typeClass}`}
                            disabled={isPending || !isDirty || !isValid}
                        >
                            <CheckCircle2 size={14} />
                            {isPending ? "Guardando…" : "Guardar Pago"}
                        </button>
                    </SuccessToast>
                </div>

            </form>
        </FormContainer>
    );
};