import { z } from "zod";
import { TransactionTypeValues, type Transaction, type TransactionType } from "../transactions/types";
import { colorSchema, nameSchema } from "../../shared/Schemas/Base.schema";

/* export const TransactionTypeValues = ["INCOME", "EXPENSE"] as const
export type TransactionType = typeof TransactionTypeValues[number]; */

export const CategorySchema = z.object({
  name: nameSchema(),
  type: z.enum(TransactionTypeValues),
  color: colorSchema().optional(),
  icon: nameSchema("Icono").optional(),
});

/* ---------- Input (before transform) ---------- */
export type CategorySchemaInput = z.input<typeof CategorySchema>;

/* ---------- Output (after parse / transform) ---------- */
export type CategorySchemaOutput = z.output<typeof CategorySchema>;


export interface UpdateCategoryInput extends CategorySchemaOutput {
  categoryId: string;
}

/* ------------------------------------------------------------------ */
/*  Entity                                                              */
/* ------------------------------------------------------------------ */
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
  isVisible: boolean;
  isBase: boolean;
  transactions?: Transaction[];
}