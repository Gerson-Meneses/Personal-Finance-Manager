import { Context } from "hono";
import { LoanSchema } from "../schemas/loan.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { LoansService, LoanSummary, LoanWithProgress } from "../services/loansService";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { paginated } from "../helpers/responses";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";
import { QuickPaymentSchema } from "../schemas/quickPayment.schema";
import { TypeLoan } from "../utils/Enums";

const loanService = new LoansService()

/**
 * Obtener todos los préstamos (Paginado)
 */
export const getAllLoans = async (c: Context, userId: UuidSchema, filters: PaginationQuerySchema) => {
    const result = await loanService.getLoans(userId, filters);
    return c.json<ApiPaginated<LoanWithProgress>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

/**
 * Obtener resumen de deudas/acreedores
 */
export const getAllLoanSummary = async (c: Context, userId: UuidSchema) => {
    const result = await loanService.getLoansSummary(userId);
    return c.json<LoanSummary[]>(result, 200)
}

/**
 * Obtener detalle de préstamos por persona específica
 */
export const getLoansByLender = async (c: Context, userId: UuidSchema, lender: string) => {
    const type = c.req.query('type') as TypeLoan;

    const result = await loanService.getLoansByLender(userId, lender, type);
    return c.json(result, 200);
}

/**
 * Obtener un préstamo por su ID
 */
export const getLoanById = async (c: Context, userId: UuidSchema) => {
    const loanId = c.req.param('id') as UuidSchema;
    const result = await loanService.getLoan(userId, loanId);
    return c.json(result, 200);
}

/**
 * Crear un préstamo
 */
export const createLoan = async (c: Context, userId: UuidSchema, loanData: LoanSchema) => {
    const loan = await loanService.createLoan(userId, loanData)
    return c.json({ loan }, 201)
}

/**
 * Registrar un pago a un préstamo específico
 */
export const payLoan = async (c: Context, userId: UuidSchema, loanId: UuidSchema, data: LoanPaymentSchema) => {
    const payment = await loanService.payLoan(userId, loanId, data)
    return c.json({ payment }, 201)
}

/**
 * PAGO RÁPIDO: Distribuye un monto entre varios préstamos de la misma persona
 * Usa QuickPaymentSchema (lender, amount, type + datos del pago)
 */
export const quickPayLender = async (c: Context, userId: UuidSchema, data: QuickPaymentSchema) => {
    // Extraemos lender, type y amount que vienen en el schema
    // El resto de los campos (date, accountId, etc.) se pasan como paymentData
    const { lender, type, amount, ...paymentData } = data;

    const payments = await loanService.quickPayMultipleLoans(
        userId,
        data
    );

    return c.json({
        message: "Pagos procesados exitosamente",
        count: payments.length,
        payments
    }, 201);
}