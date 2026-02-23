import type { Context } from "hono"
import { z, type ZodError } from "zod"



export function zodErrorResponse(error: ZodError, c: Context) {

    throw error; // Let the global error handler deal with it
}
