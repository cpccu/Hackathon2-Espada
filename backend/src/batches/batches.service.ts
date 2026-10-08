import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import {
  CreateBatchDto,
  QueryBatchesDto,
  UpdateBatchDto,
} from "./dto/index.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves batches filtered by departmentId and active status.
   * Public users / students receive only active batches.
   * Admins can inspect active or inactive batches.
   */
  async findAll(query?: QueryBatchesDto, user?: AuthenticatedUser) {
    const isAdminOrResourceAdmin =
      user?.role === UserRole.ADMIN || user?.role === UserRole.RESOURCE_ADMIN;

    const where: {
      departmentId?: string;
      isActive?: boolean;
    } = {};

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (!isAdminOrResourceAdmin) {
      where.isActive = true;
    } else if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.batch.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { batchNumber: "asc" },
    });
  }

  /**
   * Retrieves a single batch by UUID.
   */
  async findById(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID "${id}" not found`);
    }

    return batch;
  }

  /**
   * Creates a new academic batch under a department.
   * Enforces department existence/active status and department-scoped batchNumber uniqueness.
   */
  async create(dto: CreateBatchDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department || !department.isActive) {
      throw new BadRequestException("Department does not exist or is inactive");
    }

    const existing = await this.prisma.batch.findUnique({
      where: {
        departmentId_batchNumber: {
          departmentId: dto.departmentId,
          batchNumber: dto.batchNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Batch ${dto.batchNumber} already exists in ${department.code}`,
      );
    }

    return this.prisma.batch.create({
      data: {
        departmentId: dto.departmentId,
        batchNumber: dto.batchNumber,
        isActive: dto.isActive ?? true,
      },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Updates an existing batch (batchNumber or active status).
   * Validates department-scoped uniqueness if batchNumber changes.
   */
  async update(id: string, dto: UpdateBatchDto) {
    const existing = await this.prisma.batch.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!existing) {
      throw new NotFoundException(`Batch with ID "${id}" not found`);
    }

    if (
      dto.batchNumber !== undefined &&
      dto.batchNumber !== existing.batchNumber
    ) {
      const duplicate = await this.prisma.batch.findUnique({
        where: {
          departmentId_batchNumber: {
            departmentId: existing.departmentId,
            batchNumber: dto.batchNumber,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Batch ${dto.batchNumber} already exists in ${existing.department.code}`,
        );
      }
    }

    return this.prisma.batch.update({
      where: { id },
      data: {
        ...(dto.batchNumber !== undefined && { batchNumber: dto.batchNumber }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Soft-deactivates a batch rather than deleting historical records.
   */
  async deactivate(id: string) {
    const existing = await this.prisma.batch.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Batch with ID "${id}" not found`);
    }

    return this.prisma.batch.update({
      where: { id },
      data: { isActive: false },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }
}
