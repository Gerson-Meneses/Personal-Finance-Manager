import type { Context, MiddlewareHandler, Next } from "hono"
import { verify } from "hono/jwt"
import { AppEnv } from "../types"
import { AccessDeniedError } from "../helpers/errors/domain.errors"
import 'dotenv/config'

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
        return c.json({ error: 'JWT_SECRET requerido' }, 401)
    }

    if (!authHeader) {
        return c.json({ error: 'Token requerido' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    try {
        const payload = await verify(token, JWT_SECRET, "HS256")
        c.set('user', payload)
        await next()
    } catch {
        return c.json({ error: 'Token inválido o expirado' }, 401)
    }
}

export const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
    const user = c.get('user')

    if (!user || user.role !== 'admin') {
        throw new AccessDeniedError()
    }

    await next()
}
