import { Hono } from "hono";
import { registerUserController, loginUserController, verifyCode, verifyGenerateCode, resetPasswordGenerateCode, resetPasswordVerifyCode } from "../controllers/authControllers";
import { zValidator } from "@hono/zod-validator";
import { credentialSchema } from "../schemas/credential.schema";
import { userWithCredentialsSchema } from "../schemas/user.schema";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { resetPasswordSchema, verifyGenerateSchema, verifySchema } from "../schemas/verify.schema";
import { getConnInfo } from "hono/bun"
import { getClientIP } from "../utils/getIpClient";

const authRouter = new Hono();

authRouter.post("/login",
    zValidator("json", credentialSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const credentials = c.req.valid("json");
        return await loginUserController(c, credentials);
    });

authRouter.post("/register",
    zValidator("json", userWithCredentialsSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const user = c.req.valid("json");
        return await registerUserController(c, user);
    });

authRouter.post("/verifyAccount",
    zValidator("json", verifyGenerateSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const data = c.req.valid("json");
        const ip = getClientIP(c)
        return await verifyGenerateCode(c, data.email, ip);
    });

authRouter.post("/verifyAccount/code",
    zValidator("json", verifySchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const data = c.req.valid("json");
        const ip = getClientIP(c)
        return await verifyCode(c, data, ip);
    });

authRouter.post("/resetPassword/code",
    zValidator("json", verifyGenerateSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const data = c.req.valid("json");
        const ip = getClientIP(c)
        return await resetPasswordGenerateCode(c, data, ip);
    });

authRouter.post("/resetPassword",
    zValidator("json", resetPasswordSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const data = c.req.valid("json");
        const ip = getClientIP(c)
        return await resetPasswordVerifyCode(c, data, ip);
    });

export default authRouter;