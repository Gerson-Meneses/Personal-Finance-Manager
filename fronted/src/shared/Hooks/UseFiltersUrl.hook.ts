import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook genérico para sincronizar cualquier esquema de filtros con la URL.
 */
export const useFilterURL = <T extends object>(defaultFilters: T) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getFiltersFromURL = useCallback((): Partial<T> => {
    const params = Object.fromEntries(searchParams);
    const parsed: Partial<T> = {};
    const target = parsed as Record<string, unknown>;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && !Number.isNaN(Number(value))) {
        target[key] = value.includes(".") ? parseFloat(value) : parseInt(value, 10);
      } else if (value === "true") {
        target[key] = true;
      } else if (value === "false") {
        target[key] = false;
      } else {
        target[key] = value;
      }
    });

    return parsed;
  }, [searchParams]);

  const saveFiltersToURL = useCallback((filters: Partial<T>) => {
    const params = new URLSearchParams();
    const defaults = defaultFilters as Record<string, unknown>;

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== defaults[key]
      ) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true });
  }, [setSearchParams, defaultFilters]);

  const updateFilterInURL = useCallback((key: keyof T, value: unknown) => {
    const current = getFiltersFromURL();
    const updated = { ...current, [key]: value };

    if (value === undefined || value === null || value === "") {
      delete updated[key];
      saveFiltersToURL(updated);
    } else {
      saveFiltersToURL(updated);
    }
  }, [getFiltersFromURL, saveFiltersToURL]);

  return {
    filters: { ...defaultFilters, ...getFiltersFromURL() },
    saveFiltersToURL,
    updateFilterInURL,
    clearFiltersFromURL: useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams])
  };
};
