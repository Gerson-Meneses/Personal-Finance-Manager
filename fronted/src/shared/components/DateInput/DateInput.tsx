import dayjs from "dayjs";
import { Clock } from "lucide-react";

import type { BaseInputProps } from "../types";

import "./DateInput.css";
import { getIcon } from "../../utils/GetIcon";

interface DatePickerProps
  extends BaseInputProps<string> {
  disableFuture?: boolean;
  icon?: string
}

export const DatePicker = ({
  value = "",
  onChange,

  label = "Fecha",
  icon = "calendar",

  error,

  disableFuture = true,

  required,
  disabled,

  name,
  id,

  className,
}: DatePickerProps) => {
  const today = dayjs().format("YYYY-MM-DD");

  const inputId = id ?? name ?? "date-input";

  return (
    <div
      className={`
        custom-form-group
        ${error ? "has-error" : ""}
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

      <div className="input-wrapper">
        <input
          id={inputId}
          name={name}
          type="date"
          value={value ?? ""}
          max={disableFuture ? today : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="custom-date-input"
          required={required}
          disabled={disabled}
        />
      </div>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};


interface TimePickerProps
  extends BaseInputProps<string> {
  selectedDate?: string;
  disableFuture?: boolean;
}

export const TimePicker = ({
  value = "",
  onChange,

  label = "Hora",

  error,

  disableFuture = true,

  selectedDate,

  required,
  disabled,

  name,
  id,

  className,
}: TimePickerProps) => {
  const now = dayjs();

  const currentTime = now.format("HH:mm");

  const isToday =
    selectedDate === now.format("YYYY-MM-DD");

  const inputId = id ?? name ?? "time-input";

  return (
    <div
      className={`
        custom-form-group
        ${error ? "has-error" : ""}
        ${className ?? ""}
      `}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="input-label"
        >
          <Clock size={20} className="icon" />
          {label}
        </label>
      )}

      <div className="input-wrapper">
        <input
          id={inputId}
          name={name}
          type="time"
          value={value ?? ""}
          max={
            disableFuture && isToday
              ? currentTime
              : undefined
          }
          onChange={(e) => onChange(e.target.value)}
          className="custom-date-input"
          required={required}
          disabled={disabled}
        />
      </div>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};