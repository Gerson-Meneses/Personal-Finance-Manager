import { getIcon } from "../../utils/GetIcon";
import "./SearchInput.css";

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Buscar..." }: Props) {
    return (
        <div className="si-wrapper">
            <span className="si-icon" aria-hidden="true">
                {getIcon("Search")}
            </span>

            <input
                className="si-input"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

            {value && (
                <button
                    className="si-clear"
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => onChange("")}
                >
                    {getIcon("X")}
                </button>
            )}
        </div>
    );
}