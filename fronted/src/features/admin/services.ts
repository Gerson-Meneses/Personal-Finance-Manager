import { apiFetch } from "../../shared/api";
import type { AdminUsersResponse, AdminUser } from "./types";

export async function getUsers(): Promise<AdminUser[]> {
  const res = await apiFetch<AdminUsersResponse>("/user");
  return res.users;
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch<{ message: string }>(`/user/${id}`, { method: "DELETE" });
}
