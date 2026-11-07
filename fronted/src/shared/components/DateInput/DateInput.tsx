import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

import type { BaseInputProps } from "../types";

import "./DateInput.css";
import { getIcon } from "../../utils/GetIcon";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dec",
];

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function usePopoverDismiss(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  setOpen: (value: boolean) => void
) {
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [containerRef, open, setOpen]);
}

function usePopoverPlacement(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>
) {
  useLayoutEffect(() => {
    if (!open) return;
    const field = containerRef.current;
    const pop = popoverRef.current;
    if (!field || !pop) return;

    const update = () => {
      const rect = field.getBoundingClientRect();
      const popW = pop.offsetWidth;
      const popH = Math.max(pop.offsetHeight, pop.scrollHeight);
      const gap = 6;
      const margin = 8;

      const clip = {
        left: margin,
        top: margin,
        right: window.innerWidth - margin,
        bottom: window.innerHeight - margin,
      };

      let ancestor: HTMLElement | null = field;
      while (ancestor && ancestor !== document.body) {
        const style = window.getComputedStyle(ancestor);
        if (
          style.overflow !== "visible" ||
          style.overflowX !== "visible" ||
          style.overflowY !== "visible"
        ) {
          const bounds = ancestor.getBoundingClientRect();
          clip.left = Math.max(clip.left, bounds.left);
          clip.top = Math.max(clip.top, bounds.top);
          clip.right = Math.min(clip.right, bounds.right);
          clip.bottom = Math.min(clip.bottom, bounds.bottom);
        }
        ancestor = ancestor.parentElement;
      }

      const belowSpace = clip.bottom - rect.bottom - gap;
      const aboveSpace = rect.top - clip.top - gap;

      let effH = popH;
      let y: number;
      if (belowSpace >= popH) {
        y = rect.bottom + gap;
      } else if (aboveSpace >= popH) {
        y = rect.top - gap - popH;
      } else if (belowSpace >= aboveSpace) {
        effH = Math.max(Math.min(popH, belowSpace), 140);
        y = rect.bottom + gap;
      } else {
        effH = Math.max(Math.min(popH, aboveSpace), 140);
        y = rect.top - gap - effH;
      }

      const top = y - rect.top;

      const minLeft = clip.left - rect.left;
      const maxLeft = clip.right - rect.left - popW;
      let left: number;
      if (maxLeft < minLeft) {
        left = minLeft;
      } else {
        left = Math.min(Math.max(0, minLeft), maxLeft);
      }

      pop.style.top = `${top}px`;
      pop.style.left = `${left}px`;
      if (effH < popH) {
        pop.style.maxHeight = `${effH}px`;
      } else {
        pop.style.removeProperty("max-height");
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(pop);

    const handler = () => update();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, containerRef, popoverRef]);
}

/* ------------------------------------------------------------------ */
/*  DatePicker — calendario propio (sin input nativo)                   */
/* ------------------------------------------------------------------ */
interface DatePickerProps extends BaseInputProps<string> {
  disableFuture?: boolean;
  icon?: string;
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const inputId = id ?? name ?? autoId;

  const today = dayjs();
  const currentValue = value ?? "";
  const selected = currentValue && dayjs(currentValue).isValid()
    ? dayjs(currentValue)
    : null;

  const [view, setView] = useState<Dayjs>(() => today.startOf("month"));

  usePopoverDismiss(containerRef, open, setOpen);
  usePopoverPlacement(open, containerRef, popoverRef);

  const toggle = () => {
    if (!open) setView((selected ?? today).startOf("month"));
    setOpen(!open);
  };

  const firstOfMonth = view.startOf("month");
  const offset = (firstOfMonth.day() + 6) % 7;
  const daysCount = view.daysInMonth();

  const cells: Array<Dayjs | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysCount; day++) {
    cells.push(view.date(day));
  }

  const canGoNext = !disableFuture || view.isBefore(today, "month");

  const pick = (day: Dayjs) => {
    onChange(day.format("YYYY-MM-DD"));
    setOpen(false);
  };

  const display = selected
    ? `${selected.date()} ${MONTHS_SHORT[selected.month()]} ${selected.year()}`
    : "";

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

      <div className="input-wrapper" ref={containerRef}>
        <button
          type="button"
          id={inputId}
          name={name}
          className="dx-trigger"
          onClick={toggle}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-required={required || undefined}
        >
          <span className={display ? "dx-value" : "dx-placeholder"}>
            {display || "Seleccionar fecha"}
          </span>
          <span className="dx-trigger-icon" aria-hidden="true">
            <CalendarDays size={16} />
          </span>
        </button>

        {open && (
          <div
            ref={popoverRef}
            className="dx-popover"
            role="dialog"
            aria-label="Calendario"
            
          >
            <div className="dx-head">
              <button
                type="button"
                className="dx-nav"
                onClick={() => setView(view.subtract(1, "month"))}
                aria-label="Mes anterior"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="dx-head-title">
                {MONTHS[view.month()]} {view.year()}
              </span>
              <button
                type="button"
                className="dx-nav"
                onClick={() => setView(view.add(1, "month"))}
                disabled={!canGoNext}
                aria-label="Mes siguiente"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="dx-week" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="dx-grid">
              {cells.map((day, index) =>
                day ? (
                  <button
                    type="button"
                    key={day.format("YYYY-MM-DD")}
                    className={[
                      "dx-day",
                      selected && day.isSame(selected, "day") ? "is-selected" : "",
                      day.isSame(today, "day") ? "is-today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={disableFuture && day.isAfter(today, "day")}
                    onClick={() => pick(day)}
                  >
                    {day.date()}
                  </button>
                ) : (
                  <span key={`gap-${index}`} className="dx-day-gap" />
                )
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};


/* ------------------------------------------------------------------ */
/*  TimePicker — listas propias (sin input nativo)                     */
/* ------------------------------------------------------------------ */
interface TimePickerProps extends BaseInputProps<string> {
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const inputId = id ?? name ?? autoId;

  const now = dayjs();
  const currentValue = value ?? "";
  const isToday = selectedDate === now.format("YYYY-MM-DD");
  const maxTime = disableFuture && isToday ? now.format("HH:mm") : null;

  usePopoverDismiss(containerRef, open, setOpen);
  usePopoverPlacement(open, containerRef, popoverRef);

  const [hourPart, minutePart] = currentValue.split(":");
  const hasHour = /^\d{2}$/.test(hourPart ?? "");

  useEffect(() => {
    if (!open) return;
    const list = hourListRef.current;
    const selectedEl = list?.querySelector<HTMLElement>(".is-selected");
    if (list && selectedEl) {
      list.scrollTop =
        selectedEl.offsetTop - list.clientHeight / 2 + selectedEl.clientHeight / 2;
    }
  }, [open]);

  const pickHour = (hour: string) => {
    onChange(`${hour}:${/^\d{2}$/.test(minutePart ?? "") ? minutePart : "00"}`);
  };

  const pickMinute = (minute: string) => {
    onChange(`${hasHour ? hourPart : "00"}:${minute}`);
    setOpen(false);
  };

  const pickNow = () => {
    onChange(now.format("HH:mm"));
    setOpen(false);
  };

  const display = currentValue || "";

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
          {getIcon("clock")}
          {label}
        </label>
      )}

      <div className="input-wrapper" ref={containerRef}>
        <button
          type="button"
          id={inputId}
          name={name}
          className="dx-trigger"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-required={required || undefined}
        >
          <span className={display ? "dx-value dx-mono" : "dx-placeholder"}>
            {display || "Seleccionar hora"}
          </span>
          <span className="dx-trigger-icon" aria-hidden="true">
            <Clock size={16} />
          </span>
        </button>

        {open && (
          <div
            ref={popoverRef}
            className="dx-popover dx-time-popover"
            role="dialog"
            aria-label="Selector de hora"
            
          >
            <div className="dx-time-cols">
              <div className="dx-list" ref={hourListRef} role="listbox" aria-label="Horas">
                {HOURS.map((hour) => {
                  const optionDisabled = !!maxTime && `${hour}:00` > maxTime;
                  return (
                    <button
                      type="button"
                      key={hour}
                      role="option"
                      aria-selected={hasHour && hourPart === hour}
                      className={`dx-opt dx-mono ${hasHour && hourPart === hour ? "is-selected" : ""}`}
                      disabled={optionDisabled}
                      onClick={() => pickHour(hour)}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>

              <div className="dx-list" role="listbox" aria-label="Minutos">
                {MINUTES.map((minute) => {
                  const optionDisabled =
                    !!maxTime && hasHour && `${hourPart}:${minute}` > maxTime;
                  return (
                    <button
                      type="button"
                      key={minute}
                      role="option"
                      aria-selected={/^\d{2}$/.test(minutePart ?? "") && minutePart === minute}
                      className={`dx-opt dx-mono ${
                        /^\d{2}$/.test(minutePart ?? "") && minutePart === minute
                          ? "is-selected"
                          : ""
                      }`}
                      disabled={optionDisabled}
                      onClick={() => pickMinute(minute)}
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="button" className="dx-now" onClick={pickNow}>
              <Clock size={13} />
              Ahora
            </button>
          </div>
        )}
      </div>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};
