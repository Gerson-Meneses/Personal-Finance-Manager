import type { DetailsError } from "../../../../shared/dataApiInterface";
import type { CreateTransactionDTO, UpdateTransactionDTO } from "../../types";

export const validateInputsTransactionForm = (formData: CreateTransactionDTO, transactionId?: string): DetailsError<UpdateTransactionDTO> | null => {
    const errors: DetailsError<UpdateTransactionDTO> = {
    };

    if (!formData.name || formData.name.trim() === "") {
        errors.name = ["El nombre es requerido"];
    }
    if (formData.name && formData.name.length < 3) {
        errors.name = ["El nombre tiene que tener al menos 3 caracteres"];
    }
    if (!formData.type) {
        errors.type = ["El tipo es requerido"];
    }
    if (formData.amount === undefined || formData.amount === null) {
        errors.amount = ["El monto es requerido"];
    }
    if (formData.amount !== undefined && formData.amount <= 0) {
        errors.amount = ["El monto debe ser un número positivo"];
    }
    if (!formData.accountId) {
        errors.accountId = ["La cuenta es requerida"];
    }
    if (!formData.categoryId) {
        errors.categoryId = ["La categoría es requerida"];
    }
    if (!formData.date) {
        errors.date = ["La fecha es requerida"];
    }
    if (formData.date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
        errors.date = ["La fecha debe tener el formato YYYY-MM-DD"];
    }
    if (formData.time && !/^\d{2}:\d{2}$/.test(formData.time)) {
        errors.time = ["La hora debe tener el formato HH:mm"];
    }

    if (transactionId && !transactionId) {
        errors.transactionId = ["La transacción es requerida para actualizar"];
    }

    if (Object.keys(errors).length > 0) {
        return errors;
    }

    return null;
};