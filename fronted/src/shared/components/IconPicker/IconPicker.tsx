import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { getIcon } from "../../utils/GetIcon";
import './IconPicker.css';

// Lista de iconos comunes para no saturar si no hay búsqueda

interface IconPickerProps {
    value?: string;
    onChange: (val: string) => void;
    label?: string;
    error?: string | null
    icons?: string[];
    iconsOnly?: boolean; 
    icon?: string;
    disabled?: boolean;
}

export const IconPicker = ({
    value = "HelpCircle",
    onChange,
    label = "Icono",
    error,
    icons,
    disabled,
    icon = "Image",
    iconsOnly = false
}: IconPickerProps) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    let COMMON_ICONS = ["Wallet", "PiggyBank", "CreditCard", "ShoppingBag", "Utensils", "Car", "Home", "Zap"];
    COMMON_ICONS = icons ? icons : COMMON_ICONS;

    const inputWidth = value ? `${(String(value).length > 8) ? String(value).length + 4 : 12}ch` : '12ch';

    const filteredIcons = Object.keys(LucideIcons)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8);

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
            <label className="input-label"> {getIcon(icon)} {label}</label>
            <div className="icon-picker-container">
                <button
                    type="button"
                    className="icon-trigger"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    {getIcon(value, { defaultIcon: "HelpCircle" })}
                    <span>{value || "Seleccionar..."}</span>
                </button>

                {isOpen && (
                    <div className="icon-popover">
                        {!iconsOnly && (
                            <input
                                autoFocus
                                placeholder="Buscar icono..."
                                style={{ width: inputWidth }}
                                className="icon-search-input"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />)}
                        <div className="icon-grid">
                            {(search ? filteredIcons : COMMON_ICONS).map((iconName) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    className={`icon-grid-item ${value === iconName ? 'active' : ''}`}
                                    onClick={() => {
                                        onChange(iconName);
                                        setIsOpen(false);
                                    }}
                                >
                                    {getIcon(iconName, { defaultIcon: "HelpCircle" })}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};