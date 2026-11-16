import type { Context, MiddlewareHandler, Next } from "hono"
import { verify } from "hono/jwt"
import { AppEnv } from "../types"
import { AccessDeniedError } from "../helpers/errors/domain.errors"
import { AppDataSourceProd } from "../database/dataBaseDev"
import { User } from "../entities/User.entity"
import 'dotenv/config'

export const isTokenVersionValid = (tokenVersion: unknown, currentVersion: unknown) =>
    Number(tokenVersion ?? 0) === Number(currentVersion ?? 0)

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
        return c.json({ error: 'JWT_SECRET requerido' }, 401)
    }

    const match = authHeader?.match(/^Bearer\s+(.+)$/i)
    if (!match) {
        return c.json({ error: 'Token requerido' }, 401)
    }

    const token = match[1]

    let payload: Awaited<ReturnType<typeof verify>>
    try {
        payload = await verify(token, JWT_SECRET, "HS256")
    } catch {
        return c.json({ error: 'Token inválido o expirado' }, 401)
    }

    if (typeof payload.sub !== "string" || !payload.sub) {
        return c.json({ error: 'Sesión inválida o expirada' }, 401)
    }

    const user = await AppDataSourceProd.getRepository(User).findOne({
        where: { id: payload.sub },
    })

    if (!user || user.deletedAt || !isTokenVersionValid(payload.tokenVersion, user.tokenVersion)) {
        return c.json({ error: 'Sesión inválida o expirada' }, 401)
    }

    c.set('user', payload as AppEnv["Variables"]["user"])
    await next()
}

export const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
    const user = c.get('user')

    if (!user || user.role !== 'admin') {
        throw new AccessDeniedError()
    }

    await next()
}
