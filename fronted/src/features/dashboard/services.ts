import { apiFetch } from "../../shared/api";
import type { DashboardResponse } from "./types";


export const getDashboardData = async (): Promise<DashboardResponse> => {
    try {
        const response = await apiFetch<DashboardResponse>("/dashboard");

        if (!response) {
            throw new Error("No se recibieron datos del servidor");
        }

        return response;
    } catch (error) {

        console.error("Error en getDashboardData service:", error);
        throw error;
    }
};