import { useMemo, useState } from "react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { getIcon } from "../../../../shared/utils/GetIcon";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { useAccounts } from "../../hooks";
import AccountForm from "../accountForm/accountForm";
import type { Account, AccountType } from "../../types";


import "./selectAccount.css";
import type { BaseInputProps } from "../../../../shared/components/types";

const CREATE_OPTION = "__CREATE_ACCOUNT__";

interface SelectAccountProps
    extends BaseInputProps<string> {
    type?: AccountType;

    noCredit?: boolean;

    balance?: boolean;

    noRenderBalance?: boolean;

    noAccountId?: string;

    placeholder?: string;

    icon?: string | null;

    allowCreate?: boolean;

    defaultStyle?: boolean
}

export const SelectAccount = ({
    value = "",
    onChange,
    type,
    noCredit = false,
    balance = false,
    noRenderBalance = false,
    noAccountId,
    placeholder = "Seleccionar cuenta",
    label = "Cuenta",
    icon = "Wallet",
    allowCreate = true,
    defaultStyle = true,
    error,
    required,
    disabled,
    id,
    name,
    className,
}: SelectAccountProps) => {
    const { accounts, loading, saveAccount } =
        useAccounts();

    const [showForm, setShowForm] =
        useState(false);

    const inputId =
        id ?? name ?? "select-account";

    const filteredAccounts = useMemo(() => {
        return accounts.filter((acc) => {
            if (
                type &&
                acc.type !== type
            ) {
                return false;
            }

            if (
                noCredit &&
                acc.type === "CREDIT"
            ) {
                return false;
            }

            if (
                balance &&
                acc.balance <= 0
            ) {
                return false;
            }

            if (
                noAccountId &&
                acc.id === noAccountId
            ) {
                return false;
            }

            return true;
        });
    }, [
        accounts,
        type,
        noCredit,
        balance,
        noAccountId,
    ]);

    const handleSelectChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const selected =
            e.target.value;

        if (
            selected === CREATE_OPTION
        ) {
            setShowForm(true);
            return;
        }

        onChange(selected);
    };

    const handleSuccess = (
        newAccount: Account
    ) => {
        onChange(String(newAccount.id));

        setShowForm(false);
    };

    return (
        <>
            <div
                className={`
          ${defaultStyle ? "custom-form-group" : ""}
          ${error ? "has-error" : ""}
          ${disabled ? "disabled" : ""}
          ${className ?? ""}
        `}
            >
                {label && (
                    <label
                        htmlFor={inputId}
                        className="input-label"
                    >
                        {icon && getIcon(icon)}
                        {label}
                    </label>
                )}

                <div className={`${defaultStyle ? "input-wrapper" : ""}`}>
                    {loading ? (
                        <select
                            disabled

                        >
                            <option>
                                Cargando cuentas...
                            </option>
                        </select>
                    ) : (
                        <select
                            id={inputId}
                            name={name}
                            value={value}
                            onChange={
                                handleSelectChange
                            }
                            required={required}
                            disabled={disabled}

                        >
                            <option value="">
                                {placeholder}
                            </option>

                            {allowCreate && (
                                <option
                                    value={
                                        CREATE_OPTION
                                    }
                                >
                                    + Nueva cuenta
                                </option>
                            )}

                            {filteredAccounts.map(
                                (acc) => (
                                    <option
                                        key={acc.id}
                                        value={acc.id}
                                    >
                                        {acc.name}

                                        {!noRenderBalance &&
                                            `: ${formatCurrency(
                                                acc.balance
                                            )}`}
                                    </option>
                                )
                            )}
                        </select>
                    )}
                </div>

                {error && (
                    <span className="error-text">
                        {error}
                    </span>
                )}
            </div>

            {showForm && (
                <ModalPortal
                    isOpen={showForm}
                    onClose={() =>
                        setShowForm(false)
                    }
                >
                    <AccountForm
                        mutation={saveAccount}
                        onSuccess={
                            handleSuccess
                        }
                    />
                </ModalPortal>
            )}
        </>
    );
};