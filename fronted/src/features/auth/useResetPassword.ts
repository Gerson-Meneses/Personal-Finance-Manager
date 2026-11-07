import { useMutation } from "@tanstack/react-query"
import { resetPasswordRequest, resetPasswordConfirm } from "./services"
import type { ResetPasswordOutput, VerifyEmailRequestOutput } from "./types"
import type { DataError } from "../../shared/dataApiInterface"


export function useResetPassword() {
    const request = useMutation<void, DataError<VerifyEmailRequestOutput>, VerifyEmailRequestOutput>({
        mutationFn: (data: VerifyEmailRequestOutput) => resetPasswordRequest(data)
    })

    const confirm = useMutation<void, DataError<ResetPasswordOutput>, ResetPasswordOutput>({
        mutationFn: (data: ResetPasswordOutput) => resetPasswordConfirm(data)
    })

    return { request, confirm }
}
