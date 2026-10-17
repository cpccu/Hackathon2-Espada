import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("UsersService", () => {
  let service: UsersService;
  let prismaMock: any;

  const currentAdmin: AuthenticatedUser = {
    id: "admin-1",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
  };

  const mockUser = {
    id: "user-1",
    name: "Rafid Hasan",
    email: "rafid@campusos.dev",
    passwordHash: "super-secret-hash",
    studentId: "CSE-2023-142",
    batchId: "batch-1",
    section: "A",
    role: UserRole.STUDENT,
    avatarUrl: null,
    isActive: true,
    departmentId: "dept-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    department: {
      id: "dept-1",
      name: "Computer Science & Engineering",
      code: "CSE",
    },
    batch: {
      id: "batch-1",
      batchNumber: 67,
    },
    clubAdminAssignments: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    prismaMock = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      club: {
        findUnique: vi.fn(),
      },
      clubAdminAssignment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      refreshTokenSession: {
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn((cb: (tx: any) => Promise<any>) => cb(prismaMock)),
    };

    service = new UsersService(prismaMock);
  });

  describe("findAll", () => {
    it("returns paginated and sanitized list of users without passwordHash", async () => {
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: "rafid",
        role: UserRole.STUDENT,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("user-1");
      expect(result.data[0].email).toBe("rafid@campusos.dev");
      expect(result.data[0].batch).toBe("67");
      expect((result.data[0] as any).passwordHash).toBeUndefined();
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.STUDENT,
            OR: expect.arrayContaining([
              { name: { contains: "rafid", mode: "insensitive" } },
            ]),
          }),
        }),
      );
    });
  });

  describe("findById", () => {
    it("returns safe user details if user exists", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById("user-1");
      expect(result.id).toBe("user-1");
      expect(result.name).toBe("Rafid Hasan");
      expect((result as any).passwordHash).toBeUndefined();
    });

    it("throws NotFoundException if user is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.findById("unknown-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateRole", () => {
    it("updates role successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        role: UserRole.RESOURCE_ADMIN,
      });

      const result = await service.updateRole(
        "user-1",
        { role: UserRole.RESOURCE_ADMIN },
        currentAdmin,
      );

      expect(result.role).toBe(UserRole.RESOURCE_ADMIN);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it("prevents admin from demoting their own account", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: "admin-1",
        role: UserRole.ADMIN,
      });

      await expect(
        service.updateRole("admin-1", { role: UserRole.STUDENT }, currentAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it("prevents demoting the last active admin on the platform", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: "other-admin",
        role: UserRole.ADMIN,
        isActive: true,
      });
      prismaMock.user.count.mockResolvedValue(1); // Only 1 active admin exists

      await expect(
        service.updateRole(
          "other-admin",
          { role: UserRole.STUDENT },
          currentAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("safely cleans up club assignments when role changes away from CLUB_ADMIN", async () => {
      const clubAdminUser = {
        ...mockUser,
        id: "club-admin-1",
        role: UserRole.CLUB_ADMIN,
      };

      prismaMock.user.findUnique.mockResolvedValue(clubAdminUser);
      prismaMock.user.update.mockResolvedValue({
        ...clubAdminUser,
        role: UserRole.STUDENT,
      });

      await service.updateRole(
        "club-admin-1",
        { role: UserRole.STUDENT },
        currentAdmin,
      );

      expect(prismaMock.clubAdminAssignment.deleteMany).toHaveBeenCalledWith({
        where: { userId: "club-admin-1" },
      });
    });
  });

  describe("updateStatus", () => {
    it("activates or deactivates user successfully and revokes sessions on deactivation", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.updateStatus(
        "user-1",
        { isActive: false },
        currentAdmin,
      );

      expect(result.isActive).toBe(false);
      expect(prismaMock.refreshTokenSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
    });

    it("prevents administrator from deactivating their own account", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: "admin-1",
        role: UserRole.ADMIN,
      });

      await expect(
        service.updateStatus("admin-1", { isActive: false }, currentAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it("prevents deactivating the last active admin on the platform", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: "other-admin",
        role: UserRole.ADMIN,
        isActive: true,
      });
      prismaMock.user.count.mockResolvedValue(1);

      await expect(
        service.updateStatus("other-admin", { isActive: false }, currentAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Club Admin Assignment Management", () => {
    const mockClub = {
      id: "club-1",
      name: "Robotics Society",
      slug: "robotics-society",
      isActive: true,
    };

    const activeClubAdmin = {
      ...mockUser,
      id: "ca-1",
      role: UserRole.CLUB_ADMIN,
      isActive: true,
    };

    it("assigns active CLUB_ADMIN to an active club successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(activeClubAdmin);
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue(null);
      prismaMock.clubAdminAssignment.create.mockResolvedValue({
        id: "assign-1",
        userId: "ca-1",
        clubId: "club-1",
        club: mockClub,
      });

      const result = await service.assignClub(
        "ca-1",
        { clubId: "club-1" },
        currentAdmin,
      );

      expect(result.id).toBe("assign-1");
      expect(prismaMock.clubAdminAssignment.create).toHaveBeenCalledWith({
        data: {
          userId: "ca-1",
          clubId: "club-1",
          assignedBy: "admin-1",
        },
        include: expect.any(Object),
      });
    });

    it("rejects assignment if target user is inactive", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...activeClubAdmin,
        isActive: false,
      });

      await expect(
        service.assignClub("ca-1", { clubId: "club-1" }, currentAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects assignment if target user does not have CLUB_ADMIN role", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...activeClubAdmin,
        role: UserRole.STUDENT,
      });

      await expect(
        service.assignClub("ca-1", { clubId: "club-1" }, currentAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects assignment if target club is inactive", async () => {
      prismaMock.user.findUnique.mockResolvedValue(activeClubAdmin);
      prismaMock.club.findUnique.mockResolvedValue({
        ...mockClub,
        isActive: false,
      });

      await expect(
        service.assignClub("ca-1", { clubId: "club-1" }, currentAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects duplicate club assignment with ConflictException", async () => {
      prismaMock.user.findUnique.mockResolvedValue(activeClubAdmin);
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        id: "existing-assign",
      });

      await expect(
        service.assignClub("ca-1", { clubId: "club-1" }, currentAdmin),
      ).rejects.toThrow(ConflictException);
    });

    it("removes club assignment successfully", async () => {
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        id: "assign-1",
        userId: "ca-1",
        clubId: "club-1",
      });
      prismaMock.clubAdminAssignment.delete.mockResolvedValue({});

      const result = await service.removeClub("ca-1", "club-1");
      expect(result.message).toContain("removed successfully");
      expect(prismaMock.clubAdminAssignment.delete).toHaveBeenCalledWith({
        where: {
          userId_clubId: {
            userId: "ca-1",
            clubId: "club-1",
          },
        },
      });
    });

    it("throws NotFoundException when removing non-existent assignment", async () => {
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue(null);

      await expect(service.removeClub("ca-1", "club-unknown")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
