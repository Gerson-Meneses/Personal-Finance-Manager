import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Category, CreateCategoryDTO } from "./types";

export const getCategories: () => Promise<Data<Category>> = () =>
  apiFetch<Data<Category>>("/category");

export const createCategory = (data: CreateCategoryDTO) =>
  apiFetch<Category>("/category", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getCategoryById = (id: string) =>
  apiFetch<Category>(`/category/${id}`);

export const deleteCategory = async (id: string) => {
  await apiFetch<void>(`/category/${id}`, {
    method: "DELETE",
  })
}
export const updateCategory = async (id: string, data: CreateCategoryDTO) => {
  await apiFetch<Category>(`/category/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}