import { useMemo, useState } from "react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { useCategories } from "../hooks";
import { CategoryForm } from "./CategoryForm/CategoryForm";
import type { Category } from "../types";
import type { TransactionType } from "../../transactions/types";
import "./SelectCategory.css";
import type { BaseInputProps } from "../../../shared/components/types";
const CREATE_OPTION = "__CREATE_CATEGORY__";

interface SelectCategoryProps
    extends BaseInputProps<string> {
    type?: TransactionType;

    noLoan?: boolean;

    isBase?: boolean;

    visible?: boolean;

    all?: boolean;

    placeholder?: string;

    icon?: string | null;

    allowCreate?: boolean;
    defaultStyle?: boolean

    /** Nombre precargado al crear una categoría (ej. nombre de la transacción) */
    defaultName?: string;
}

export default function SelectCategory({
    value = "",
    onChange,
    type,
    noLoan = false,
    isBase,
    visible,
    all = false,
    placeholder = "Seleccionar categoría",
    label = "Categoría",
    icon = "LayoutGrid",
    allowCreate = true,
    defaultStyle = true,
    error,
    disabled,
    required,
    id,
    name,
    defaultName,

    className,
}: SelectCategoryProps) {
    const {
        categories,
        loading,
        createCategory,
    } = useCategories();

    const [showForm, setShowForm] =
        useState(false);
    const [createName, setCreateName] =
        useState<string | undefined>(undefined);

    const inputId =
        id ?? name ?? "select-category";

    const filteredCategories =
        useMemo(() => {
            if (all) {
                return categories;
            }

            return categories.filter((cat) => {
                if (
                    type &&
                    cat.type !== type
                ) {
                    return false;
                }

                if (
                    noLoan &&
                    (
                        cat.name ===
                        "PRESTAMOS" ||
                        cat.name ===
                        "PRÉSTAMOS" ||
                        cat.name ===
                        "DEVOLUCIÓN DE PRÉSTAMO"
                    )
                ) {
                    return false;
                }

                if (
                    isBase !==
                    undefined &&
                    cat.isBase !== isBase
                ) {
                    return false;
                }

                if (
                    visible !==
                    undefined &&
                    cat.visible !==
                    visible
                ) {
                    return false;
                }

                return true;
            });
        }, [
            categories,
            type,
            noLoan,
            isBase,
            visible,
            all,
        ]);

    const options = useMemo(() => {
        const list: {
            value: string;
            label: string;
            color?: string;
        }[] = [];

        if (allowCreate) {
            list.push({
                value: CREATE_OPTION,
                label: "+ Nueva categoría",
            });
        }

        for (const cat of filteredCategories) {
            list.push({
                value: cat.id,
                label: cat.name,
                color: cat.color,
            });
        }

        return list;
    }, [allowCreate, filteredCategories]);

    const handleSelectChange = (
        selected: string
    ) => {
        if (
            selected === CREATE_OPTION
        ) {
            createCategory.reset();
            setCreateName(defaultName);
            setShowForm(true);
            return;
        }

        onChange(selected);
    };

    const handleCreateQuery = (query: string) => {
        createCategory.reset();
        setCreateName(query || defaultName);
        setShowForm(true);
    };

    const handleSuccess = (
        newCategory?: Category
    ) => {
        if(!newCategory) return
        onChange(
            String(newCategory.id)
        );

        setShowForm(false);
    };

    return (
        <>
            <SelectInput
                value={value}
                onChange={handleSelectChange}
                placeholder={
                    loading
                        ? "Cargando categorías..."
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
                className={`select-category ${className ?? ""}`}
            />

            {showForm && (
                <ModalPortal
                    isOpen={showForm}
                    onClose={() =>
                        setShowForm(false)
                    }
                >
                    <CategoryForm
                        mutation={
                            createCategory
                        }
                        initialValues={{
                            name: createName ?? "",
                            type: type === "INCOME" ? "INCOME" : "EXPENSE",
                        }}
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
}
