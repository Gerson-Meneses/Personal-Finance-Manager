import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Category, CategorySchemaOutput, CategorySuggestion } from "./types";
import type { TransactionType } from "../transactions/types";

export const getCategories = async (): Promise<Data<Category>> => 
  await apiFetch<Data<Category>>("/category?limit=9999");

export const suggestCategory = async (name: string, type: TransactionType): Promise<{ suggestion: CategorySuggestion | null }> =>
  await apiFetch<{ suggestion: CategorySuggestion | null }>(
    `/category/suggest?name=${encodeURIComponent(name)}&type=${type}`
  );

export const getCategoryById = async (id: string): Promise<Category> => 
  await apiFetch<Category>(`/category/${id}`);

export const createCategory = async (data: CategorySchemaOutput): Promise<Category> => 
  await apiFetch<Category>("/category", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateCategory = async (id: string, data: Partial<CategorySchemaOutput>): Promise<Category> => 
  await apiFetch<Category>(`/category/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteCategory = async (id: string): Promise<void> => {
  await apiFetch<void>(`/category/${id}`, {
    method: "DELETE",
  });
};