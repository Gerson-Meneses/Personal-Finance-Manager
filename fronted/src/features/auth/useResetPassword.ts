import { useMutation } from "@tanstack/react-query"
import { resetPasswordRequest, resetPasswordConfirm } from "./services"
import type { ResetPasswordOutput } from "./types"


export function useResetPassword() {
    const request = useMutation({
        mutationFn: (data: ResetPasswordOutput) => resetPasswordRequest(data)
    })

    const confirm = useMutation({
        mutationFn: (data: ResetPasswordOutput) => resetPasswordConfirm(data)
    })

    return { request, confirm }
}