import { AppDataSourceProd } from "../database/dataBaseDev";
import { NotFoundError } from "../helpers/errors/domain.errors";
import { ProductQuerySchema } from "../schemas/product.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { money } from "../utils/normalizarMoney";
import { normalizeProductName } from "../utils/productName";
import {
    ProductDetailResponse,
    ProductPriceResponse,
    ProductSummaryResponse,
} from "../ResponseInterfaces/ProductInterface";

interface ProductRow {
    normalizedName: string;
    name: string;
    bestPrice: string | number;
    averagePrice: string | number;
    lastPrice: string | number;
    purchaseCount: string | number;
    lastDate: string | null;
    bestMerchantName: string | null;
    bestMerchantAddress: string | null;
    bestDate: string | null;
    bestTransactionId: string | null;
    totalCount: string | number;
}

interface ProductPriceRow {
    transactionId: string;
    name: string;
    date: string;
    unitPrice: string | number;
    quantity: string | number;
    total: string | number;
    merchantName: string | null;
    merchantAddress: string | null;
}

const toSummary = (row: ProductRow): ProductSummaryResponse => ({
    normalizedName: row.normalizedName,
    name: row.name,
    bestPrice: money(Number(row.bestPrice ?? 0)),
    averagePrice: money(Number(row.averagePrice ?? 0)),
    lastPrice: money(Number(row.lastPrice ?? 0)),
    purchaseCount: Number(row.purchaseCount ?? 0),
    lastDate: row.lastDate,
    ...(row.bestMerchantName ? { bestMerchantName: row.bestMerchantName } : {}),
    ...(row.bestMerchantAddress ? { bestMerchantAddress: row.bestMerchantAddress } : {}),
    ...(row.bestDate ? { bestDate: row.bestDate } : {}),
    ...(row.bestTransactionId ? { bestTransactionId: row.bestTransactionId } : {}),
});

export class ProductService {
    async getProducts(
        userId: UuidSchema,
        filters: ProductQuerySchema
    ): Promise<PaginatedResult<ProductSummaryResponse>> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 50;
        const search = filters.search?.trim() ?? "";

        const orderBy = (() => {
            switch (filters.order) {
                case "name":
                    return "ln.name ASC";
                case "price":
                    return 's."bestPrice" ASC';
                case "purchases":
                    return 's."purchaseCount" DESC';
                default:
                    return 's."lastDate" DESC NULLS LAST';
            }
        })();

        const rows: ProductRow[] = await AppDataSourceProd.query(
            `
            WITH stats AS (
                SELECT i."normalizedName",
                       MIN(i."unitPrice") AS "bestPrice",
                       ROUND(AVG(i."unitPrice"))::integer AS "averagePrice",
                       COUNT(*)::integer AS "purchaseCount",
                       MAX(t.date)::text AS "lastDate"
                FROM "transaction_items" i
                INNER JOIN "transactions" t ON t.id = i."transactionId"
                WHERE i."userId" = $1
                GROUP BY i."normalizedName"
            ),
            best AS (
                SELECT DISTINCT ON (i."normalizedName")
                       i."normalizedName",
                       i."unitPrice",
                       t."merchantName",
                       t."merchantAddress",
                       t.date::text AS "date",
                       t.id AS "transactionId"
                FROM "transaction_items" i
                INNER JOIN "transactions" t ON t.id = i."transactionId"
                WHERE i."userId" = $1
                ORDER BY i."normalizedName", i."unitPrice" ASC, t.date DESC
            ),
            last_price AS (
                SELECT DISTINCT ON (i."normalizedName")
                       i."normalizedName",
                       i."unitPrice" AS "lastPrice"
                FROM "transaction_items" i
                INNER JOIN "transactions" t ON t.id = i."transactionId"
                WHERE i."userId" = $1
                ORDER BY i."normalizedName", t.date DESC, t."createdAt" DESC
            ),
            last_name AS (
                SELECT DISTINCT ON (i."normalizedName")
                       i."normalizedName",
                       i.name
                FROM "transaction_items" i
                INNER JOIN "transactions" t ON t.id = i."transactionId"
                WHERE i."userId" = $1
                ORDER BY i."normalizedName", t.date DESC, t."createdAt" DESC
            )
            SELECT s."normalizedName",
                   ln.name,
                   s."bestPrice",
                   s."averagePrice",
                   s."purchaseCount",
                   s."lastDate",
                   lp."lastPrice",
                   b."merchantName" AS "bestMerchantName",
                   b."merchantAddress" AS "bestMerchantAddress",
                   b.date AS "bestDate",
                   b."transactionId" AS "bestTransactionId",
                   COUNT(*) OVER()::integer AS "totalCount"
            FROM stats s
            INNER JOIN best b USING ("normalizedName")
            INNER JOIN last_price lp USING ("normalizedName")
            INNER JOIN last_name ln USING ("normalizedName")
            WHERE $2 = ''
               OR s."normalizedName" ILIKE '%' || $2 || '%'
               OR ln.name ILIKE '%' || $2 || '%'
            ORDER BY ${orderBy}
            LIMIT $3 OFFSET $4
            `,
            [userId, search, limit, (page - 1) * limit]
        );

        return {
            items: rows.map(toSummary),
            total: Number(rows[0]?.totalCount ?? 0),
            page,
            limit,
        };
    }

    async getProductDetail(
        userId: UuidSchema,
        name: string
    ): Promise<ProductDetailResponse> {
        const normalizedName = normalizeProductName(name);
        const rows: ProductPriceRow[] = await AppDataSourceProd.query(
            `
            SELECT i.name,
                   i."unitPrice",
                   i.quantity,
                   i.total,
                   t.id AS "transactionId",
                   t.date::text AS date,
                   t."merchantName",
                   t."merchantAddress"
            FROM "transaction_items" i
            INNER JOIN "transactions" t ON t.id = i."transactionId"
            WHERE i."userId" = $1 AND i."normalizedName" = $2
            ORDER BY i."unitPrice" ASC, t.date DESC, t."createdAt" DESC
            `,
            [userId, normalizedName]
        );

        if (rows.length === 0) {
            throw new NotFoundError("Producto no encontrado");
        }

        const prices: ProductPriceResponse[] = rows.map((row) => ({
            transactionId: row.transactionId,
            date: row.date,
            unitPrice: money(Number(row.unitPrice ?? 0)),
            quantity: Number(row.quantity ?? 0),
            total: money(Number(row.total ?? 0)),
            ...(row.merchantName ? { merchantName: row.merchantName } : {}),
            ...(row.merchantAddress ? { merchantAddress: row.merchantAddress } : {}),
        }));

        const latest = rows.reduce((best, row) =>
            row.date > best.date ? row : best
        );

        const best = prices[0];
        const averageCents =
            rows.reduce((sum, row) => sum + Number(row.unitPrice ?? 0), 0) / rows.length;

        return {
            normalizedName,
            name: latest.name,
            bestPrice: best.unitPrice,
            averagePrice: money(Math.round(averageCents)),
            lastPrice: money(Number(latest.unitPrice ?? 0)),
            purchaseCount: rows.length,
            lastDate: latest.date,
            ...(best.merchantName ? { bestMerchantName: best.merchantName } : {}),
            ...(best.merchantAddress ? { bestMerchantAddress: best.merchantAddress } : {}),
            bestDate: best.date,
            bestTransactionId: best.transactionId,
            prices,
        };
    }
}
