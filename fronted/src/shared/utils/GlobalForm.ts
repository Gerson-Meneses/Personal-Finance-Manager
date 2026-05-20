import { FieldValues } from "react-hook-form";
import { ZodSchema, z } from "zod";
import type { FieldConfig } from "../components/FormGlobal/FormGlobal";


/**
 * Hook para crear campos dinámicos basados en un objeto de tipos
 * Útil cuando tienes un DTO y quieres autogenerar campos
 */
export function useFieldConfigBuilder<T extends FieldValues>() {
  return {
    /**
     * Crear una configuración de campo con tipos seguros
     */
    buildField: <K extends keyof T>(
      name: K,
      options: Partial<FieldConfig<T>>
    ): FieldConfig<T> => ({
      name: name as any,
      ...options,
    }),

    /**
     * Crear múltiples campos a la vez
     */
    buildFields: (
      fieldDefinitions: Record<keyof T, Partial<FieldConfig<T>>>
    ): FieldConfig<T>[] => {
      return Object.entries(fieldDefinitions).map(([name, config]) => ({
        name: name as any,
        ...(config as Partial<FieldConfig<T>>),
      }));
    },
  };
}

/**
 * Utilidad para crear esquemas Zod desde tipos TypeScript
 */
export const zodBuilders = {
  /**
   * Crear un field Zod de string con validaciones comunes
   */
  string: (label: string, options?: { min?: number; max?: number; email?: boolean }) => {
    let schema = z.string().min(1, `${label} es requerido`);
    if (options?.email) {
      schema = schema.email("Email inválido");
    }
    if (options?.min) {
      schema = schema.min(options.min, `Mínimo ${options.min} caracteres`);
    }
    if (options?.max) {
      schema = schema.max(options.max, `Máximo ${options.max} caracteres`);
    }
    return schema;
  },

  /**
   * Crear un field Zod de número con validaciones comunes
   */
  number: (label: string, options?: { min?: number; max?: number }) => {
    let schema = z.number().nonnegative(`${label} debe ser positivo`);
    if (options?.min !== undefined) {
      schema = schema.min(options.min, `${label} mínimo es ${options.min}`);
    }
    if (options?.max !== undefined) {
      schema = schema.max(options.max, `${label} máximo es ${options.max}`);
    }
    return schema;
  },

  /**
   * Crear un field Zod de fecha
   */
  date: (label: string) =>
    z
      .string()
      .refine(
        (date) => !isNaN(new Date(date).getTime()),
        `${label} debe ser una fecha válida`
      ),

  /**
   * Crear un field Zod de hora (HH:mm)
   */
  time: (label: string) =>
    z
      .string()
      .regex(/^\d{2}:\d{2}$/, `${label} debe estar en formato HH:mm`),

  /**
   * Crear un field Zod de enum
   */
  enum: <T extends readonly any[]>(label: string, values: T) =>
    z.enum(values).default(values[0]),

  /**
   * Crear un field Zod optional (no requerido)
   */
  optional: (schema: ZodSchema) => schema.optional().default(""),
};

/**
 * Utilidad para gestionar visibilidad y habilitado de campos
 */
export class FieldStateManager<T extends FieldValues> {
  private hidden: Set<keyof T> = new Set();
  private disabled: Set<keyof T> = new Set();

  hide(...fields: (keyof T)[]) {
    fields.forEach((f) => this.hidden.add(f));
    return this;
  }

  hideAll() {
    return this;
  }

  show(...fields: (keyof T)[]) {
    fields.forEach((f) => this.hidden.delete(f));
    return this;
  }

  disable(...fields: (keyof T)[]) {
    fields.forEach((f) => this.disabled.add(f));
    return this;
  }

  enable(...fields: (keyof T)[]) {
    fields.forEach((f) => this.disabled.delete(f));
    return this;
  }

  apply(fieldsConfig: FieldConfig<T>[]): FieldConfig<T>[] {
    return fieldsConfig.map((field) => ({
      ...field,
      hidden: this.hidden.has(field.name),
      disabled: this.disabled.has(field.name),
    }));
  }

