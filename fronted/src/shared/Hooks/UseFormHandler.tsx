import { useEffect, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError, DetailsError } from "../dataApiInterface";
import { handleFieldChange } from "../utils/handleFieldChange";


interface UseFormHandlerProps<T> {
  mutation: UseMutationResult<any, DataError<T>, T>;
  initialState: T;
  onSuccess?: () => void;
  validationFn?: (data: T, id?: string) => DetailsError<T> | null;
}

/**
 * Hook reutilizable para manejar formularios con validación
 * Centraliza la lógica de estado, errores y manejo de mutaciones
 */
export function useFormHandler<T extends Record<string, any>>({
  mutation,
  initialState,
  onSuccess,
  validationFn,
}: UseFormHandlerProps<T>) {
  const { mutate, isPending, error, reset, isSuccess } = mutation;

  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<DetailsError<T> | null>(null);

  // Limpiar errores y reset al montar
  useEffect(() => {
    setErrors(null);
    reset();
  }, [reset]);

  // Manejar errores del servidor
  useEffect(() => {
    if (error?.details) {
      setErrors(error.details as DetailsError<T>);
    }
  }, [error]);

  // Manejar éxito
  useEffect(() => {
    if (isSuccess) {
      setFormData(initialState);
      setErrors(null);
      reset();
      onSuccess?.();
    }
  }, [isSuccess, initialState, reset, onSuccess]);

  // Manejador de cambios - limpia errores del campo al escribir
  const onChange = <K extends keyof T>(field: K, value: T[K]) => {
    handleFieldChange(field, value, setFormData, setErrors);
  };

  // Obtener mensaje de error de un campo específico
  const getErrorMessage = (field: keyof T): string | null => {
    return errors?.[field] ? String(errors[field][0]) : null;
  };

  // Validar y enviar
  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    onSubmitCallback?: (data: T) => void,
    transactionId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors(null);

    // Validación local si existe función
    if (validationFn) {
      const validationErrors = validationFn(formData, transactionId);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }
    }

    // Callback personalizado antes de mutar (para agregar datos extra)
    if (onSubmitCallback) {
      onSubmitCallback(formData);
    } else {
      mutate(formData);
    }
  };

  // Resetear formulario manualmente
  const resetForm = () => {
    setFormData(initialState);
    setErrors(null);
    reset();
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    onChange,
    getErrorMessage,
    handleSubmit,
    resetForm,
    isPending,
    isSuccess,
    serverError: error && !error.details ? error.message : null,
  };
}