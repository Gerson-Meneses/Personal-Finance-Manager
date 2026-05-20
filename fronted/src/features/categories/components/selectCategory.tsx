import { useMemo, useState } from "react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { getIcon } from "../../../shared/utils/GetIcon";
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

    className,
}: SelectCategoryProps) {
    const {
        categories,
        loading,
        createCategory,
    } = useCategories();

    const [showForm, setShowForm] =
        useState(false);

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
                    cat.isVisible !==
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
        newCategory: Category
    ) => {
        onChange(
            String(newCategory.id)
        );

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
                                Cargando categorías...
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
                            disabled={disabled}
                            required={required}
                           
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
                                    + Nueva categoría
                                </option>
                            )}

                            {filteredCategories.map(
                                (cat) => (
                                    <option
                                        key={cat.id}
                                        value={cat.id}
                                        style={{
                                            backgroundColor:
                                                `${cat.color}22`,
                                            color:
                                                cat.color,
                                            fontWeight:
                                                500,
                                        }}
                                    >
                                        {cat.name}
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
                    <CategoryForm
                        mutation={
                            createCategory
                        }
                        onSuccess={
                            handleSuccess
                        }
                    />
                </ModalPortal>
            )}
        </>
    );
}