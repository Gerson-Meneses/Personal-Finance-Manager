import { ZodError } from "zod"
import { Context } from "hono"
import { DomainError } from "./errors/domain.errors"

const formatZodError = (error: ZodError) => {
  const details: Record<string, string[]> = {}

  error.issues.forEach(issue => {
    const path = issue.path.join(".") || "body"

    if (!details[path]) {
      details[path] = []
    }

    details[path].push(issue.message)
  })

  return details
}


export const errorHandler = (err: unknown, c: Context) => {
  // 🧩 ZOD
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          type: "VALIDATION_ERROR",
          message: "Errores de validación",
          details: formatZodError(err),
        },
      },
      400
    )
  }

  // 🧠 DOMINIO
  if (err instanceof DomainError) {
    return c.json(
      {
        error: {
          type: err.type,
          message: err.message,
        },
      },
      err.statusCode
    )
  }

  console.error("Unhandled error:", err)

  return c.json(
    {
      error: {
        type: "INTERNAL_ERROR",
        message: "Error interno del servidor",
      },
    },
    500
  )
}

