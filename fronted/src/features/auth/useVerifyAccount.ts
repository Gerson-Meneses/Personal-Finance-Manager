import { useMutation } from "@tanstack/react-query"
import { verifyEmailRequest, verifyEmailCode } from "./services"
import type { VerifyEmailRequestDTO, VerifyEmailCodeDTO } from "./types"

export function useVerifyEmail() {
    const request = useMutation({
        mutationFn: (data: VerifyEmailRequestDTO) => verifyEmailRequest(data)
    })

    const verify = useMutation({
        mutationFn: (data: VerifyEmailCodeDTO) => verifyEmailCode(data)
    })

    return { request, verify }
}