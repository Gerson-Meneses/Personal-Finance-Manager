import { apiFetch } from "../../shared/api";
import type { DataCategory, Category } from "./types";

export const getCategories = () =>
  apiFetch<DataCategory>("/category");

export const createCategory = (data: Omit<Category, "id">) =>
  apiFetch<Category>("/category", {
    method: "POST",
    body: JSON.stringify(data),
  });
