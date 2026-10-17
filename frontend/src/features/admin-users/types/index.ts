import type { Department, UserRole } from "@/types";

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  contactEmail?: string | null;
  isActive: boolean;
}

export interface ClubAdminAssignmentItem {
  id: string;
  clubId: string;
  assignedAt: string;
  assignedBy?: string;
  club: ClubSummary;
  assignedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  batchId?: string | null;
  batch: string | null;
  batchDetails?: { id: string; batchNumber: number } | null;
  section: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  department?: Department | null;
  clubAdminAssignments?: ClubAdminAssignmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QueryAdminUsersParams {
  search?: string;
  role?: UserRole;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAdminUsersResponse {
  data: AdminUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
