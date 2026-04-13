import { useMutation } from "@tanstack/react-query"
import { resetPasswordRequest, resetPasswordConfirm } from "./services"
import type { ResetPasswordRequestDTO, ResetPasswordDTO } from "./types"

export function useResetPassword() {
    const request = useMutation({
        mutationFn: (data: ResetPasswordRequestDTO) => resetPasswordRequest(data)
    })

    const confirm = useMutation({
        mutationFn: (data: ResetPasswordDTO) => resetPasswordConfirm(data)
    })

    return { request, confirm }
}