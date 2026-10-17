import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";
import {
  AssignUserClubDto,
  QueryUsersDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from "./dto/index.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a User entity into a safe response object,
   * guaranteeing no password hashes, refresh tokens, or secrets are exposed.
   */
  private toSafeUser<
    T extends {
      id: string;
      name: string;
      email: string;
      studentId: string | null;
      section: string | null;
      role: UserRole;
      avatarUrl: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      batchId?: string | null;
      batch?: { id: string; batchNumber: number } | null;
      department?: { id: string; name: string; code: string } | null;
      clubAdminAssignments?: Array<{
        id: string;
        clubId: string;
        assignedAt: Date;
        club: {
          id: string;
          name: string;
          slug: string;
          logoUrl: string | null;
          isActive: boolean;
        };
      }>;
    },
  >(user: T) {
    const batchDetails = user.batch
      ? { id: user.batch.id, batchNumber: user.batch.batchNumber }
      : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      batchId: user.batchId ?? batchDetails?.id ?? null,
      batch: batchDetails ? String(batchDetails.batchNumber) : null,
      batchDetails,
      section: user.section,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      department: user.department ?? null,
      clubAdminAssignments: user.clubAdminAssignments ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * List users with pagination, text search, role, and department filters.
   * ADMIN only.
   */
  async findAll(query: QueryUsersDto) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(Number(query.limit), 50) : 10;
    const skip = (page - 1) * limit;

    const where: {
      role?: UserRole;
      departmentId?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        studentId?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          batch: {
            select: { id: true, batchNumber: true },
          },
          clubAdminAssignments: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  isActive: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => this.toSafeUser(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find safe user details by UUID.
   * ADMIN only.
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        batch: {
          select: { id: true, batchNumber: true },
        },
        clubAdminAssignments: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isActive: true,
              },
            },
            assignedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toSafeUser(user);
  }

  /**
   * Change user role.
   * - Prevents demoting own account.
   * - Prevents removing the last active ADMIN.
   * - If changing from CLUB_ADMIN to another role, cleans up club assignments transactionally.
   */
  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    currentAdmin: AuthenticatedUser,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    // Prevent demoting own admin account
    if (id === currentAdmin.id && dto.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        "Administrators cannot demote their own account",
      );
    }

    // Prevent leaving the platform without an active ADMIN
    if (
      targetUser.role === UserRole.ADMIN &&
      dto.role !== UserRole.ADMIN &&
      targetUser.isActive
    ) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException(
          "Cannot remove the only active administrator",
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If user was CLUB_ADMIN and is changing to another role, clean up assignments
      if (
        targetUser.role === UserRole.CLUB_ADMIN &&
        dto.role !== UserRole.CLUB_ADMIN
      ) {
        await tx.clubAdminAssignment.deleteMany({
          where: { userId: id },
        });
      }

      return tx.user.update({
        where: { id },
        data: { role: dto.role },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          batch: {
            select: { id: true, batchNumber: true },
          },
          clubAdminAssignments: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });
    });

    return this.toSafeUser(updated);
  }

  /**
   * Activate or deactivate a user account.
   * - Prevents self-deactivation.
   * - Prevents deactivating the last active ADMIN.
   * - Revokes all active refresh sessions when deactivating.
   */
  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    currentAdmin: AuthenticatedUser,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    // Prevent self-deactivation
    if (id === currentAdmin.id && !dto.isActive) {
      throw new BadRequestException(
        "Administrators cannot deactivate their own account",
      );
    }

    // Prevent deactivating the last active ADMIN
    if (targetUser.role === UserRole.ADMIN && !dto.isActive) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException(
          "Cannot deactivate the only active administrator",
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If deactivating, revoke all active refresh token sessions immediately
      if (!dto.isActive) {
        await tx.refreshTokenSession.deleteMany({
          where: { userId: id },
        });
      }

      return tx.user.update({
        where: { id },
        data: { isActive: dto.isActive },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          batch: {
            select: { id: true, batchNumber: true },
          },
          clubAdminAssignments: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });
    });

    return this.toSafeUser(updated);
  }

  /**
   * Get all club assignments for a user.
   */
  async getUserClubs(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.clubAdminAssignment.findMany({
      where: { userId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            contactEmail: true,
            isActive: true,
          },
        },
        assignedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { assignedAt: "asc" },
    });
  }

  /**
   * Assign an active CLUB_ADMIN user to an active club.
   * ADMIN only.
   */
  async assignClub(
    userId: string,
    dto: AssignUserClubDto,
    currentAdmin: AuthenticatedUser,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    if (!targetUser.isActive) {
      throw new BadRequestException("User account is inactive");
    }

    if (targetUser.role !== UserRole.CLUB_ADMIN) {
      throw new BadRequestException(
        "User must have the CLUB_ADMIN role to be assigned to a club",
      );
    }

    const targetClub = await this.prisma.club.findUnique({
      where: { id: dto.clubId },
    });

    if (!targetClub) {
      throw new NotFoundException("Club not found");
    }

    if (!targetClub.isActive) {
      throw new BadRequestException("Club is inactive");
    }

    const existing = await this.prisma.clubAdminAssignment.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId: dto.clubId,
        },
      },
    });

    if (existing) {
      throw new ConflictException("User is already an admin of this club");
    }

    return this.prisma.clubAdminAssignment.create({
      data: {
        userId,
        clubId: dto.clubId,
        assignedBy: currentAdmin.id,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            contactEmail: true,
            isActive: true,
          },
        },
        assignedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Remove a club assignment from a user.
   * ADMIN only.
   */
  async removeClub(userId: string, clubId: string) {
    const assignment = await this.prisma.clubAdminAssignment.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Club assignment not found");
    }

    await this.prisma.clubAdminAssignment.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    return {
      message: "Club assignment removed successfully",
      userId,
      clubId,
    };
  }
}
