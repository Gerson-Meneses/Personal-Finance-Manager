import { useMutation } from "@tanstack/react-query"
import { verifyEmailRequest, verifyEmailCode } from "./services"
import type { VerifyEmailCodeOutput, VerifyEmailRequestOutput } from "./types"

export function useVerifyEmail() {
    const request = useMutation({
        mutationFn: (data: VerifyEmailRequestOutput) => verifyEmailRequest(data)
    })

    const verify = useMutation({
        mutationFn: (data: VerifyEmailCodeOutput) => verifyEmailCode(data)
    })

    return { request, verify }
}