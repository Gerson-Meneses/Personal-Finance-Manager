import { useId, useMemo, useState } from "react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { useAccounts } from "../../hooks";
import AccountForm from "../accountForm/accountForm";
import type { Account, AccountType } from "../../types";


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

    /** Nombre precargado al crear una cuenta */
    defaultName?: string;
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
    allowCreate = false,
    defaultStyle = true,
    error,
    required,
    disabled,
    id,
    name,
    className,
    defaultName,
}: SelectAccountProps) => {
    const { accounts, loading, saveAccount } =
        useAccounts();

    const [showForm, setShowForm] =
        useState(false);
    const [createName, setCreateName] =
        useState<string | undefined>(undefined);

    const generatedId = useId();
    const inputId =
        id ?? name ?? `select-account-${generatedId.replace(/:/g, "")}`;

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

    const options = useMemo(() => {
        const list: {
            value: string;
            label: string;
        }[] = [];

        if (allowCreate) {
            list.push({
                value: CREATE_OPTION,
                label: "+ Nueva cuenta",
            });
        }

        for (const acc of filteredAccounts) {
            list.push({
                value: acc.id,
                label:
                    acc.name +
                    (!noRenderBalance
                        ? `: ${formatCurrency(acc.balance)}`
                        : ""),
            });
        }

        return list;
    }, [
        allowCreate,
        filteredAccounts,
        noRenderBalance,
    ]);

    const handleSelectChange = (
        selected: string
    ) => {
        if (
            selected === CREATE_OPTION
        ) {
            setCreateName(defaultName);
            setShowForm(true);
            return;
        }

        onChange(selected);
    };

    const handleCreateQuery = (query: string) => {
        setCreateName(query || defaultName);
        setShowForm(true);
    };

    const handleSuccess = (
        newAccount?: Account
    ) => {
        if (newAccount) onChange(String(newAccount.id));
        setShowForm(false);
    };

    return (
        <>
            <SelectInput
                value={value}
                onChange={handleSelectChange}
                placeholder={
                    loading
                        ? "Cargando cuentas..."
                        : placeholder
                }
                label={label}
                icon={icon}
                error={error}
                required={required}
                disabled={disabled || loading}
                defaultStyle={defaultStyle}
                id={inputId}
                name={name}
                options={options}
                onCreateQuery={allowCreate ? handleCreateQuery : undefined}
                className={`select-account ${className ?? ""}`}
            />

            {showForm && (
                <ModalPortal
                    isOpen={showForm}
                    onClose={() =>
                        setShowForm(false)
                    }
                >
                    <AccountForm
                        mutation={saveAccount}
                        initialName={createName}
                        onSuccess={
                            handleSuccess
                        }
                        onClose={() =>
                            setShowForm(false)
                        }
                    />
                </ModalPortal>
            )}
        </>
    );
};