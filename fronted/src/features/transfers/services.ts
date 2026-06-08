import { apiFetch } from "../../shared/api";
import type { Transaction } from "../transactions/types";
import type { TransferOutput } from "./types";

export const createTransfer = async (data: TransferOutput): Promise<Transaction> => {

    const response = await apiFetch<Transaction>("/transaction/transfer", {
        method: "POST",
        body: data
    })
    return response
}