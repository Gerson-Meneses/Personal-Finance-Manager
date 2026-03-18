import { useState } from "react"
import type { Account, AccountType } from "../../types"
import FormWrapper from "../../../../shared/components/FormWrapper"

interface Props {
    onSubmit: (data: Partial<Account>) => Promise<Account | void>
    noAllowed?: {
        name?: boolean
        balance?: boolean
        type?: boolean
        color?: boolean
        icon?: boolean
        creditLimit?: boolean
        billingCloseDay?: boolean
        paymentDueDay?: boolean
        overdraft?: boolean
    }
    data?: { type: "CREDIT" | "DEBIT" }
}

export default function AccountForm({ onSubmit, noAllowed, data }: Props) {
    const [name, setName] = useState("")
    const [balance, setBalance] = useState(0)
    const [type, setType] = useState<AccountType>(data?.type || "DEBIT")
    const [color, setColor] = useState("#000000")
    const [icon, setIcon] = useState("")
    const [creditLimit, setCreditLimit] = useState(0)
    const [billingCloseDay, setBillingCloseDay] = useState(0)
    const [paymentDueDay, setPaymentDueDay] = useState(0)
    const [overdraft, setOverdraft] = useState(0)

    // Determinar si la cuenta actual es de crédito
    const isCredit = (data?.type || type) === "CREDIT"

    // Validación robusta: Deshabilita si falta algún campo requerido visible
    const isFormInvalid = () => {
        if (!noAllowed?.name && !name.trim()) return true
        if (!noAllowed?.balance && (balance === undefined || isNaN(balance))) return true

        // Validaciones solo si es Crédito
        if (isCredit) {
            if (!noAllowed?.creditLimit && creditLimit <= 0) return true
            if (!noAllowed?.billingCloseDay && billingCloseDay <= 0) return true
            if (!noAllowed?.paymentDueDay && paymentDueDay <= 0) return true
        }

        return false
    }

    return (
        <FormWrapper<Account> onSubmit={onSubmit}>
            {({ loading, error, handleSubmit }) => (
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        const payload: Partial<Account> = {
                            name,
                            balance,
                            type: data?.type || type,
                            color,
                            icon,
                        }

                        // Solo enviamos datos de crédito si aplica
                        if (isCredit) {
                            Object.assign(payload, {
                                creditLimit,
                                billingCloseDay,
                                paymentDueDay,
                                overdraft,
                            })
                        }

                        handleSubmit(payload)
                    }}
                >
                    {/* TIPO DE CUENTA */}
                    {noAllowed?.type || (
                        <div>
                            <label htmlFor="type">Tipo de Cuenta</label>
                            <select
                                id="type"
                                value={data?.type || type}
                                onChange={(e) => setType(e.target.value as AccountType)}
                                disabled={!!data?.type}
                                required={!noAllowed?.type}
                            >
                                <option value="DEBIT">Débito</option>
                                <option value="CREDIT">Crédito</option>
                            </select>
                        </div>
                    )}

                    {/* NOMBRE */}
                    {noAllowed?.name || (
                        <div>
                            <label htmlFor="name">Nombre de la Cuenta</label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Ej. Visa Oro, Ahorros BBVA..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!noAllowed?.name}
                            />
                        </div>
                    )}

                    {/* BALANCE (Siempre visible) */}
                    {!isCredit && (noAllowed?.balance || (
                        <div>
                            <label htmlFor="balance">
                                {isCredit ? "Deuda Actual (Balance)" : "Balance Inicial"}
                            </label>
                            <input
                                id="balance"
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(Number(e.target.value))}
                                required={!noAllowed?.balance}
                            />
                        </div>
                    ))}

                    {/* CAMPOS CONDICIONALES DE CRÉDITO */}
                    {isCredit && (
                        <>
                            {noAllowed?.creditLimit || (
                                <div>
                                    <label htmlFor="creditLimit">Límite de Crédito</label>
                                    <input
                                        id="creditLimit"
                                        type="number"
                                        value={creditLimit}
                                        onChange={(e) => setCreditLimit(Number(e.target.value))}
                                        required={!noAllowed?.creditLimit}
                                    />
                                </div>
                            )}

                            {noAllowed?.billingCloseDay || (
                                <div>
                                    <label htmlFor="billingCloseDay">Día de Cierre</label>
                                    <input
                                        id="billingCloseDay"
                                        type="number"
                                        max={29}
                                        min={1}
                                        value={billingCloseDay}
                                        onChange={(e) => setBillingCloseDay(Number(e.target.value))}
                                        required={!noAllowed?.billingCloseDay}
                                    />
                                </div>
                            )}

                            {noAllowed?.paymentDueDay || (
                                <div>
                                    <label htmlFor="paymentDueDay">Día de Pago</label>
                                    <input
                                        id="paymentDueDay"
                                        type="number"
                                        max={29}
                                        min={1}
                                        value={paymentDueDay}
                                        onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                                        required={!noAllowed?.paymentDueDay}
                                    />
                                </div>
                            )}

                            {noAllowed?.overdraft || (
                                <div>
                                    <label htmlFor="overdraft">Sobregiro Permitido (%)</label>
                                    <input
                                        id="overdraft"
                                        type="number"
                                        value={overdraft}
                                        onChange={(e) => setOverdraft(Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* ESTÉTICA */}
                    {noAllowed?.color || (
                        <div>
                            <label htmlFor="color">Color</label>
                            <input
                                id="color"
                                type="color"
                                value={color}
                                onChange={(e) => {setColor(e.target.value); console.log(e.target.value)}}
                            />
                        </div>
                    )}

                    {noAllowed?.icon || (
                        <div>
                            <label htmlFor="icon">Nombre del Icono</label>
                            <input
                                id="icon"
                                type="text"
                                placeholder="wallet"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                            />
                        </div>
                    )}

                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || isFormInvalid()}
                    >
                        {loading ? "Guardando..." : "Crear cuenta"}
                    </button>
                </form>
            )}
        </FormWrapper>
    )
}
