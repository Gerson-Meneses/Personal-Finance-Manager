import { colord } from "colord";
import { z } from "zod";

// --- Helpers ---
export const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

// --- Schemas Base ---

export const stringSchema = (label: string, min = 1, max = 255) =>
    z.preprocess(emptyToUndefined,
        z.string({ message: `${label} es requerido` })
            .trim()
            .min(min, `${label} debe tener al menos ${min} caracteres`)
            .max(max, `${label} no puede exceder los ${max} caracteres`)
    );

export const nameSchema = (label: string = "Nombre") =>
    z.string({ message: `${label} es requerido` })
        .trim()
        .min(3, `${label} debe tener al menos 3 caracteres`)
        .max(99, `${label} no puede exceder los 99 caracteres`)

export const textSchema = (label: string = "Descripción") =>
    stringSchema(label, 3, 1000);

export const descriptionSchema = (label: string = "Descripción") =>
    z.string({ message: `${label} debe ser una cadena de texto.` })
        .optional()

export const uuidSchema = (label: string = "ID") =>
    z.string().uuid({ message: `${label} no tiene un formato válido` });

export const dateSchema = (label: string = "Fecha") =>
    z.coerce.date({
        message: `${label} tiene un formato de fecha inválido`
    });

export const timeSchema = (label: string = "Hora") =>
    z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, `${label} debe tener formato HH:mm`);

export const amountSchema = (label: string = "Monto") =>
    z.coerce
        .number({ message: `${label} es requerido y debe ser numérico` })
        .positive({ message: `${label} debe ser un número positivo` })
        .transform((n) => Math.round(n * 100));

export const numberSchema = (label: string = "Número") =>
    z.coerce.number({ message: `${label} es requerido` });

export const rangeSchema = (min: number, max: number, label: string) =>
    z.coerce
        .number({ message: `${label} debe ser un número` })
        .int({ message: `${label} debe ser un número entero` })
        .min(min, `${label} debe estar entre ${min} y ${max}`)
        .max(max, `${label} debe estar entre ${min} y ${max}`);

export const percentSchema = (label: string = "Porcentaje") =>
    z.coerce
        .number({ message: `${label} debe ser un número` })
        .nonnegative({ message: `${label} no puede ser negativo` })
        .max(100, `${label} no puede ser mayor al 100%`);

export const colorSchema = (label: string = "Color") =>
    z.string().refine((val) => colord(val).isValid(), {
        message: `${label} debe ser un color válido (Hex, RGB o HSL)`,
    });

export const emailSchema = (label: string = "Email") =>
    z.string()
        .email({ message: `${label} no tiene un formato válido` })
        .trim()
        .toUpperCase();

export const passwordSchema = (label: string = "Contraseña") =>
    z.string({ message: `${label} es requerida` })
        .min(8, `${label} debe tener al menos 8 caracteres`)
        .max(16, `${label} no debe exceder los 16 caracteres`)
        .refine((v) => !/\s/.test(v), `${label} no debe contener espacios`)
        .refine((v) => /[a-z]/.test(v), `${label} debe tener al menos una minúscula`)
        .refine((v) => /[A-Z]/.test(v), `${label} debe tener al menos una mayúscula`)
        .refine((v) => /\d/.test(v), `${label} debe tener al menos un número`)
        .refine((v) => /[!@#$%^&*()_\-+=.]/.test(v), `${label} debe tener un carácter especial`);

export const booleanSchema = (label: string = "Campo") =>
    z.preprocess((val) => {
        if (typeof val === "string") {
            if (val === "true") return true;
            if (val === "false") return false;
        }
        return val;
    }, z.boolean({ message: `${label} debe ser un valor booleano` }));

export const paginationSchema = () => z.object({
    page: rangeSchema(1, 1000, "Página").default(1),
    limit: rangeSchema(1, 100, "Límite").default(10),
});