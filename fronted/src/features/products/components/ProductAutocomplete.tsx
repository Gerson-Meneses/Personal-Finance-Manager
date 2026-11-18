import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useProducts } from "../hooks";
import type { ProductSummary } from "../types";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getIcon } from "../../../shared/utils/GetIcon";
import "./ProductAutocomplete.css";

interface Props {
    value: string;
    onChange: (name: string, product?: ProductSummary) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export function ProductAutocomplete({
    value,
    onChange,
    label = "Producto",
    placeholder = "Ej. Abrigo con capucha",
    error,
    disabled,
}: Props) {
    const [open, setOpen] = useState(false);
    const [debounced, setDebounced] = useState(value);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), 300);
        return () => clearTimeout(timer);
    }, [value]);

    const search = debounced.trim();
    const enabled = open && (search.length >= 2 || search.length === 0);

    const { products, isFetching } = useProducts(
        { search: search || undefined, limit: 6, order: "recent" },
        enabled
    );

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    const showPanel = open && (search.length >= 2 || products.length > 0);

    return (
        <div
            ref={rootRef}
            className={`custom-form-group product-autocomplete ${error ? "has-error" : ""} ${disabled ? "disabled" : ""}`}
        >
            <label className="input-label">
                {getIcon("Package")}
                {label}
            </label>

            <div className="input-wrapper product-autocomplete__wrapper">
                <Search size={14} className="product-autocomplete__search-icon" />
                <input
                    type="text"
                    className="input-text product-autocomplete__input"
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    aria-invalid={error ? true : undefined}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        onChange(event.target.value);
                        setOpen(true);
                    }}
                />
                {isFetching && (
                    <Loader2 size={14} className="product-autocomplete__spinner" />
                )}
            </div>

            {showPanel && (
                <div className="product-autocomplete__panel">
                    {isFetching && products.length === 0 && (
                        <span className="product-autocomplete__empty">Buscando productos…</span>
                    )}

                    {!isFetching && products.length === 0 && search.length >= 2 && (
                        <span className="product-autocomplete__empty">
                            No existe un producto con ese nombre. Se guardará como nuevo.
                        </span>
                    )}

                    {!isFetching && products.length === 0 && search.length === 0 && (
                        <span className="product-autocomplete__empty">
                            Aún no tienes productos registrados.
                        </span>
                    )}

                    {products.map((product) => (
                        <button
                            key={product.normalizedName}
                            type="button"
                            className="product-autocomplete__option"
                            title={product.name}
                            aria-label={product.name}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                onChange(product.name, product);
                                setOpen(false);
                            }}
                        >
                            <span className="product-autocomplete__option-name">
                                {product.name}
                            </span>
                            <span className="product-autocomplete__option-price">
                                <small>Último</small>
                                {formatCurrency(product.lastPrice)}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {error && <span className="error-text">{error}</span>}
        </div>
    );
}
