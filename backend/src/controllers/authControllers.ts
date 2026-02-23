import { Context } from 'hono'
import { UserWithCredentials } from '../schemas/user.schema';
import { AuthService } from '../services/authServices';
import { CredentialSchema } from '../schemas/credential.schema';

const authService = new AuthService();

export const registerUserController = async (c: Context, user: UserWithCredentials) => {
    const registeredUser = await authService.createUser(user);
    return c.json({ message: "User registered successfully", user: registeredUser });
}

export const loginUserController = async (c: Context, credentials: CredentialSchema) => {
    const { payload, token } = await authService.logingUser(credentials);
    return c.json({ message: "User logged in successfully", user: payload.email, token });
}

