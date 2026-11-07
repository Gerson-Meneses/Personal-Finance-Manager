import { useEffect } from "react";
import { getIcon } from "../../utils/GetIcon";
import { generateYears, getDaysInMonth, months } from "../../utils/dateUtils";
import { SelectInput } from "../SelectInput/SelectInput";
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

            <div className="birthdate-selects">

                <SelectInput
                    label="Día"
                    hideLabel
                    placeholder="Día"
                    value={day}
                    onChange={(val) => update("day", val)}
                    options={days.map((d) => ({
                        value: String(d).padStart(2, "0"),
                        label: String(d),
                    }))}
                    disabled={disabled}
                    required={required}
                />

                <SelectInput
                    label="Mes"
                    hideLabel
                    placeholder="Mes"
                    value={month}
                    onChange={(val) => update("month", val)}
                    options={months.map((m) => ({
                        value: m.value,
                        label: m.label,
                    }))}
                    disabled={disabled}
                    required={required}
                />

                <SelectInput
                    label="Año"
                    hideLabel
                    placeholder="Año"
                    value={year}
                    onChange={(val) => update("year", val)}
                    options={years.map((y) => ({
                        value: String(y),
                        label: String(y),
                    }))}
                    disabled={disabled}
                    required={required}
                />

            </div>

            {error && <span className="error-text">{error}</span>}
        </div>
    );
};
