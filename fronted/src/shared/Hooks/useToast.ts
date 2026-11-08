import { useContext } from "react";
import { ToastContext, type ToastApi } from "../components/Toast/toastContext";

/** Avisos breves (éxito / error / info). Requiere <ToastProvider> montado arriba en el árbol. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
