import { Context } from "hono";
import { LoanSchema } from "../schemas/loan.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { LoansService } from "../services/loansService";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { paginated } from "../helpers/responses";
import { Loan } from "../entities/Loan.entity";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";



const loanService = new LoansService()

export const getAllLoans = async (c: Context, userId: UuidSchema, filters: PaginationQuerySchema) => {
    const result = await loanService.getLoans(userId, filters);
    return c.json<ApiPaginated<Loan>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

export const createLoan = async (c: Context, userId: UuidSchema, loanData: LoanSchema) => {
    const loan = await loanService.createLoan(userId, loanData)
    return c.json({ loan }, 201)
}

export const payLoan = async (c: Context, userId: UuidSchema, loanId: UuidSchema, data: LoanPaymentSchema) => {
    const payment = await loanService.payLoan(userId, loanId, data)
    return c.json({ payment, status: 201 })
}