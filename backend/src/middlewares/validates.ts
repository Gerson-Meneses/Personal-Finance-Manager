import { z } from "zod";
import type { Context, Next } from "hono";

type Target = "json" | "param" | "query";

export const validate =
    (schema: z.ZodTypeAny, target: Target) =>
        async (c: Context, next: Next) => {
            let data: unknown;

            if (target === "json") {
                data = await c.req.json();
            }

            if (target === "param") {
                data = c.req.param();
            }

            if (target === "query") {
                data = c.req.query();
            }

            const result = schema.safeParse(data);

            if (!result.success && result.error instanceof z.ZodError) {
                return c.json(
                    {
                        message: "Validation error",
                        errors: z.treeifyError(result.error),
                    },
                    400
                );
            }

            c.set(`validated:${target}`, result.data);
            await next();
        };

export const validateBody = (schema: z.ZodTypeAny) =>
    validate(schema, "json");

export const validateParams = (schema: z.ZodTypeAny) =>
    validate(schema, "param");

export const validateQuery = (schema: z.ZodTypeAny) =>
    validate(schema, "query");
