import { useMemo, useState } from "react";
import { CheckCircle2, PlusCircle } from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { DatePicker } from "../../../shared/components/DateInput/DateInput";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { Category } from "../../categories/types";
import type {
    BankStatementLine,
    CreateFromBankLineInput,
} from "../types";

interface Props {
    line: BankStatementLine;
    categories: Category[];
    isPending: boolean;
    error?: string | null;
    onSubmit: (data: CreateFromBankLineInput) => void;
    onClose: () => void;
}

export function CreateFromBankLineModal({
    line,
    categories,
    isPending,
    error,
    onSubmit,
    onClose,
}: Props) {
    const matchingCategories = useMemo(
        () => categories.filter((category) => category.type === line.type),
        [categories, line.type]
    );

    const defaultCategory = useMemo(() => {
        const preferred = matchingCategories.find((category) =>
            category.name.toUpperCase().includes("OTROS")
        );
        return preferred?.id ?? matchingCategories[0]?.id ?? "";
    }, [matchingCategories]);

    const [categoryId, setCategoryId] = useState(defaultCategory);
    const [name, setName] = useState(line.description);
    const [date, setDate] = useState(line.date);
    const [localError, setLocalError] = useState<string | null>(null);

    const categoryOptions = matchingCategories.map((category) => ({
        value: category.id,
        label: category.name,
        color: category.color,
    }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!categoryId) {
            setLocalError("Selecciona una categoría");
            return;
        }

        const trimmed = name.trim();
        if (trimmed.length > 0 && trimmed.length < 3) {
            setLocalError("El nombre debe tener al menos 3 caracteres");
            return;
        }

        setLocalError(null);
        onSubmit({
            categoryId,
            name: trimmed || undefined,
            date,
        });
    };

    return (
        <FormContainer
            title="Crear transacción"
            subtitle="Se registrará y quedará conciliada con el banco"
            icon={<PlusCircle size={20} />}
            error={localError ?? error}
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={handleSubmit}>
                <div className="bank-create-summary">
                    <div>
                        <span>{line.description}</span>
                        <small>
                            {line.account?.name ?? "Cuenta"} ·{" "}
                            {line.type === "INCOME" ? "Ingreso" : "Gasto"}
                        </small>
                    </div>
                    <strong
                        className={`amount-font ${line.type === "INCOME" ? "text-success" : "text-danger"}`}
                    >
                        {line.type === "INCOME" ? "+" : "−"}{" "}
                        {formatCurrency(line.amount)}
                    </strong>
                </div>

                <div className="form-default-grid-2col">
                    <TextInput
                        name="name"
                        label="Nombre"
                        icon="Tag"
                        value={name}
                        onChange={(value) => {
                            setName(value);
                            setLocalError(null);
                        }}
                        placeholder="Descripción de la transacción"
                        disabled={isPending}
                    />

                    <DatePicker
                        label="Fecha"
                        value={date}
                        onChange={setDate}
                        disableFuture={false}
                        disabled={isPending}
                    />
                </div>

                <SelectInput
                    label="Categoría"
                    icon="Tags"
                    value={categoryId}
                    onChange={(value) => {
                        setCategoryId(value);
                        setLocalError(null);
                    }}
                    options={categoryOptions}
                    placeholder="Selecciona una categoría"
                    required
                    disabled={isPending}
                />

                <div className="form-actions-container">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isPending || !categoryId}
                    >
                        <CheckCircle2 size={15} />
                        {isPending ? "Creando..." : "Crear y conciliar"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
