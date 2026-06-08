import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook Genérico para sincronizar cualquier esquema de filtros con la URL
 */
export const useFilterURL = <T extends Record<string, any>>(defaultFilters: T) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Convierte la URL en un objeto limpio respetando tipos básicos (números y booleanos)
  const getFiltersFromURL = useCallback((): Partial<T> => {
    const params = Object.fromEntries(searchParams);
    const parsed: any = {};

    Object.entries(params).forEach(([key, value]) => {
      // Intentar parsear números automáticos
      if (!isNaN(value as any) && value !== "") {
        parsed[key] = value.includes(".") ? parseFloat(value) : parseInt(value, 10);
      } 
      // Parsear booleanos
      else if (value === "true") parsed[key] = true;
      else if (value === "false") parsed[key] = false;
      // Queda como string
      else parsed[key] = value;
    });

    console.log(parsed)

    return parsed;
  }, [searchParams]);

  const saveFiltersToURL = useCallback((filters: Partial<T>) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== defaultFilters[key]
      ) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true }); // replace: true evita acumular historial basura al tipear
  }, [setSearchParams, defaultFilters]);

  const updateFilterInURL = useCallback((key: keyof T, value: any) => {
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
    filters: { ...defaultFilters, ...getFiltersFromURL() }, // Devuelve combinados los defaults y los de la URL
    saveFiltersToURL,
    updateFilterInURL,
    clearFiltersFromURL: useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams])
  };
};