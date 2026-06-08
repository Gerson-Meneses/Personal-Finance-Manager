import { z } from 'zod';
import { TypeLoan, StatusLoan } from '../utils/Enums';

export const loanQuerySchema = z.object({
    // Filtros por tipo y estado
    type: z.enum(TypeLoan).nullish(),
    status: z.enum(StatusLoan).nullish(),

    // Búsqueda por acreedor
    lender: z.string().trim().min(1).max(100).nullish(),

    // Búsqueda general (acreedor o ID)
    search: z.string().trim().min(1).max(100).nullish(),

    // Filtros de fecha de inicio del préstamo
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Formato de fecha inválido").nullish(),
    from: z.string().refine((val) => !isNaN(Date.parse(val)), "Formato de fecha inválido").nullish(),
    to: z.string().refine((val) => !isNaN(Date.parse(val)), "Formato de fecha inválido").nullish(),

    // Filtros de rango de monto principal
    minAmount: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().positive("Monto mínimo debe ser positivo").transform(n => Math.round(n * 100)).nullish()
    ),
    maxAmount: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().positive("Monto máximo debe ser positivo").transform(n => Math.round(n * 100)).nullish()
    ),

    // Filtros de pagos
    hasPayments: z.enum(['true', 'false']).transform(val => val === 'true').nullish(),
    minPaymentAmount: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().nonnegative("Monto mínimo de pago debe ser no negativo").transform(n => Math.round(n * 100)).nullish()
    ),
    maxPaymentAmount: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().positive("Monto máximo de pago debe ser positivo").transform(n => Math.round(n * 100)).nullish()
    ),

    // Filtros de fecha de pagos
    paymentDateFrom: z.string().refine((val) => !isNaN(Date.parse(val)), "Formato de fecha inválido").nullish(),
    paymentDateTo: z.string().refine((val) => !isNaN(Date.parse(val)), "Formato de fecha inválido").nullish(),

    // Ordenamiento y paginación
    orderBy: z.enum(['startDate', 'createdAt', 'principalAmount']).default('startDate'),
    order: z.enum(['ASC', 'DESC']).default('DESC'),
    page: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().int().positive("Página debe ser mayor a 0").nullish()
    ),
    limit: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().int().min(1, "Límite debe ser al menos 1").max(9999, "Límite no puede exceder 9999").nullish()
    ),
}).strict(); // Rechaza propiedades no definidas

export type LoanQuerySchema = z.infer<typeof loanQuerySchema>;