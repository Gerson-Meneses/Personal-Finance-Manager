import type { Context, Next } from "hono"
import { verify } from "hono/jwt"
import 'dotenv/config'

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')
    const JWT_SECRET = process.env.JWT_SECRET
    if(!JWT_SECRET) {
         return c.json({ error: 'JWT_SECRET requerido' }, 401)
    }

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
