import { useQuery } from "@tanstack/react-query";
import * as service from "./services";
import type { ProductDetail, ProductQuery, ProductSummary } from "./types";
import type { Data } from "../../shared/dataApiInterface";

export const useProducts = (query: ProductQuery) => {
    const productsQuery = useQuery<Data<ProductSummary>>({
        queryKey: ["products", query],
        queryFn: () => service.getProducts(query),
        placeholderData: (previous) => previous,
    });

    return {
        products: productsQuery.data?.data ?? [],
        meta: productsQuery.data?.meta,
        loading: productsQuery.isLoading,
        isFetching: productsQuery.isFetching,
        isError: productsQuery.isError,
        error: productsQuery.error,
        refetch: productsQuery.refetch,
    };
};

export const useProductDetail = (name?: string) =>
    useQuery<ProductDetail>({
        queryKey: ["products", "detail", name],
        queryFn: () => service.getProductDetail(name as string),
        enabled: !!name,
    });
