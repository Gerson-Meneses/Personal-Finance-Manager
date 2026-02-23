import { z } from "zod";

export const uuidParamSchema = z.object({
    id: z.uuid()
});
export type UuidParamSchema = z.infer<typeof uuidParamSchema>;

export const uuidSchema = z.uuid()

export type UuidSchema = z.infer<typeof uuidSchema>;