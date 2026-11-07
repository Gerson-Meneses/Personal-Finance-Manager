export interface AdminUser {
  id: string;
  name: string;
  birthDate: string;
  phone: number | string;
  country: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  is_verified: boolean;
  deletedAt: string | null;
  credential: {
    id: string;
    email: string;
  } | null;
}

export interface AdminUsersResponse {
  message: string;
  users: AdminUser[];
}
