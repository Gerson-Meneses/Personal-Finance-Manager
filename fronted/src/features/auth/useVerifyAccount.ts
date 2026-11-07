import { useMutation } from "@tanstack/react-query"
import { verifyEmailRequest, verifyEmailCode } from "./services"
import type { VerifyEmailCodeOutput, VerifyEmailRequestOutput } from "./types"
import type { DataError } from "../../shared/dataApiInterface"

export function useVerifyEmail() {
    const request = useMutation<void, DataError<VerifyEmailRequestOutput>, VerifyEmailRequestOutput>({
        mutationFn: (data: VerifyEmailRequestOutput) => verifyEmailRequest(data)
    })

    const verify = useMutation<void, DataError<VerifyEmailCodeOutput>, VerifyEmailCodeOutput>({
        mutationFn: (data: VerifyEmailCodeOutput) => verifyEmailCode(data)
    })

    return { request, verify }
}