  reset() {
    this.hidden.clear();
    this.disabled.clear();
    return this;
  }
}

/**
 * Hook para manejar estado compartido de campos dinámicamente
 * Útil cuando ciertos campos dependen de otros
 */
export function useConditionalFields<T extends FieldValues>(
  watchValues: Partial<T>,
  conditions: Record<
    keyof T,
    (watchValues: Partial<T>) => { hidden?: boolean; disabled?: boolean }
  >
) {
  return Object.entries(conditions).reduce(
    (acc, [fieldName, conditionFn]) => {
      const state = (conditionFn as any)(watchValues);
      return {
        ...acc,
        [fieldName]: state,
      };
    },
    {} as Record<keyof T, { hidden?: boolean; disabled?: boolean }>
  );
}

/**
 * Factory para crear validación compartida
 */
export class FormValidationFactory {
  static createTransactionValidation = () =>
    z.object({
      name: z
        .string()
        .min(1, "El nombre es requerido")
        .min(3, "Mínimo 3 caracteres"),
      type: z.enum(["INCOME", "EXPENSE"]),
      categoryId: z.string().min(1, "La categoría es requerida"),
      accountId: z.string().min(1, "La cuenta es requerida"),
      amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
      date: z
        .string()
        .refine(
          (date) => !isNaN(new Date(date).getTime()),
          "Fecha inválida"
        ),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:mm)"),
      description: z.string().optional().default(""),
    });

  static createLoanValidation = () =>
    z.object({
      lender: z
        .string()
        .min(1, "La persona es requerida")
        .min(2, "Mínimo 2 caracteres"),
      amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
      type: z.enum(["GIVEN", "RECEIVED"]),
      startDate: z
        .string()
        .refine(
          (date) => !isNaN(new Date(date).getTime()),
          "Fecha inválida"
        ),
      date: z
        .string()
        .refine(
          (date) => !isNaN(new Date(date).getTime()),
          "Fecha inválida"
        ),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
      accountId: z.string().min(1, "La cuenta es requerida"),
      description: z.string().optional().default(""),
    });

  static createCustom = <T extends FieldValues>(schema: Record<keyof T, ZodSchema>) =>
    z.object(schema as any);
}

/**
 * Convertir un objeto de tipos en configuración de campos automáticamente
 */
export function inferFieldsFromType<T extends FieldValues>(
  typeDefinition: Record<keyof T, string>,
  labelMap?: Record<keyof T, string>
): FieldConfig<T>[] {
  return Object.entries(typeDefinition).map(([fieldName, fieldType]) => {
    const label = labelMap?.[fieldName as keyof T] || fieldName;
    let type: FieldConfig<T>["type"] = "text";

    // Inferir tipo del campo basado en el nombre o tipo
    if (fieldType.includes("number")) type = "number";
    if (fieldType.includes("date")) type = "date";
    if (fieldType.includes("time")) type = "time";
    if (fieldType.includes("boolean")) type = "select";
    if (fieldName.toString().toLowerCase().includes("description")) type = "textarea";

    return {
      name: fieldName as any,
      label,
      type,
    };
  });
}

/**
 * Grupo de funciones para trabajar con valores de formulario
 */
export const formValueHelpers = {
  /**
   * Limpiar valores undefined/null
   */
  cleanValues: <T extends FieldValues>(values: T): T => {
    return Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {} as T);
  },

  /**
   * Transformar valores antes de enviar al servidor
   */
  transform: <T extends FieldValues, U extends FieldValues>(
    values: T,
    transformer: (val: T) => U
  ): U => transformer(values),

  /**
   * Serializar valores para enviar
   */
  serialize: <T extends FieldValues>(values: T): string => {
    return JSON.stringify(values);
  },

  /**
   * Deserializar valores recibidos
   */
  deserialize: <T extends FieldValues>(json: string): T => {
    return JSON.parse(json);
  },
};

/**
 * Hook para crear tipos seguros de configuración
 */
export type TypeSafeFieldConfig<T extends FieldValues> = {
  [K in keyof T]: Partial<FieldConfig<T>> & { name: K };
};