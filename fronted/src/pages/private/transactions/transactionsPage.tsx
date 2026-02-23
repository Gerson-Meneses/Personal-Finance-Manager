import { useState } from "react";
import {
    useTransactions,
    useCreateTransaction,
} from "../../../features/transactions/hooks";
import { useAccounts } from "../../../features/accounts/hooks";
import { useCategories } from "../../../features/categories/hooks";
import type { Category } from "../../../features/categories/types";
import type { Account } from "../../../features/accounts/types";
import "./trasactionPage.css"

export function TransactionsPage() {
    const { data: dataTransactions, isLoading, error } = useTransactions();
    const { data: dataAccounts } = useAccounts();
    const { data: dataCategories } = useCategories();

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

        console.log({
            name,
            type,
            amount,
            date,
            accountId,
            categoryId,
        })

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
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
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
                    {dataAccounts?.accounts.map((acc: Account) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name}
                        </option>
                    ))}
                </select>

                {/* Categoría */}
                <select
                    className="cursorPointer"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                >
                    <option value="">Selecciona categoría</option>
                    {dataCategories?.categories.map((cat: Category) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <button type="submit" className="cursorPointer" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Guardando..." : "Agregar"}
                </button>
            </form>

            <ul> 
                <h2>Historial</h2>
                {dataTransactions?.transactions.data?.map((t: any) => (
                    <li key={t.id}>
                        {t.name} - S/ {t.amount} ({t.type})
                    </li>
                ))}
            </ul>
        </div>
    );
}
