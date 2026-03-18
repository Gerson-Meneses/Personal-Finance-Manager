// Helper para formatear moneda (Podrías moverlo a un archivo de utilidades)
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
};