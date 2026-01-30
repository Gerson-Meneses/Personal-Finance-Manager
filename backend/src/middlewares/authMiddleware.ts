import type { Context, Next } from "hono"
import { verify } from "hono/jwt"
import { JWT_SECRET } from "../../.env"

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
        return c.json({ error: 'Token requerido' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    try {
        const payload = await verify(token, JWT_SECRET)
        c.set('user', payload)
        await next()
    } catch {
        return c.json({ error: 'Token inválido o expirado' }, 401)
    }
}
