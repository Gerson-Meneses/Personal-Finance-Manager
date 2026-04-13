import dayjs from "dayjs";
import { Calendar, Clock } from "lucide-react";
import './DateInput.css'

interface InputProps {
    value?: string;
    onChange: (val: string) => void;
    label?: string;
    error?: string | null;
    disableFuture?: boolean;
    required?: boolean
    disabled?: boolean
}

export const DatePicker = ({
    value = "",
    onChange,
    label = "Fecha",
    error,
    disableFuture = true,
    required,
    disabled
}: InputProps) => {
    const today = dayjs().format("YYYY-MM-DD");

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>
            <label className="input-label">
                <Calendar size={20} className="icon" /> {label}
            </label>
            <div className="input-wrapper">
                <input
                    type="date"
                    value={value} 
                    max={disableFuture ? today : undefined}
                    onChange={(e) => onChange(e.target.value)}
                    className="custom-date-input"
                    required={required}
                    disabled={disabled}
                />
            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};

interface TimePickerProps extends InputProps {
    selectedDate?: string; // Formato YYYY-MM-DD
}

export const TimePicker = ({
    value = "",
    onChange,
    label = "Hora",
    error,
    disableFuture = true,
    selectedDate,
    disabled,
    required
}: TimePickerProps) => {
    const now = dayjs();
    const currentTime = now.format("HH:mm");
    const isToday = selectedDate === now.format("YYYY-MM-DD");

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>
            <label className="input-label">
                <Clock size={20} className="icon" /> {label}
            </label>
            <div className="input-wrapper">
                <input
                    type="time"
                    value={value}
                    // Solo bloquea si disableFuture es true Y la fecha es hoy
                    max={disableFuture && isToday ? currentTime : undefined}
                    onChange={(e) => onChange(e.target.value)}
                    className="custom-date-input"
                    required={required}
                    disabled={disabled}
                />
            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};
