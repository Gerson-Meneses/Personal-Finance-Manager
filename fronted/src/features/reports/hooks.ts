import { useQuery } from "@tanstack/react-query";
import * as service from "./services";
import type { MonthlyReportResponse } from "./types";

export const useMonthlyReport = (months: number, endMonth?: string) => {
    const query = useQuery<MonthlyReportResponse>({
        queryKey: ["reports", "monthly", months, endMonth ?? "current"],
        queryFn: () => service.getMonthlyReport(months, endMonth),
        placeholderData: (previousData) => previousData,
        staleTime: 0,
        refetchOnMount: "always",
    });

    return {
        report: query.data,
        loading: query.isLoading,
        fetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
    };
};
