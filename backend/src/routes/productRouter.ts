import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import {
    productDetailQuerySchema,
    productQuerySchema,
} from "../schemas/product.schema";
import { getProductDetail, getProducts } from "../controllers/productController";

export const productRouter = new Hono<AppEnv>();

productRouter.get("/", async (c) => {
    const parsed = productQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return zodErrorResponse(parsed.error, c);
    return await getProducts(c, c.get("user").sub, parsed.data);
});

productRouter.get(
    "/detail",
    zValidator("query", productDetailQuerySchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const { name } = c.req.valid("query");
        return await getProductDetail(c, c.get("user").sub, name);
    }
);
