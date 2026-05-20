import { colord } from "colord";
import dayjs from "dayjs";
import { z } from "zod";

// --- Helpers ---
export const emptyToUndefined = (val: unknown) =>
    (val === "" || val === null ? undefined : val);

export const emptyToNull = (val: unknown) =>
    (val === "" ? null : val);

// Helper para crear schemas opcionales sin conflictos
export const optional = <T extends z.ZodTypeAny>(schema: T) =>
    schema.nullable().optional().default(null);

// Helper para crear schemas nullables
export const nullable = <T extends z.ZodTypeAny>(schema: T) =>
    schema.nullable().default(null);

// --- Schemas Base ---

export const stringSchema = (label: string, min = 1, max = 255) =>
    z.preprocess(
        emptyToUndefined,
        z.string({ message: `${label} es requerido` })
            .trim()
            .min(min, `${label} debe tener al menos ${min} caracteres`)
            .max(max, `${label} no puede exceder los ${max} caracteres`)
    );

export const optionalStringSchema = (label: string, min = 1, max = 255) =>
    optional(stringSchema(label, min, max));

export const nullableStringSchema = (label: string, min = 1, max = 255) =>
    nullable(stringSchema(label, min, max));

export const nameSchema = (label: string = "Nombre") =>
    z.string({ message: `${label} es requerido` })
        .trim()
        .min(3, `${label} debe tener al menos 3 caracteres`)
        .max(99, `${label} no puede exceder los 99 caracteres`)
        .refine(
            (val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/.test(val),
            `${label} solo puede contener letras, espacios, guiones y apóstrofes`
        );

export const optionalNameSchema = (label: string = "Nombre") =>
    optional(nameSchema(label));

export const textSchema = (label: string = "Descripción") =>
    stringSchema(label, 3, 1000);

export const optionalTextSchema = (label: string = "Descripción") =>
    optional(textSchema(label));

export const descriptionSchema = (label: string = "Descripción") =>
    z.string({ message: `${label} debe ser una cadena de texto.` })
        .trim()
        .optional()

export const slugSchema = (label: string = "Slug") =>
    z.string({ message: `${label} es requerido` })
        .trim()
        .toLowerCase()
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            `${label} debe contener solo letras minúsculas, números y guiones`
        )
        .min(3, `${label} debe tener al menos 3 caracteres`)
        .max(100, `${label} no puede exceder los 100 caracteres`);

export const optionalSlugSchema = (label: string = "Slug") =>
    optional(slugSchema(label));

export const uuidSchema = (label: string = "ID") =>
    z.string().uuid({ message: `${label} no tiene un formato válido` });

export const uuidArraySchema = (label: string = "IDs") =>
    z.array(z.string().uuid())
        .min(1, `${label} debe tener al menos un elemento`)
        .refine(
            (arr) => new Set(arr).size === arr.length,
            `${label} contiene valores duplicados`
        );

export const dateSchema = (label: string = "Fecha") =>
    z.string().min(1, { message: `${label} es requerida` })
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
        .refine(
            (date) => (dayjs(date).toDate()) instanceof Date && !isNaN(dayjs(date).toDate().getTime()),
            `${label} no es una fecha válida`
        );

export const dateRangeSchema = (label: string = "Rango de fechas") =>
    z.object({
        from: dateSchema("Fecha inicial"),
        to: dateSchema("Fecha final"),
    }).refine(
        (data) => data.from <= data.to,
        `${label}: la fecha inicial no puede ser posterior a la final`
    );

export const timeSchema = (label: string = "Hora") =>
    z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, `${label} debe tener formato HH:mm`);

export const dateTimeSchema = (label: string = "Fecha y Hora") =>
    z.string()
        .datetime({ message: `${label} debe ser una fecha y hora válida (ISO 8601)` });

export const amountSchema = (label: string = "Monto") => {
    return z.coerce
        .number({
            message: `${label} es requerido y debe ser numérico`,
        })
        .positive({
            message: `${label} debe ser un número positivo`,
        })
        .max(999999999.99, {
            message: `${label} no puede exceder los 999,999,999.99`,
        });
};

export const optionalAmountSchema = (label: string = "Monto") =>
    optional(amountSchema(label));

export const numberSchema = (label: string = "Número") =>
    z.coerce.number({ message: `${label} es requerido` })
        .finite({ message: `${label} debe ser un número finito` });

