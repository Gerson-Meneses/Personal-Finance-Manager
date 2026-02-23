import { Context } from 'hono'
import { UserService } from '../services/userService'
import { UuidSchema } from '../schemas/uuid.schema'

const userService = new UserService()

export const getInfo = async (c: Context, userId: string) => {
    const user = await userService.getUserById(userId)
    return c.json({ message: "User info retrieved successfully", user })
}

export const getAll = async (c: Context) => {
    const users = await userService.getAllUsers()
    return c.json({ message: "Info retrieved successfully", users })
}

export const deleteUser = async (c:Context, userId: UuidSchema) => {
    await userService.deleteUser(userId)
    return c.json({message: "User deleted succesfully"})
}