import { apiFetch } from "../../shared/api";
import type { DataAuth, LoginDTO, RegisterDTO, ResetPasswordDTO, ResetPasswordRequestDTO, VerifyEmailCodeDTO, VerifyEmailRequestDTO } from "./types";

const BASE_PATH = '/auth';

export const register = async (data: RegisterDTO): Promise<DataAuth> => {
    const response = await apiFetch<DataAuth>(`${BASE_PATH}/register`, {
        method: "POST",
        body: data
    })

    return response
}

export const login = async (data: LoginDTO): Promise<DataAuth> => {
    const response = await apiFetch<DataAuth>(`${BASE_PATH}/login`, {
        method: "POST",
        body: data
    })

    return response
}

export const verifyEmail = async (data: VerifyEmailCodeDTO): Promise<void> => {
    await apiFetch(`/auth//code`, {
        method: "POST",
        body: data
    })
}

export const verifyEmailRequest = async (data: VerifyEmailRequestDTO): Promise<void> => {
    await apiFetch("/auth/verifyAccount", { method: "POST", body: data })
}

export const verifyEmailCode = async (data: VerifyEmailCodeDTO): Promise<void> => {
    await apiFetch("/auth/verifyAccount/code", { method: "POST", body: data })
}

export const resetPasswordRequest = async (data: ResetPasswordRequestDTO): Promise<void> => {
    await apiFetch("/auth/resetPassword/code", { method: "POST", body: data })
}

export const resetPasswordConfirm = async (data: ResetPasswordDTO): Promise<void> => {
    await apiFetch("/auth/resetPassword", { method: "POST", body: data })
}

export const logout = () => {
    localStorage.removeItem("token");
};