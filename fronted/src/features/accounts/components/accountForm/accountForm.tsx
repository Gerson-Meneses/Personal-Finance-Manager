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
    }
}

export default function AccountForm({ onSubmit, noAllowed }: Props) {
    const [name, setName] = useState("")
    const [balance, setBalance] = useState(0)
    const [type, setType] = useState<AccountType>("DEBIT")
    const [color, setColor] = useState("#000000")
    const [icon, setIcon] = useState("")

    return (
        <FormWrapper<Account> onSubmit={onSubmit}>
            {({ loading, error, handleSubmit }) => (

                <form
                    onSubmit={(e) => {
                        e.preventDefault()

                        handleSubmit({
                            name,
                            balance,
                            type,
                            color,
                            icon
                        })
                    }}
                >
                    {
                        noAllowed?.name ||
                        <input
                            type="text"
                            id="name"
                            placeholder="Ingrese el nombre de la cuenta."
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                        />

                    }

                    {
                        noAllowed?.balance ||
                        <input
                            id="balance"
                            type="number"
                            placeholder="Ingrese el balance inicial de la cuenta."
                            value={balance}
                            onChange={(e) =>
                                setBalance(Number(e.target.value))
                            }
                        />
                    }

                    {
                        noAllowed?.type ||
                        <select
                            value={type}
                            id="type"
                            onChange={(e) =>
                                setType(e.target.value as AccountType)
                            }
                        >
                            <option value="DEBIT">Debito</option>
                            <option value="CREDIT">Credito</option>
                        </select>
                    }

                    {
                        noAllowed?.color ||
                        <input
                            type="color"
                            id="color"
                            placeholder="Ingrese el color en hexadecimal (opcional)."
                            value={color}
                            onChange={(e) =>
                                setColor(e.target.value)
                            }
                        />
                    }

                    {
                        noAllowed?.icon ||
                        <input
                            type="text"
                            id="icon"
                            placeholder="Ingrese el nombre del icono (opcional)."
                            value={icon}
                            onChange={(e) =>
                                setIcon(e.target.value)
                            }
                        />
                    }

                    {error && <p>{error}</p>}

                    <button disabled={loading}>

                        {loading
                            ? "Guardando..."
                            : "Crear cuenta"}

                    </button>

                </form>

            )}
        </FormWrapper>
    )
}