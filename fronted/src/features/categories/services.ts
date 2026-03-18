import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Category, CreateCategoryDTO } from "./types";

export const getCategories: () => Promise<Data<Category>> = async () =>
  await apiFetch<Data<Category>>("/category");

export const createCategory = async (data: CreateCategoryDTO): Promise<Category> =>
  await apiFetch<Category>("/category", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getCategoryById = async (id: string): Promise<Category> => {
  return await apiFetch<Category>(`/category/${id}`);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiFetch<void>(`/category/${id}`, {
    method: "DELETE",
  })
}
export const updateCategory = async (id: string, data: Partial<CreateCategoryDTO>): Promise<Category> => {
  return await apiFetch<Category>(`/category/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}