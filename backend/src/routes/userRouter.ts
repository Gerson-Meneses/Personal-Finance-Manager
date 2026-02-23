import { Hono } from "hono";
import { AppEnv } from "../types";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getInfo } from "../controllers/userController";

export const userRouter = new Hono<AppEnv>()

userRouter.get('/me',
    authMiddleware, 
    async (c) => {
    const user = c.get("user");
    return await getInfo(c, user.sub)
})