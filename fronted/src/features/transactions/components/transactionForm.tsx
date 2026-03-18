import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../shared/api";

export default function TransactionForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Mutación para guardar la transacción
  const mutation = useMutation({
    mutationFn: (newTx: any) => apiFetch("/transactions", { method: "POST", body: newTx }),
    onSuccess: () => {
      // ESTO ES CLAVE: Invalida el dashboard para que los saldos se refresquen solos
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate({ ...data, type });
  };

  return (
    <div className="transaction-modal">
      <form onSubmit={handleSubmit} className="card transaction-form">
        <div className="type-toggle">
          <button 
            type="button" 
            className={type === "EXPENSE" ? "active expense" : ""} 
            onClick={() => setType("EXPENSE")}
          >
            Gasto
          </button>
          <button 
            type="button" 
            className={type === "INCOME" ? "active income" : ""} 
            onClick={() => setType("INCOME")}
          >
            Ingreso
          </button>
        </div>

        <div className="form-group">
          <label>Monto</label>
          <input name="amount" type="number" step="0.01" placeholder="0.00" required autoFocus />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <input name="name" type="text" placeholder="¿En qué gastaste?" required />
        </div>

        <div className="form-group">
          <label>Cuenta</label>
          <select name="accountId" required>
            <option value="">Selecciona una cuenta</option>
            {/* Aquí mapearías tus cuentas */}
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Guardando..." : "Guardar Transacción"}
          </button>
        </div>
      </form>
    </div>
  );
}