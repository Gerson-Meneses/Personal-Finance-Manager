import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { ProductDetail, ProductQuery, ProductSummary } from "./types";

const toSearchParams = (query: ProductQuery) => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
};

export const getProducts = async (query: ProductQuery = {}): Promise<Data<ProductSummary>> =>
    await apiFetch<Data<ProductSummary>>(`/products${toSearchParams(query)}`);

export const getProductDetail = async (name: string): Promise<ProductDetail> =>
    await apiFetch<ProductDetail>(`/products/detail?name=${encodeURIComponent(name)}`);
