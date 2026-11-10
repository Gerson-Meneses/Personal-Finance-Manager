import { Context } from "hono";
import { UuidSchema } from "../schemas/uuid.schema";
import type {
    CreateRecurringPaymentOutput,
    ExecuteOccurrenceOutput,
    RecurringMonthQuery,
    SkipOccurrenceOutput,
    UpdateRecurringPaymentOutput,
} from "../schemas/recurringPayment.schema";
import { RecurringPaymentService } from "../services/recurringPaymentService";

const recurringPaymentService = new RecurringPaymentService();

export const listRecurringPayments = async (c: Context, userId: UuidSchema) => {
    const data = await recurringPaymentService.listPayments(userId);
    return c.json(data, 200);
};

export const getRecurringProjection = async (
    c: Context,
    userId: UuidSchema,
    query: RecurringMonthQuery
) => {
    const data = await recurringPaymentService.getMonthProjection(userId, query.month);
    return c.json(data, 200);
};

export const createRecurringPayment = async (
    c: Context,
    userId: UuidSchema,
    data: CreateRecurringPaymentOutput
) => {
    const created = await recurringPaymentService.createPayment(userId, data);
    return c.json(created, 201);
};

export const updateRecurringPayment = async (
    c: Context,
    userId: UuidSchema,
    paymentId: UuidSchema,
    data: UpdateRecurringPaymentOutput
) => {
    const updated = await recurringPaymentService.updatePayment(userId, paymentId, data);
    return c.json(updated, 200);
};

export const deleteRecurringPayment = async (
    c: Context,
    userId: UuidSchema,
    paymentId: UuidSchema
) => {
    await recurringPaymentService.deletePayment(userId, paymentId);
    return c.body(null, 204);
};

export const executeRecurringOccurrence = async (
    c: Context,
    userId: UuidSchema,
    occurrenceId: UuidSchema,
    data: ExecuteOccurrenceOutput
) => {
    const executed = await recurringPaymentService.executeOccurrence(userId, occurrenceId, data);
    return c.json(executed, 200);
};

export const skipRecurringOccurrence = async (
    c: Context,
    userId: UuidSchema,
    occurrenceId: UuidSchema,
    data: SkipOccurrenceOutput
) => {
    const skipped = await recurringPaymentService.skipOccurrence(userId, occurrenceId, data);
    return c.json(skipped, 200);
};

export const processDueRecurringPayments = async (c: Context, userId: UuidSchema) => {
    const result = await recurringPaymentService.processDuePayments(userId);
    return c.json(result, 200);
};

export const listNotifications = async (c: Context, userId: UuidSchema, unreadOnly: boolean) => {
    const data = await recurringPaymentService.getNotifications(userId, unreadOnly);
    return c.json(data, 200);
};

export const markNotificationRead = async (
    c: Context,
    userId: UuidSchema,
    notificationId: UuidSchema
) => {
    await recurringPaymentService.markNotificationRead(userId, notificationId);
    return c.json({ message: "Notificación marcada como leída" }, 200);
};

export const markAllNotificationsRead = async (c: Context, userId: UuidSchema) => {
    await recurringPaymentService.markAllNotificationsRead(userId);
    return c.json({ message: "Notificaciones marcadas como leídas" }, 200);
};
