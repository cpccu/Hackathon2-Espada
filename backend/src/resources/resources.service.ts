import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { ResourceType, UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";
import {
  CreateResourceDto,
  QueryResourcesDto,
  UpdateResourceDto,
} from "./dto/index.js";

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a resource entity into a consistent API response
   * providing both `resourceType` and `type`, plus uploader aliases and batchDetails.
   */
  private formatResource<
    T extends {
      resourceType: ResourceType;
      batchId?: string | null;
      batch?:
        | { id: string; batchNumber: number; departmentId?: string }
        | string
        | null;
      uploadedByUser?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      } | null;
    },
  >(resource: T) {
    const { uploadedByUser, batch, ...rest } = resource;
    const uploader = uploadedByUser
      ? {
          id: uploadedByUser.id,
          name: uploadedByUser.name,
          fullName: uploadedByUser.name,
          email: uploadedByUser.email,
          role: uploadedByUser.role,
        }
      : undefined;

    const batchDetails =
      batch && typeof batch === "object" && "batchNumber" in batch
        ? { id: batch.id, batchNumber: batch.batchNumber }
        : null;

    const batchString =
      batchDetails !== null
        ? String(batchDetails.batchNumber)
        : typeof batch === "string"
          ? batch
          : null;

    return {
      ...rest,
      batchId: resource.batchId ?? batchDetails?.id ?? null,
      batch: batchString,
      batchDetails,
      type: resource.resourceType,
      uploadedByUser: uploader,
      uploader,
    };
  }

  /**
   * List resources with search, filters, and pagination.
   * Public/student requests strictly receive published resources only.
   * Admin / Resource Admin can filter by `isPublished` or see all if unconstrained.
   */
  async findAll(query: QueryResourcesDto, user?: AuthenticatedUser) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(Number(query.limit), 50) : 10;
    const skip = (page - 1) * limit;

    const isAdminOrResourceAdmin =
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.RESOURCE_ADMIN);

    const where: {
      isPublished?: boolean;
      courseId?: string;
      resourceType?: ResourceType;
      batchId?: string;
      batch?: { batchNumber: number };
      section?: string;
      course?: {
        semester?: number;
        departmentId?: string;
      };
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
        fileName?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (!isAdminOrResourceAdmin) {
      where.isPublished = true;
    } else if (query.isPublished !== undefined) {
      if (query.isPublished === true || query.isPublished === "true") {
        where.isPublished = true;
      } else if (query.isPublished === false || query.isPublished === "false") {
        where.isPublished = false;
      }
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    const typeFilter = query.resourceType || query.type;
    if (typeFilter) {
      where.resourceType = typeFilter;
    }

    if (query.batchId) {
      where.batchId = query.batchId;
    } else if (query.batch) {
      const batchNum = parseInt(query.batch, 10);
      if (!isNaN(batchNum)) {
        where.batch = { batchNumber: batchNum };
      }
    }

    if (query.section) {
      where.section = query.section;
    }

    if (query.semester !== undefined || query.departmentId) {
      where.course = {
        ...(query.semester !== undefined
          ? { semester: Number(query.semester) }
          : {}),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { fileName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, resources] = await Promise.all([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({
        where,
        include: {
          batch: {
            select: {
              id: true,
              batchNumber: true,
              departmentId: true,
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              semester: true,
              department: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          uploadedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: resources.map((r) => this.formatResource(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves active courses with department details for filtering.
   */
  async getCourses() {
    return this.prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        semester: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  /**
   * Retrieve a single resource by UUID.
   * If unpublished, only accessible by ADMIN or RESOURCE_ADMIN.
   */
  async findById(id: string, user?: AuthenticatedUser) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        batch: {
          select: {
            id: true,
            batchNumber: true,
            departmentId: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    const isAdminOrResourceAdmin =
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.RESOURCE_ADMIN);

    if (!resource.isPublished && !isAdminOrResourceAdmin) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    return this.formatResource(resource);
  }

  /**
   * Create a new resource.
   * UploadedBy is strictly set from the authenticated user.
   */
  async create(dto: CreateResourceDto, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { department: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${dto.courseId}" not found`);
    }

    let resolvedBatchId: string | null = null;
    if (dto.batchId) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: dto.batchId },
      });
      if (!batch || !batch.isActive) {
        throw new BadRequestException(
          "Selected batch does not exist or is inactive",
        );
      }
      if (batch.departmentId !== course.departmentId) {
        throw new BadRequestException(
          "Selected batch does not belong to the course's department",
        );
      }
      resolvedBatchId = batch.id;
    } else if (dto.batch) {
      const batchNum = parseInt(dto.batch.trim(), 10);
      if (!isNaN(batchNum)) {
        const batch = await this.prisma.batch.findUnique({
          where: {
            departmentId_batchNumber: {
              departmentId: course.departmentId,
              batchNumber: batchNum,
            },
          },
        });
        if (batch && batch.isActive) {
          resolvedBatchId = batch.id;
        }
      }
    }

    const resourceType = dto.resourceType || dto.type || ResourceType.NOTE;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : true;

    const resource = await this.prisma.resource.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description ?? null,
        resourceType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        batchId: resolvedBatchId,
        section: dto.section ?? null,
        uploadedBy: user.id,
        isPublished,
      },
      include: {
        batch: {
          select: {
            id: true,
            batchNumber: true,
            departmentId: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return this.formatResource(resource);
  }

  /**
   * Update an existing resource.
   * uploadedBy, id, and createdAt cannot be modified.
   */
  async update(id: string, dto: UpdateResourceDto) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!existing) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    let targetDepartmentId = existing.course.departmentId;

    if (dto.courseId && dto.courseId !== existing.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new NotFoundException(
          `Course with ID "${dto.courseId}" not found`,
        );
      }
      targetDepartmentId = course.departmentId;
    }

    const resourceType = dto.resourceType ?? dto.type;

    const dataToUpdate: {
      courseId?: string;
      title?: string;
      description?: string | null;
      resourceType?: ResourceType;
      fileName?: string;
      fileUrl?: string;
      fileSize?: number;
      mimeType?: string;
      batchId?: string | null;
      section?: string | null;
      isPublished?: boolean;
    } = {};

    if (dto.courseId) dataToUpdate.courseId = dto.courseId;
    if (dto.title !== undefined) dataToUpdate.title = dto.title;
    if (dto.description !== undefined)
      dataToUpdate.description = dto.description;
    if (resourceType !== undefined) dataToUpdate.resourceType = resourceType;
    if (dto.fileName !== undefined) dataToUpdate.fileName = dto.fileName;
    if (dto.fileUrl !== undefined) dataToUpdate.fileUrl = dto.fileUrl;
    if (dto.fileSize !== undefined) dataToUpdate.fileSize = dto.fileSize;
    if (dto.mimeType !== undefined) dataToUpdate.mimeType = dto.mimeType;
    if (dto.section !== undefined) dataToUpdate.section = dto.section;
    if (dto.isPublished !== undefined)
      dataToUpdate.isPublished = dto.isPublished;

    if (dto.batchId !== undefined) {
      if (dto.batchId === null || dto.batchId === "") {
        dataToUpdate.batchId = null;
      } else {
        const batch = await this.prisma.batch.findUnique({
          where: { id: dto.batchId },
        });
        if (!batch || !batch.isActive) {
          throw new BadRequestException(
            "Selected batch does not exist or is inactive",
          );
        }
        if (batch.departmentId !== targetDepartmentId) {
          throw new BadRequestException(
            "Selected batch does not belong to the course's department",
          );
        }
        dataToUpdate.batchId = batch.id;
      }
    } else if (dto.batch !== undefined) {
      const trimmed = dto.batch.trim();
      if (!trimmed) {
        dataToUpdate.batchId = null;
      } else {
        const batchNum = parseInt(trimmed, 10);
        if (!isNaN(batchNum)) {
          const batch = await this.prisma.batch.findUnique({
            where: {
              departmentId_batchNumber: {
                departmentId: targetDepartmentId,
                batchNumber: batchNum,
              },
            },
          });
          if (batch && batch.isActive) {
            dataToUpdate.batchId = batch.id;
          }
        }
      }
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: dataToUpdate,
      include: {
        batch: {
          select: {
            id: true,
            batchNumber: true,
            departmentId: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return this.formatResource(updated);
  }

  /**
   * Soft-deactivates a resource by setting isPublished = false.
   */
  async remove(id: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    const deactivated = await this.prisma.resource.update({
      where: { id },
      data: { isPublished: false },
      include: {
        batch: {
          select: {
            id: true,
            batchNumber: true,
            departmentId: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return this.formatResource(deactivated);
  }

  /**
   * Publish a resource.
   */
  async publish(id: string) {
    return this.update(id, { isPublished: true });
  }

  /**
   * Unpublish a resource.
   */
  async unpublish(id: string) {
    return this.update(id, { isPublished: false });
  }
}
