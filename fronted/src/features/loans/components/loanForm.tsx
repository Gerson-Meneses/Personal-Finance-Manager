import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Loan, LoanType } from "../types";
import { useAccounts } from "../../accounts/hooks"
import type { Account } from "../../accounts/types";

interface Props {
  lenders?: Array<string>;
  onSubmit: (data: {
    lender: string;
    principalAmount: number;
    type: LoanType;
    startDate: string;
    accountId: string;
  }) => Promise<Loan>;
}

// Obtenemos la fecha de hoy en formato YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split("T")[0];

const initialState = {
  lender: "",
  principalAmount: "" as unknown as number,
  type: "GIVEN" as LoanType,
  startDate: getTodayDate(),
  accountId: "",
};

export default function LoanForm({ lenders = [], onSubmit }: Props) {
  const [formData, setFormData] = useState(initialState);
  const [isCustomLender, setIsCustomLender] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { accounts, loading } = useAccounts();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setError(null); // Limpiar error al escribir
    setFormData((prev) => ({
      ...prev,
      [id]: id === "principalAmount" ? Number(value) : value,
    }));
  };

  const handleLenderSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setError(null);
    if (value === "otro") {
      setIsCustomLender(true);
      setFormData((prev) => ({ ...prev, lender: "" }));
    } else {
      setIsCustomLender(false);
      setFormData((prev) => ({ ...prev, lender: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // VALIDACIÓN DE FECHA: No permitir fechas futuras
    const today = getTodayDate();
    if (formData.startDate > today) {
      setError("La fecha no puede ser mayor a hoy");
      return;
    }

    if (!formData.lender || !formData.principalAmount || !formData.accountId) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setFormData(initialState);
      setIsCustomLender(false);
      setError(null);
    } catch (err) {
      setError("Ocurrió un error al guardar el préstamo");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <span>Cargando cuentas...</span>;

  return (
    <form onSubmit={handleSubmit} className="loan-form">
      {/* Mensaje de error centralizado */}
      {error && (
        <div style={{ color: 'white', background: '#ff4d4d', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="type">Tipo de préstamo</label>
        <select id="type" value={formData.type} onChange={handleChange}>
          <option value="GIVEN">Presté dinero</option>
          <option value="RECEIVED">Me prestaron</option>
        </select>
      </div>

      <div>
        <label htmlFor="lender">Persona / Prestamista</label>
        {lenders.length > 0 && !isCustomLender ? (
          <select id="lender-select" value={formData.lender} onChange={handleLenderSelect} required>
            <option value="">Selecciona una persona</option>
            {lenders.map((len) => (
              <option key={len} value={len}>{len}</option>
            ))}
            <option value="otro">-- Otro (Escribir nombre) --</option>
          </select>
        ) : (
          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              id="lender"
              placeholder="Nombre de la persona"
              value={formData.lender}
              onChange={handleChange}
              required
              autoFocus={isCustomLender}
            />
            {lenders.length > 0 && (
              <button type="button" onClick={() => {setIsCustomLender(false); setError(null);}}>
                Lista
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="principalAmount">Monto</label>
        <input
          type="number"
          id="principalAmount"
          placeholder="0.00"
          min="0.01"
          step="any"
          value={formData.principalAmount || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="startDate">Fecha</label>
        <input
          type="date"
          id="startDate"
          // Restricción visual en el calendario del navegador
          max={getTodayDate()} 
          value={formData.startDate}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="accountId">Cuenta</label>
        <select id="accountId" value={formData.accountId} onChange={handleChange} required>
          <option value="">Selecciona una cuenta</option>
          {accounts?.data.map((acc: Account) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} (${acc.balance})
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Crear préstamo"}
      </button>
    </form>
  );
}