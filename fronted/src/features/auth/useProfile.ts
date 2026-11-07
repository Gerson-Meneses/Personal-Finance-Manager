import { useMutation } from "@tanstack/react-query"
import { changeEmail, changeEmailCode, changePassword, changePasswordCode, updateProfile } from "./services"
import type { ChangeEmailOutput, ChangePasswordOutput, MessageResponse, UpdateProfileOutput, UpdateProfileResponse } from "./types"
import type { DataError } from "../../shared/dataApiInterface"

export function useUpdateProfile() {
    return useMutation<UpdateProfileResponse, DataError<UpdateProfileOutput>, UpdateProfileOutput>({
        mutationFn: (data: UpdateProfileOutput) => updateProfile(data)
    })
}

export function useChangeEmail() {
    const request = useMutation<MessageResponse, DataError<void>, void>({
        mutationFn: () => changeEmailCode()
    })

    const confirm = useMutation<MessageResponse, DataError<ChangeEmailOutput>, ChangeEmailOutput>({
        mutationFn: (data: ChangeEmailOutput) => changeEmail(data)
    })

    return { request, confirm }
}

export function useChangePassword() {
    const request = useMutation<MessageResponse, DataError<void>, void>({
        mutationFn: () => changePasswordCode()
    })

    const confirm = useMutation<MessageResponse, DataError<ChangePasswordOutput>, ChangePasswordOutput>({
        mutationFn: (data: ChangePasswordOutput) => changePassword(data)
    })

    return { request, confirm }
}
