import { Context } from 'hono'
import { UserWithCredentials } from '../schemas/user.schema';
import { UserService } from '../services/authServices';
import { CredentialSchema } from '../schemas/credential.schema';

const userService = new UserService();

export const registerUserController = async (c: Context, user: UserWithCredentials) => {
    const registeredUser = await userService.createUser(user);
    return c.json({ message: "User registered successfully", user: registeredUser });
}

export const loginUserController = async (c: Context, credentials: CredentialSchema) => {
    const { payload, token } = await userService.logingUser(credentials);
    return c.json({ message: "User logged in successfully", user: payload.email, token });
}

