import { apiFetch } from "../../shared/api";
import type { DataAuth, LoginOutput, RegisterOotput, ResetPasswordOutput, VerifyEmailCodeOutput, VerifyEmailRequestOutput} from "./types";

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

export const logout = () => {
    localStorage.removeItem("token");
};