export const optionalNumberSchema = (label: string = "Número") =>
    optional(numberSchema(label));

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
        .max(100, `${label} no puede ser mayor al 100%`)
        .transform((n) => Math.round(n * 100) / 100); // Redondear a 2 decimales

export const optionalPercentSchema = (label: string = "Porcentaje") =>
    optional(percentSchema(label));

export const colorSchema = (label: string = "Color") =>
    z.string().refine((val) => colord(val).isValid(), {
        message: `${label} debe ser un color válido (Hex, RGB o HSL)`,
    }).transform((val) => colord(val).toHex()); // Normalizar a Hex

export const optionalColorSchema = (label: string = "Color") =>
    optional(colorSchema(label));

export const phoneSchema = (label: string = "Teléfono") =>
    z.string()
        .regex(
            /^(\+?56)?[\s]?(\d{1,2}[-]?)?\d{4}[-]?\d{4}$/,
            `${label} debe ser un número de teléfono válido`
        )
        .transform((val) => val.replace(/[\s-]/g, "")); // Normalizar sin espacios ni guiones

export const optionalPhoneSchema = (label: string = "Teléfono") =>
    optional(phoneSchema(label));

export const emailSchema = (label: string = "Email") =>
    z.string()
        .email({ message: `${label} no tiene un formato válido` })
        .trim()
        .toLowerCase()
        .transform((val) => val.toUpperCase()); // Asegurar mayúsculas

export const optionalEmailSchema = (label: string = "Email") =>
    optional(emailSchema(label));

export const urlSchema = (label: string = "URL") =>
    z.string()
        .url({ message: `${label} debe ser una URL válida` })
        .trim();

export const optionalUrlSchema = (label: string = "URL") =>
    optional(urlSchema(label));

// Ahora funciona en cualquier versión de Zod 3.0.0+
export const ipAddressSchema = (label: string = "Dirección IP") =>
    z.string()
        .regex(
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            `${label} debe ser una dirección IPv4 válida`
        );

export const passwordSchema = (label: string = "Contraseña") =>
    z.string({ message: `${label} es requerida` })
        .min(8, `${label} debe tener al menos 8 caracteres`)
        .max(128, `${label} no debe exceder los 128 caracteres`)
        .refine((v) => !/\s/.test(v), `${label} no debe contener espacios`)
        .refine((v) => /[a-z]/.test(v), `${label} debe tener al menos una minúscula`)
        .refine((v) => /[A-Z]/.test(v), `${label} debe tener al menos una mayúscula`)
        .refine((v) => /\d/.test(v), `${label} debe tener al menos un número`)
        .refine((v) => /[!@#$%^&*()_\-+=.[\]{}|;:'",<>?/\\~`]/.test(v),
            `${label} debe tener un carácter especial`);

export const jwtSchema = (label: string = "Token") =>
    z.string()
        .regex(
            /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=.+/]*$/,
            `${label} no es un JWT válido`
        );

export const booleanSchema = (label: string = "Campo") =>
    z.preprocess((val) => {
        if (typeof val === "string") {
            if (val.toLowerCase() === "true" || val === "1") return true;
            if (val.toLowerCase() === "false" || val === "0") return false;
        }
        return val;
    }, z.boolean({ message: `${label} debe ser un valor booleano` }));

export const optionalBooleanSchema = (label: string = "Campo") =>
    optional(booleanSchema(label));

export const enumSchema = <T extends readonly string[]>(
    values: T,
    label: string = "Valor"
) =>
    z.enum(values).refine(
        (val) => values.includes(val),
        `${label} debe ser uno de: ${values.join(", ")}`
    );

export const optionalEnumSchema = <T extends readonly string[]>(
    values: T,
    label: string = "Valor"
) =>
    optional(enumSchema(values, label));

export const paginationSchema = () =>
    z.object({
        page: rangeSchema(1, 100000, "Página").default(1),
        limit: rangeSchema(1, 100, "Límite").default(10),
    });

export const sortSchema = (allowedFields: readonly string[]) =>
    z.object({
        field: z.enum(allowedFields as [string, ...string[]]),
        order: z.enum(["asc", "desc"]).default("asc"),
    }).optional();

export const filtersBaseSchema = () =>
    z.object({
        search: optionalStringSchema("Búsqueda", 1, 255),
        ...paginationSchema().shape,
    });

// --- Schemas Complejos ---

