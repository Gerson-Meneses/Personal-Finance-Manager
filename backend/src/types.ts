import { UuidSchema } from "./schemas/uuid.schema";
import { TypeTransaction } from "./utils/Enums";

export type AppEnv = {
    Variables: {
        user: { sub: UuidSchema; email: string };
    };
    Bindings: {};
};

export type TransactionFilters = {
    userId: UuidSchema;
    type?: TypeTransaction;
    accountId?: UuidSchema;
    relatedAccountId?: UuidSchema;
    categoryId?: UuidSchema;
    date?: Date;
    from?: Date;
    to?: Date;
    amount?: number;
    minAmount?: number;
    maxAmount?: number; page?: number;   // default 1
    limit?: number;  // default 20
    order?: 'ASC' | 'DESC'; // por fecha
};
