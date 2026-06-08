import { useState, useCallback } from "react";

const removeDiacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Hook genérico para filtrado client-side.
 * Case-insensitive y sin sensibilidad a tildes.
 *
 * Devuelve `filtered` como función para que el consumidor la llame
 * con los datos frescos del backend.
 *
 * @example
 * const { search, setSearch, filtered } = useClientSearch(normalizeTransaction)
 * const results = filtered(transactions)
 */
export function useClientSearch<T>(normalizer: (item: T) => string) {
    const [search, setSearch] = useState("");

    const filtered = useCallback(
        (items: T[]): T[] => {
            const term = removeDiacritics(search.trim());
            if (!term) return items;
            return items.filter((item) =>
                removeDiacritics(normalizer(item)).includes(term)
            );
        },
        [search, normalizer]
    );

    return { search, setSearch, filtered };
}