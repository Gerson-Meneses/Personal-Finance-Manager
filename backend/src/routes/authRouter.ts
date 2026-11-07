import { Hono } from "hono";
import { registerUserController, loginUserController, verifyCode, verifyGenerateCode, resetPasswordGenerateCode, resetPasswordVerifyCode, updateProfileController, changeEmailGenerateController, changeEmailController, changePasswordGenerateController, changePasswordController } from "../controllers/authControllers";
import { zValidator } from "@hono/zod-validator";
import { credentialSchema } from "../schemas/credential.schema";
import { userWithCredentialsSchema } from "../schemas/user.schema";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { resetPasswordSchema, verifyGenerateSchema, verifySchema } from "../schemas/verify.schema";
import { getConnInfo } from "hono/bun"
import { getClientIP } from "../utils/getIpClient";
import { authMiddleware } from "../middlewares/authMiddleware";
import { AppEnv } from "../types";
import { changeEmailSchema, changePasswordSchema, updateProfileSchema } from "../schemas/profile.schema";

const authRouter = new Hono<AppEnv>();

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

authRouter.patch("/profile",
    authMiddleware,
    zValidator("json", updateProfileSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const { sub } = c.get("user");
        const data = c.req.valid("json");
        return await updateProfileController(c, sub, data);
    });

authRouter.post("/changeEmail/code",
    authMiddleware,
    async (c) => {
        const { sub } = c.get("user");
        const ip = getClientIP(c)
        return await changeEmailGenerateController(c, sub, ip);
    });

authRouter.post("/changeEmail",
    authMiddleware,
    zValidator("json", changeEmailSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const { sub } = c.get("user");
        const data = c.req.valid("json");
        const ip = getClientIP(c)
        return await changeEmailController(c, sub, data, ip);
    });

authRouter.post("/changePassword/code",
    authMiddleware,
    async (c) => {
        const { sub } = c.get("user");
        const ip = getClientIP(c)
        return await changePasswordGenerateController(c, sub, ip);
    });

authRouter.post("/changePassword",
    authMiddleware,
    zValidator("json", changePasswordSchema,
        (result, c) => {
            if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
        }),

    async (c) => {
        const { sub } = c.get("user");
        const data = c.req.valid("json");
        const ip = getClientIP(c)
        return await changePasswordController(c, sub, data, ip);
    });

export default authRouter;