import { useState } from "react";

import dayjs from "dayjs";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { TextInput } from "../../../shared/components/TextInput/TextInput";

interface QuickPayModalProps {
  lender: string;
  type: "GIVEN" | "RECEIVED";
  onClose: () => void;
  onSubmit: (data: QuickPayDTO) => void;
}

export interface QuickPayDTO {
  lender: string;
  type: "GIVEN" | "RECEIVED";
  amount: number;
  date: string;
  time: string;
  accountId: string;
  description?: string;
}

export function QuickPayModal({ lender, type, onClose, onSubmit }: QuickPayModalProps) {
  const [formData, setFormData] = useState<QuickPayDTO>({
    lender,
    type,
    amount: 0,
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    accountId: "",
    description: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = <K extends keyof QuickPayDTO>(
    field: K,
    value: QuickPayDTO[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) newErrors.amount = "El monto debe ser mayor a 0";
    if (!formData.accountId) newErrors.accountId = "La cuenta es requerida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const isGiven = type === "GIVEN";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pago rápido</h2>
            <p className="text-sm text-gray-600 mt-1">{lender}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Box */}
          <div className={`rounded-lg p-4 ${
            isGiven ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            <p className={`text-sm font-medium ${
              isGiven ? "text-green-900" : "text-red-900"
            }`}>
              Este pago se distribuirá entre todos los préstamos pendientes con {lender}
            </p>
          </div>

          {/* Amount */}
          <div>
            <NumericInput
              label="Monto a pagar"
              icon="CircleDollarSign"
              symbol="S/"
              value={formData.amount}
              onChange={(val) => handleChange("amount", val)}
              error={errors.amount}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              value={formData.date}
              onChange={(val) => handleChange("date", val)}
              error={errors.date}
            />
            <TimePicker
              value={formData.time}
              onChange={(val) => handleChange("time", val)}
              selectedDate={formData.date}
              error={errors.time}
            />
          </div>

          {/* Account */}
          <div>
            <SelectAccount
              value={formData.accountId}
              onChange={(val) => handleChange("accountId", val)}
              error={errors.accountId}
            />
          </div>

          {/* Description */}
          <div>
            <TextInput
              label="Descripción"
              icon="AlignLeft"
              value={formData.description}
              onChange={(val) => handleChange("description", val)}
              placeholder="Notas sobre el pago..."
              textarea
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Pagar a {lender}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}