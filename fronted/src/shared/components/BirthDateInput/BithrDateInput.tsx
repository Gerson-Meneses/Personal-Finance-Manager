import { useEffect } from "react";
import { getIcon } from "../../utils/GetIcon";
import { generateYears, getDaysInMonth, months } from "../../utils/dateUtils";
import './BirthDateInput.css'

interface BirthDateValue {
    day: string;
    month: string;
    year: string;
}

interface BirthDateInputProps {
    value: BirthDateValue
    onChange: (val: BirthDateValue) => void;
    error?: string | null
    disabled?: boolean
    required?: boolean
}

export const BirthDateInput = ({
    value,
    onChange,
    error,
    disabled,
    required
}: BirthDateInputProps) => {
    const { day, month, year } = value;
    const days = Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1);
    const years = generateYears();

    // Si el día seleccionado supera el máximo del mes/año, lo resetea
    useEffect(() => {
        const maxDays = getDaysInMonth(month, year);
        if (Number(day) > maxDays) {
            onChange({ ...value, day: "" });
        }
    }, [month, year]);

    const update = (field: keyof BirthDateValue, val: string) => {
        onChange({ ...value, [field]: val });
    };

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>

            <label className="input-label">
                {getIcon("Cake")} Fecha de Nacimiento
            </label>

            <div className={`birthdate-selects ${disabled ? 'disabled' : ''}`}>

                <div className={`birthdate-select-wrapper ${!day ? 'placeholder' : ''}`}>
                    <select
                        value={day}
                        onChange={(e) => update("day", e.target.value)}
                        disabled={disabled}
                        required={required}
                    >
                        <option value="">Día</option>
                        {days.map(d => (
                            <option key={d} value={String(d).padStart(2, "0")}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className={`birthdate-select-wrapper ${!month ? 'placeholder' : ''}`}>
                    <select
                        value={month}
                        onChange={(e) => update("month", e.target.value)}
                        disabled={disabled}
                        required={required}
                    >
                        <option value="">Mes</option>
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                <div className={`birthdate-select-wrapper ${!year ? 'placeholder' : ''}`}>
                    <select
                        value={year}
                        onChange={(e) => update("year", e.target.value)}
                        disabled={disabled}
                        required={required}
                    >
                        <option value="">Año</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

            </div>

            {error && <span className="error-text">{error}</span>}
        </div>
    );
};