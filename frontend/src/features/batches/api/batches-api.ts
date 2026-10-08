import { api } from "@/lib/api";
import type { Batch } from "@/types";
import type {
  CreateBatchDto,
  QueryBatchesParams,
  UpdateBatchDto,
} from "../types";

/**
 * Fetch academic batches filtered by departmentId and status.
 */
export async function getBatches(
  params?: QueryBatchesParams,
): Promise<Batch[]> {
  const query = new URLSearchParams();
  if (params?.departmentId) {
    query.set("departmentId", params.departmentId);
  }
  if (params?.isActive !== undefined) {
    query.set("isActive", String(params.isActive));
  }
  const queryString = query.toString();
  const endpoint = `/batches${queryString ? `?${queryString}` : ""}`;
  return api.get<Batch[]>(endpoint, { requiresAuth: false });
}

/**
 * Fetch a single batch by ID.
 */
export async function getBatchById(id: string): Promise<Batch> {
  return api.get<Batch>(`/batches/${id}`, { requiresAuth: false });
}

/**
 * Create a new academic batch under a department (Admin / Resource Admin).
 */
export async function createBatch(dto: CreateBatchDto): Promise<Batch> {
  return api.post<Batch>("/batches", dto);
}

/**
 * Update batch details (Admin / Resource Admin).
 */
export async function updateBatch(
  id: string,
  dto: UpdateBatchDto,
): Promise<Batch> {
  return api.patch<Batch>(`/batches/${id}`, dto);
}

/**
 * Soft-deactivate a batch (Admin / Resource Admin).
 */
export async function deactivateBatch(id: string): Promise<Batch> {
  return api.delete<Batch>(`/batches/${id}`);
}
