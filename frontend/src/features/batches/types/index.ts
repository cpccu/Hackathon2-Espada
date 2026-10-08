import type { Batch } from "@/types";

export type { Batch };

export interface CreateBatchDto {
  departmentId: string;
  batchNumber: number;
  isActive?: boolean;
}

export interface UpdateBatchDto {
  batchNumber?: number;
  isActive?: boolean;
}

export interface QueryBatchesParams {
  departmentId?: string;
  isActive?: boolean;
}
