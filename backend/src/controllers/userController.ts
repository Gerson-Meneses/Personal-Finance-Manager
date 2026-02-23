import { Context } from 'hono'
import { UserService } from '../services/userService'

const userService = new UserService()

export const getInfo = async (c: Context, userId: string) => {
    const user = await userService.getUserById(userId)
    return c.json({ message: "User info retrieved successfully", user })
}