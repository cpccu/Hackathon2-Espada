import { api } from "@/lib/api";
import type {
  AdminUser,
  ClubAdminAssignmentItem,
  PaginatedAdminUsersResponse,
  QueryAdminUsersParams,
} from "../types";
import type { UserRole } from "@/types";

export async function getAdminUsers(
  params?: QueryAdminUsersParams,
): Promise<PaginatedAdminUsersResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.departmentId) query.set("departmentId", params.departmentId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return api.get<PaginatedAdminUsersResponse>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export async function getAdminUserById(id: string): Promise<AdminUser> {
  return api.get<AdminUser>(`/admin/users/${id}`);
}

export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<AdminUser> {
  return api.patch<AdminUser>(`/admin/users/${id}/role`, { role });
}

export async function updateUserStatus(
  id: string,
  isActive: boolean,
): Promise<AdminUser> {
  return api.patch<AdminUser>(`/admin/users/${id}/status`, { isActive });
}

export async function getUserClubs(
  id: string,
): Promise<ClubAdminAssignmentItem[]> {
  return api.get<ClubAdminAssignmentItem[]>(`/admin/users/${id}/clubs`);
}

export async function assignUserClub(
  id: string,
  clubId: string,
): Promise<ClubAdminAssignmentItem> {
  return api.post<ClubAdminAssignmentItem>(`/admin/users/${id}/clubs`, { clubId });
}

export async function removeUserClub(
  id: string,
  clubId: string,
): Promise<{ message: string; userId: string; clubId: string }> {
  return api.delete<{ message: string; userId: string; clubId: string }>(
    `/admin/users/${id}/clubs/${clubId}`,
  );
}
