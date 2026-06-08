import { useEffect } from "react";
import {
    HandCoins,
    CheckCircle2,
} from "lucide-react";
import dayjs from "dayjs";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";

import {
    CreateLoanSchema,
    type CreateLoanInput,
    type CreateLoanOutput,
    type Loan,
    type LoanType,
} from "../../types";
import type { DataError } from "../../../../shared/dataApiInterface";

import { TypeToggle }         from "../../../../shared/components/TypeToggle/TypeToggle";
import { NumericInput }       from "../../../../shared/components/NumericInput/NumericInput";
import { SelectAccount }      from "../../../accounts/components/selectAccount/selectAccount";
import { SelectOrInputText }  from "../../../../shared/components/SelectOrInputText/SelectOrInputText";
import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import { TextInput }          from "../../../../shared/components/TextInput/TextInput";
import { SuccessToast }       from "../../../../shared/components/SuccesToast/SuccesToast";
import { FormContainer }      from "../../../../shared/components/FormContainer/FormContainer";

import "./LoanForm.css";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
    lenders?:  string[];
    initialData?: Partial<CreateLoanInput>;
    mutation:  UseMutationResult<Loan, DataError<CreateLoanOutput>, CreateLoanOutput>;
    onSuccess?: () => void;
    onClose?:  () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */
const defaultValues: CreateLoanInput = {
    lender:    "",
    amount:    "" as any,
    type:      "GIVEN",
    startDate: dayjs().format("YYYY-MM-DD"),
    date:      dayjs().format("YYYY-MM-DD"),
    time:      dayjs().format("HH:mm"),
    accountId: "",
    description: "",
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function LoanForm({ lenders = [], mutation, onSuccess, onClose, initialData }: Props) {
    const { mutateAsync, isPending, error, isSuccess, reset: resetMutation } = mutation;

    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty, isValid },
    } = useForm<CreateLoanInput, unknown, CreateLoanOutput>({
        resolver: zodResolver(CreateLoanSchema),
        mode: "onChange",
        defaultValues: { ...defaultValues, ...initialData },
    });

    const loanType = useWatch({ control, name: "type" });
    const dateVal  = useWatch({ control, name: "date" });
    const isGiven  = loanType === "GIVEN";
    const typeClass = isGiven ? "given" : "received";

    /* Reset on success */
    useEffect(() => {
        if (!isSuccess) return;
        reset(defaultValues);
        resetMutation();
        onSuccess?.();
    }, [isSuccess]);

    /* ---------- submit ---------- */
    const onSubmit = async (data: CreateLoanOutput) => {
        await mutateAsync(data);
    };

    return (
        <FormContainer
            title="Crear Préstamo"
            icon={<HandCoins size={20} />}
            error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form
                onSubmit={handleSubmit(onSubmit)}
                className={`form-default-container loan-form ${typeClass}`}
                noValidate
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

                {/* ── PERSONA / PRESTAMISTA ────────────────────────────────── */}
                <Controller
                    control={control}
                    name="lender"
                    render={({ field, fieldState }) => (
                        <SelectOrInputText
                            label={isGiven ? "Deudor" : "Prestamista"}
                            icon="User"
                            value={field.value}
                            options={lenders}
                            onChange={field.onChange}
                            placeholder="Selecciona o escribe…"
                            error={fieldState.error?.message}
                            disabled={isPending}
                            required
                            name="loan-lender"
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
                                noCredit={!isGiven} 
                                balance={isGiven}
                                required
                            />
                        )}
                    />
                </div>

                {/* ── FECHA DE INICIO ──────────────────────────────────────── */}
                <Controller
                    control={control}
                    name="startDate"
                    render={({ field, fieldState }) => (
                        <DatePicker
                            label="Fecha de inicio del préstamo"
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                        />
                    )}
                />

                {/* ── FECHA + HORA DE REGISTRO ─────────────────────────────── */}
                <div className="loan-form-section-label">
                    <span>Fecha de registro</span>
                </div>

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
                                selectedDate={dateVal}
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
                            name="loan-description"
                        />
                    )}
                />

                {/* ── ACTIONS ──────────────────────────────────────────────── */}
                <div className="form-actions-container">
                    <SuccessToast
                        isSucces={isSuccess}
                        successText="Préstamo guardado con éxito."
                    >
                        <button
                            type="submit"
                            className={`btn-submit loan ${typeClass}`}
                            disabled={isPending || !isDirty || !isValid}
                            aria-busy={isPending}
                        >
                            <CheckCircle2 size={14} />
                            {isPending ? "Guardando…" : "Crear préstamo"}
                        </button>
                    </SuccessToast>
                </div>

            </form>
        </FormContainer>
    );
}