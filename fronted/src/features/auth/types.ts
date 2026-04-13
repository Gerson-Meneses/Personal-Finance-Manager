import type { Account } from "../accounts/types";
import type { Category } from "../categories/types";

export interface User {
    id: string;
    name: string;
    birthDate: string,
    phone: string,
    country: string | null,
    isAdmin: boolean,
    createdAt: string,
    updatedAt: string,
    is_verified: boolean
    accounts: Account[],
    categories: Category[]
}

export interface RegisterDTO {
    name: string
    birthDate: string,
    phone: string,
    country: string,
    isAdmin: boolean,
    email: string,
    password: string
}

export interface LoginDTO {
    email: string
    password: string
}
// Verify email
export interface VerifyEmailRequestDTO {
    email: string
}

export interface VerifyEmailCodeDTO {
    email: string
    code: string
}

// Reset password
export interface ResetPasswordRequestDTO {
    email: string
}

export interface ResetPasswordDTO {
    email: string
    code: string
    newPassword: string
}
export interface DataAuth {
    message: string
    user: {
        sub: string
        email: string
        role: string
        exp: number
    }
    token: string
}