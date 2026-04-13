import LoadingScreen from "../../../../shared/components/LoadingScreen/LoadingScreen"
import { useAccounts } from "../../hooks"
import type { Account, AccountType } from "../../types"
import './selectAccount.css'
import { getIcon } from '../../../../shared/utils/GetIcon'
import { formatCurrency } from "../../../../shared/utils/formatCurrency"

interface Props {
    onChange: (accountId: string) => void
    value?: string
    type?: AccountType
    noCredit?: boolean
    balance?: boolean
    noRenderBalance?: boolean
    placehoder?: string
    noAccountId?: string
    label?: string
    icon?: string
    error?: string | null
    required?: boolean
    disabled?: boolean
}

export const SelectAccount = ({
    onChange,
    value,
    type,
    balance,
    label = "Cuenta",
    noRenderBalance,
    error,
    placehoder = "Seleccionar Cuenta",
    noAccountId,
    icon = "Wallet",
    noCredit,
    disabled,
    required }: Props) => {

    const { accounts, loading } = useAccounts()

    if (loading) return <LoadingScreen></LoadingScreen>

    let filtered = type ? accounts.filter(acc => acc.type === type) : accounts

    filtered = noCredit ? filtered.filter(acc => acc.type !== "CREDIT") : filtered

    filtered = balance ? filtered.filter(acc => acc.balance > 0) : filtered

    filtered = noAccountId ? filtered.filter(acc => acc.id !== noAccountId) : filtered

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>

            <label className="input-label">
                {icon && getIcon(icon)} {label}
            </label>

            <div className="input-wrapper">

                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(String(e.target.value))}
                    required={required}
                    disabled={disabled}
                >
                    <option value="">
                        {placehoder}
                    </option>
                    {filtered.map((acc: Account) => (

                        <option
                            key={acc.id}
                            value={acc.id}
                        >
                            {acc.name} {!noRenderBalance && <> - {formatCurrency(acc.balance)}</>}
                        </option>

                    ))}
                </select>
            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    )

}