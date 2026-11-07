import { Context } from 'hono'
import { UserService } from '../services/userService'
import { AuthService } from '../services/authServices'
import { UuidSchema } from '../schemas/uuid.schema'
import { DeleteAccountSchema } from '../schemas/deleteAccount.schema'

const userService = new UserService()
const authService = new AuthService()

export const getInfo = async (c: Context, userId: string) => {
    const user = await userService.getUserById(userId)
    const { credential, ...rest } = user
    return c.json({ ...rest, email: credential?.email ?? null })
}

export const getAll = async (c: Context) => {
    const users = await userService.getAllUsers()
    return c.json({ message: "Info retrieved successfully", users })
}

export const deleteUser = async (c: Context, userId: UuidSchema) => {
    await userService.deleteUser(userId)
    return c.json({ message: "User deleted succesfully" })
}

export const generateDeleteCode = async (c: Context, userId: string, ip: string) => {
    const message = await authService.generateDeleteAccountCode(userId, ip)
    return c.json({ message })
}

export const deleteOwnAccount = async (c: Context, userId: string, data: DeleteAccountSchema, ip: string) => {
    const message = await authService.deleteAccount(userId, data.code, ip)
    return c.json({ message })
}
