import { ZodError } from "zod"
import { z } from "zod"
import { Context } from "hono"
import { DomainError } from "./errors/domain.errors"

export const errorHandler = (err: unknown, c: Context) => {
    // 🧩 ZOD
    if (err instanceof ZodError) {
        const tree: any = z.treeifyError(err)

        return c.json(
            {
                success: false,
                error: {
                    type: "VALIDATION_ERROR",
                    message: "Datos inválidos",
                    details: tree.properties,
                },
            },
            400
        )
    }

    // 🧠 ERRORES DE DOMINIO
    if (err instanceof DomainError) {
        return c.json(
            {
                success: false,
                error: {
                    type: err.type,
                    message: err.message,
                },
            },
            err.statusCode
        )
    }

    // 💥 ERROR DESCONOCIDO
    console.error("Unhandled error:", err)

    return c.json(
        {
            success: false,
            error: {
                type: "INTERNAL_ERROR",
                message: "Error interno del servidor",
            },
        },
        500
    )
}
