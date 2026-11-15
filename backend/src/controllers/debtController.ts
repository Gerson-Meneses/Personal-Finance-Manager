import { Context } from "hono";
import { UuidSchema } from "../schemas/uuid.schema";
import type {
    CancelLoanPlanOutput,
    CreateContactLoanPlanOutput,
    CreateLoanPlanOutput,
    DebtMonthQuery,
    PayInstallmentOutput,
    UpdateLoanPlanOutput,
} from "../schemas/loanPlan.schema";
import { LoanPlanService, toLoanPlanResponse } from "../services/loanPlanService";
import { LoanPlanStatus } from "../utils/Enums";
import { LoansService } from "../services/loansService";

const planService = new LoanPlanService();
const loansService = new LoansService();

export const listLoanPlans = async (c: Context, userId: UuidSchema, loanId: UuidSchema) => {
    return c.json((await planService.listForLoan(userId, loanId)).map(toLoanPlanResponse), 200);
};

export const createLoanPlan = async (
    c: Context,
    userId: UuidSchema,
    loanId: UuidSchema,
    data: CreateLoanPlanOutput
) => {
    return c.json(toLoanPlanResponse(await planService.createForLoan(userId, loanId, data)), 201);
};

export const pauseLoanPlan = async (
    c: Context,
    userId: UuidSchema,
    planId: UuidSchema
) => {
    return c.json(toLoanPlanResponse(await planService.setStatus(userId, planId, LoanPlanStatus.PAUSED)), 200);
};

export const resumeLoanPlan = async (
    c: Context,
    userId: UuidSchema,
    planId: UuidSchema
) => {
    return c.json(toLoanPlanResponse(await planService.setStatus(userId, planId, LoanPlanStatus.ACTIVE)), 200);
};

export const listContactLoanPlans = async (
    c: Context,
    userId: UuidSchema,
    contactId: UuidSchema
) => {
    return c.json((await planService.listForContact(userId, contactId)).map(toLoanPlanResponse), 200);
};

export const createContactLoanPlan = async (
    c: Context,
    userId: UuidSchema,
    contactId: UuidSchema,
    data: CreateContactLoanPlanOutput
) => {
    return c.json(toLoanPlanResponse(await planService.createForContact(userId, contactId, data)), 201);
};

export const updateLoanPlan = async (
    c: Context,
    userId: UuidSchema,
    planId: UuidSchema,
    data: UpdateLoanPlanOutput
) => {
    return c.json(toLoanPlanResponse(await planService.updatePlan(userId, planId, data)), 200);
};

export const cancelLoanPlan = async (
    c: Context,
    userId: UuidSchema,
    planId: UuidSchema,
    data: CancelLoanPlanOutput
) => {
    return c.json(toLoanPlanResponse(await planService.cancel(userId, planId, data.reason)), 200);
};

export const listDebtInstallments = async (
    c: Context,
    userId: UuidSchema,
    query: DebtMonthQuery
) => {
    return c.json(await planService.listInstallmentsForMonth(userId, query.month), 200);
};

export const payDebtInstallment = async (
    c: Context,
    userId: UuidSchema,
    installmentId: UuidSchema,
    data: PayInstallmentOutput
) => {
    return c.json(await loansService.payInstallment(userId, installmentId, data), 201);
};
