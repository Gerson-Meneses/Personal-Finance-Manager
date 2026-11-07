import { apiFetch } from "../../shared/api";
import type { ChangeEmailOutput, ChangePasswordOutput, DataAuth, LoginOutput, MessageResponse, RegisterOotput, ResetPasswordOutput, UpdateProfileOutput, UpdateProfileResponse, VerifyEmailCodeOutput, VerifyEmailRequestOutput} from "./types";

const BASE_PATH = '/auth';

export const register = async (data: RegisterOotput): Promise<DataAuth> => {
    const response = await apiFetch<DataAuth>(`${BASE_PATH}/register`, {
        method: "POST",
        body: data
    })

    return response
}

export const login = async (data: LoginOutput): Promise<DataAuth> => {
    const response = await apiFetch<DataAuth>(`${BASE_PATH}/login`, {
        method: "POST",
        body: data
    })

    return response
}

export const verifyEmail = async (data: VerifyEmailCodeOutput): Promise<void> => {
    await apiFetch(`/auth//code`, {
        method: "POST",
        body: data
    })
}

export const verifyEmailRequest = async (data: VerifyEmailRequestOutput): Promise<void> => {
    await apiFetch("/auth/verifyAccount", { method: "POST", body: data })
}

export const verifyEmailCode = async (data: VerifyEmailCodeOutput): Promise<void> => {
    await apiFetch("/auth/verifyAccount/code", { method: "POST", body: data })
}

export const resetPasswordRequest = async (data: VerifyEmailRequestOutput): Promise<void> => {
    await apiFetch("/auth/resetPassword/code", { method: "POST", body: data })
}

export const resetPasswordConfirm = async (data: ResetPasswordOutput): Promise<void> => {
    await apiFetch("/auth/resetPassword", { method: "POST", body: data })
}

export const updateProfile = async (data: UpdateProfileOutput): Promise<UpdateProfileResponse> => {
    return await apiFetch<UpdateProfileResponse>(`${BASE_PATH}/profile`, { method: "PATCH", body: data })
}

export const changeEmailCode = async (): Promise<MessageResponse> => {
    return await apiFetch<MessageResponse>(`${BASE_PATH}/changeEmail/code`, { method: "POST" })
}

export const changeEmail = async (data: ChangeEmailOutput): Promise<MessageResponse> => {
    return await apiFetch<MessageResponse>(`${BASE_PATH}/changeEmail`, { method: "POST", body: data })
}

export const changePasswordCode = async (): Promise<MessageResponse> => {
    return await apiFetch<MessageResponse>(`${BASE_PATH}/changePassword/code`, { method: "POST" })
}

export const changePassword = async (data: ChangePasswordOutput): Promise<MessageResponse> => {
    return await apiFetch<MessageResponse>(`${BASE_PATH}/changePassword`, { method: "POST", body: data })
}

export const logout = () => {
    localStorage.removeItem("token");
};