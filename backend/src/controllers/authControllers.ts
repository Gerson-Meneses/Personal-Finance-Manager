import { Context } from 'hono'
import { UserWithCredentials } from '../schemas/user.schema';
import { AuthService } from '../services/authServices';
import { CredentialSchema } from '../schemas/credential.schema';
import { ResetPasswordSchema, VerifySchema } from '../schemas/verify.schema';
import { ChangeEmailSchema, ChangePasswordSchema, UpdateProfileSchema } from '../schemas/profile.schema';

const authService = new AuthService();

export const registerUserController = async (c: Context, user: UserWithCredentials) => {
    const registeredUser = await authService.createUser(user);
    return c.json({ message: "User registered successfully", user: registeredUser.payload, token: registeredUser.token });
}

export const loginUserController = async (c: Context, credentials: CredentialSchema) => {
    const { payload, token } = await authService.logingUser(credentials);
    return c.json({ message: "User logged in successfully", user: payload, token });
}

export const verifyGenerateCode = async (c: Context, email: string, ip: string) => {
    const response = await authService.verifyMailGenerate(email, ip);
    return c.json({ message: response });
}

export const verifyCode = async (c: Context, data: VerifySchema, ip: string) => {
    const response = await authService.verifyMail(data, ip);
    return c.json({ message: response });
}

export const resetPasswordGenerateCode = async (c: Context, { email }: { email: string }, ip: string) => {
    const response = await authService.forgotPassword(email, ip);
    return c.json({ message: response });
}

export const resetPasswordVerifyCode = async (c: Context, data: ResetPasswordSchema, ip: string) => {
    const response = await authService.resetPassword(data, ip);
    return c.json({ message: response });
}

export const updateProfileController = async (c: Context, userId: string, data: UpdateProfileSchema) => {
    const user = await authService.updateProfile(userId, data);
    return c.json({ message: "Perfil actualizado correctamente", user });
}

export const changeEmailGenerateController = async (c: Context, userId: string, ip: string) => {
    const response = await authService.changeEmailGenerate(userId, ip);
    return c.json({ message: response });
}

export const changeEmailController = async (c: Context, userId: string, data: ChangeEmailSchema, ip: string) => {
    const response = await authService.changeEmail(userId, data, ip);
    return c.json({ message: response });
}

export const changePasswordGenerateController = async (c: Context, userId: string, ip: string) => {
    const response = await authService.changePasswordGenerate(userId, ip);
    return c.json({ message: response });
}

export const changePasswordController = async (c: Context, userId: string, data: ChangePasswordSchema, ip: string) => {
    const response = await authService.changePassword(userId, data, ip);
    return c.json({ message: response });
}

export const findAll = async (c: Context) => {
    const users = await authService.findAll()
    return c.json(users)
}