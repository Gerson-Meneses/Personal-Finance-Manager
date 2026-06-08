import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Category, CategorySchemaOutput } from "./types";

export const getCategories = async (): Promise<Data<Category>> => 
  await apiFetch<Data<Category>>("/category");

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