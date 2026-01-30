import { Hono } from "hono";
import { registerUserController, loginUserController } from "../controllers/authControllers";
import { zValidator } from "@hono/zod-validator";
import { credentialSchema } from "../schemas/credential.schema";
import { userWithCredentialsSchema } from "../schemas/user.schema";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";

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


export default authRouter;