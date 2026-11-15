import { Context } from "hono";
import { LoanSchema, type CancelLoanOutput, type ForgiveLoanOutput, type ReverseLoanMovementOutput, type UpdateLoanMovementOutput, type UpdateLoanOutput } from "../schemas/loan.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { LoansService } from "../services/loansService";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { paginated } from "../helpers/responses";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";
import { QuickPaymentSchema } from "../schemas/quickPayment.schema";
import { LoanQuerySchema } from "../schemas/Loanquery,schema";
import { LoanResponse, LoanSummaryGrouped } from "../ResponseInterfaces/LoansResponse";
import { LoanSummaryQuerySchema } from "../schemas/LoanSummaryQuery.schema";

const loanService = new LoansService()

export const getAllLoans = async (c: Context, userId: UuidSchema, filters: LoanQuerySchema) => {
    const result = await loanService.getLoans(userId, filters);
    return c.json<ApiPaginated<LoanResponse>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

export const getAllLoanSummary = async (c: Context, userId: UuidSchema, filters: LoanSummaryQuerySchema) => {
    const result = await loanService.getLoansSummary(userId, filters);
    return c.json<LoanSummaryGrouped[]>(result, 200)
}
export const getLoanById = async (c: Context, userId: UuidSchema) => {
    const loanId = c.req.param('id') as UuidSchema;
    const result = await loanService.getLoanDetail(userId, loanId);
    return c.json(result, 200);
}

export const createLoan = async (c: Context, userId: UuidSchema, loanData: LoanSchema) => {
    const loan = await loanService.createLoan(userId, loanData)
    return c.json({ loan }, 201)
}

export const payLoan = async (c: Context, userId: UuidSchema, loanId: UuidSchema, data: LoanPaymentSchema) => {
    const payment = await loanService.payLoan(userId, loanId, data)
    return c.json({ payment }, 201)
}
export const quickPayLender = async (c: Context, userId: UuidSchema, data: QuickPaymentSchema) => {
    const result = await loanService.quickPayMultipleLoans(
        userId,
        data
    );
    return c.json({
        message: "Pagos procesados exitosamente",
        ...result,
    }, 201);
}
export const updateLoan = async (
    c: Context,
    userId: UuidSchema,
    loanId: UuidSchema,
    data: UpdateLoanOutput
) => {
    return c.json({ loan: await loanService.updateLoan(userId, loanId, data) }, 200);
};

export const cancelLoan = async (
    c: Context,
    userId: UuidSchema,
    loanId: UuidSchema,
    data: CancelLoanOutput
) => {
    return c.json({ loan: await loanService.cancelLoan(userId, loanId, data.reason) }, 200);
};

export const getLoanAudit = async (c: Context, userId: UuidSchema, loanId: UuidSchema) => {
    return c.json(await loanService.getLoanAudit(userId, loanId), 200);
};

export const forgiveLoan = async (
    c: Context,
    userId: UuidSchema,
    loanId: UuidSchema,
    data: ForgiveLoanOutput
) => {
    return c.json({ loan: await loanService.forgiveLoan(userId, loanId, data) }, 200);
};

export const updateLoanMovement = async (
    c: Context,
    userId: UuidSchema,
    loanId: UuidSchema,
    movementId: UuidSchema,
    data: UpdateLoanMovementOutput
) => {
    return c.json(await loanService.updateMovement(userId, loanId, movementId, data), 200);
};

export const reverseLoanMovement = async (
    c: Context,
    userId: UuidSchema,
    loanId: UuidSchema,
    movementId: UuidSchema,
    data: ReverseLoanMovementOutput
) => {
    return c.json(await loanService.reverseMovement(userId, loanId, movementId, data), 200);
};
