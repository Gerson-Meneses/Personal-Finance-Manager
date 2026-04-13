import { apiFetch } from "../../shared/api";
import type { Transaction } from "../transactions/types";
import type { CreateTransferDto } from "./types";




export const createTransfer = async (data: CreateTransferDto): Promise<Transaction> => {

    const response = await apiFetch<Transaction>("/transaction/transfer", {
        method: "POST",
        body: data
    })

    console.log(response)

    return response
}