export const addressSchema = (label: string = "Dirección") =>
    z.object({
        street: stringSchema("Calle", 3, 255),
        number: stringSchema("Número", 1, 10),
        apartment: optionalStringSchema("Apartamento", 1, 20),
        city: stringSchema("Ciudad", 2, 100),
        state: stringSchema("Estado/Región", 2, 100),
        zipCode: stringSchema("Código postal", 3, 20),
        country: stringSchema("País", 2, 100),
        notes: optionalStringSchema(label, 0, 500),
    });

export const geoLocationSchema = (label: string = "Ubicación") =>
    z.object({
        latitude: z.coerce.number()
            .min(-90, "Latitud debe estar entre -90 y 90")
            .max(90, "Latitud debe estar entre -90 y 90"),
        longitude: z.coerce.number()
            .min(-180, "Longitud debe estar entre -180 y 180")
            .max(180, "Longitud debe estar entre -180 y 180"),
    }
    ).refine(
        (data) => {
            const { latitude, longitude } = data;
            return (
                (latitude !== undefined && longitude !== undefined) ||
                (latitude === undefined && longitude === undefined)
            );
        },
        `${label}: ambos campos de latitud y longitud deben ser proporcionados juntos`
    );

export const priceRangeSchema = (label: string = "Rango de precios") =>
    z.object({
        min: amountSchema("Precio mínimo"),
        max: amountSchema("Precio máximo"),
    }).refine(
        (data) => data.min <= data.max,
        `${label}: el precio mínimo no puede ser mayor al máximo`
    );

export const fileUploadSchema = (label: string = "Archivo", maxSizeMB = 10) =>
    z.object({
        name: stringSchema("Nombre del archivo", 1, 255),
        size: z.number()
            .positive(`${label} debe tener un tamaño mayor a 0`)
            .max(maxSizeMB * 1024 * 1024, `${label} no puede exceder ${maxSizeMB}MB`),
        type: z.string()
            .refine(
                (type) => type.startsWith("image/") || type.startsWith("application/"),
                `${label} debe ser una imagen o documento`
            ),
        url: optionalUrlSchema("URL del archivo"),
    });

export const tagSchema = (label: string = "Etiqueta") =>
    z.string()
        .trim()
        .toLowerCase()
        .min(2, `${label} debe tener al menos 2 caracteres`)
        .max(50, `${label} no puede exceder los 50 caracteres`)
        .regex(
            /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
            `${label} solo puede contener letras, números, guiones y guiones bajos`
        );

export const tagsSchema = (label: string = "Etiquetas") =>
    z.array(tagSchema("Etiqueta"))
        .min(1, `${label} debe tener al menos una etiqueta`)
        .max(20, `${label} no puede tener más de 20 etiquetas`)
        .refine(
            (tags) => new Set(tags).size === tags.length,
            `${label} contiene etiquetas duplicadas`
        );

export const optionalTagsSchema = (label: string = "Etiquetas") =>
    optional(tagsSchema(label));

export const ratingSchema = (label: string = "Calificación", min = 1, max = 5) =>
    z.coerce.number()
        .int(`${label} debe ser un número entero`)
        .min(min, `${label} debe ser al menos ${min}`)
        .max(max, `${label} no puede exceder ${max}`);

export const optionalRatingSchema = (label: string = "Calificación", min = 1, max = 5) =>
    optional(ratingSchema(label, min, max));

export const socialMediaSchema = () =>
    z.object({
        facebook: optionalUrlSchema("Facebook"),
        twitter: optionalUrlSchema("Twitter"),
        instagram: optionalUrlSchema("Instagram"),
        linkedin: optionalUrlSchema("LinkedIn"),
        tiktok: optionalUrlSchema("TikTok"),
        youtube: optionalUrlSchema("YouTube"),
    }).refine(
        (data) => Object.values(data).some(Boolean),
        "Al menos una red social debe ser proporcionada"
    );

// --- Utilidades de Composición ---

export const createFilterSchema = <T extends z.ZodRawShape>(
    filters: T
) =>
    z.object({
        ...filtersBaseSchema().shape,
        ...filters,
    });

export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
    dataSchema: T
) =>
    z.object({
        data: z.array(dataSchema),
        pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
    });

// --- Tipos Helper ---

export type Pagination = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type PriceRange = z.infer<typeof priceRangeSchema>;
export type GeoLocation = z.infer<typeof geoLocationSchema>;
export type Address = z.infer<typeof addressSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type SocialMedia = z.infer<typeof socialMediaSchema>;