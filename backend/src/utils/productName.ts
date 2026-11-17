/** Clave estable para agrupar el mismo producto entre compras. */
export const normalizeProductName = (name: string) =>
    name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
