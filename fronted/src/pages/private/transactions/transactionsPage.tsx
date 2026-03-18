import { useState } from "react";
import {
    useTransactions,
    useCreateTransaction,
} from "../../../features/transactions/hooks";
import { useAccounts } from "../../../features/accounts/hooks";
import type { Account, CreateAccountDTO } from "../../../features/accounts/types";
import "./trasactionPage.css"
import SelectCategory from "../../../features/categories/components/selectCategory";
import AccountForm from "../../../features/accounts/components/accountForm/accountForm";

export function TransactionsPage() {
    const { data: dataTransactions, isLoading, error } = useTransactions();
    const { accounts, createAccount } = useAccounts();
    const createMutation = useCreateTransaction();

    const [name, setName] = useState("");
    const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [amount, setAmount] = useState<number>(0);
    const [date, setDate] = useState("");
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");

    if (isLoading) return <p>Loading...</p>;
    if (error instanceof Error) return <p>{error.message}</p>;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();


        createMutation.mutate({
            name,
            type,
            amount,
            date,
            accountId,
            categoryId,
        });

        setName("");
        setAmount(0);
        setDate("");
        setAccountId("");
        setCategoryId("");
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Transactions</h1>

            <form onSubmit={handleSubmit}>
                <h2>Crear Transacción:</h2>
                {/* Nombre */}
                <input
                    placeholder="Nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {/* Tipo */}
                <select
                    className="cursorPointer"
                    value={type}
                    onChange={(e) =>
                        setType(e.target.value as "INCOME" | "EXPENSE")
                    }
                >
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                </select>

                {/* Monto */}
                <input
                    type="number"
                    placeholder="Monto"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                />

                {/* Fecha */}
                <input
                    className="cursorPointer"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />

                {/* Cuenta */}
                <select
                    className="cursorPointer"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                >
                    <option value="">Selecciona cuenta</option>
                    {accounts?.data.map((acc: Account) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name} - {acc.balance} - {acc.type}
                        </option>
                    ))}
                </select>

                {/* Categoría */}
                <SelectCategory
                    value={categoryId}
                    onChange={setCategoryId}
                    type={type}
                    noLoan={true}
                    visible={true}
                />

                <button type="submit" className="cursorPointer" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Guardando..." : "Agregar"}
                </button>
            </form>

            <AccountForm onSubmit={(data) => createAccount(data as CreateAccountDTO)}  ></AccountForm>

            <ul>
                <h2>Historial</h2>
               {dataTransactions?.data.map((tx) => (
                    <li key={tx.id}>
                        {tx.name} - {tx.amount} - {tx.type} - {tx.date}
                    </li>
                )) ?? <p>No transactions found.</p>}
            </ul>
        </div>
    );
}
