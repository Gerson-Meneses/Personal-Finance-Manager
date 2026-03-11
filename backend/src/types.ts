import { UuidSchema } from "./schemas/uuid.schema";

export type AppEnv = {
    Variables: {
        user: { sub: UuidSchema; email: string };
    };
    Bindings: {};
};

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}