import type { Context } from "hono";
import { ProductService } from "../services/productService";
import { ProductQuerySchema } from "../schemas/product.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { ProductSummaryResponse } from "../ResponseInterfaces/ProductInterface";
import { paginated } from "../helpers/responses";
import type { UuidSchema } from "../schemas/uuid.schema";

const productService = new ProductService();

export const getProducts = async (
    c: Context,
    userId: UuidSchema,
    filters: ProductQuerySchema
) => {
    const result = await productService.getProducts(userId, filters);
    return c.json<ApiPaginated<ProductSummaryResponse>>(
        paginated(result.items, result.total, result.page, result.limit),
        200
    );
};

export const getProductDetail = async (
    c: Context,
    userId: UuidSchema,
    name: string
) => {
    const result = await productService.getProductDetail(userId, name);
    return c.json(result, 200);
};
