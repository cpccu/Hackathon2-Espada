import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { UserRole } from "../generated/prisma/client.js";
import { BatchesService } from "./batches.service.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("BatchesService", () => {
  let service: BatchesService;
  let prismaMock: {
    batch: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    department: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  const adminUser: AuthenticatedUser = {
    id: "admin-uuid",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
  };

  const studentUser: AuthenticatedUser = {
    id: "student-uuid",
    email: "student@campusos.dev",
    role: UserRole.STUDENT,
  };

  const mockDepartment = {
    id: "dept-cse-id",
    code: "CSE",
    name: "Computer Science & Engineering",
    isActive: true,
  };

  const mockBatch = {
    id: "batch-67-id",
    departmentId: "dept-cse-id",
    batchNumber: 67,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    department: {
      id: "dept-cse-id",
      code: "CSE",
      name: "Computer Science & Engineering",
    },
  };

  beforeEach(async () => {
    prismaMock = {
      batch: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      department: {
        findUnique: vi.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BatchesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = moduleRef.get<BatchesService>(BatchesService);
  });

  describe("findAll", () => {
    it("returns active batches only for students/guests", async () => {
      prismaMock.batch.findMany.mockResolvedValue([mockBatch]);

      const result = await service.findAll(
        { departmentId: "dept-cse-id" },
        studentUser,
      );

      expect(prismaMock.batch.findMany).toHaveBeenCalledWith({
        where: {
          departmentId: "dept-cse-id",
          isActive: true,
        },
        include: {
          department: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: { batchNumber: "asc" },
      });
      expect(result).toHaveLength(1);
    });

    it("allows admin to inspect inactive batches", async () => {
      prismaMock.batch.findMany.mockResolvedValue([mockBatch]);

      await service.findAll(
        { departmentId: "dept-cse-id", isActive: false },
        adminUser,
      );

      expect(prismaMock.batch.findMany).toHaveBeenCalledWith({
        where: {
          departmentId: "dept-cse-id",
          isActive: false,
        },
        include: {
          department: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: { batchNumber: "asc" },
      });
    });
  });

  describe("findById", () => {
    it("returns batch by id", async () => {
      prismaMock.batch.findUnique.mockResolvedValue(mockBatch);

      const result = await service.findById("batch-67-id");
      expect(result.id).toBe("batch-67-id");
      expect(result.batchNumber).toBe(67);
    });

    it("throws NotFoundException if batch does not exist", async () => {
      prismaMock.batch.findUnique.mockResolvedValue(null);

      await expect(service.findById("unknown-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("creates a batch successfully", async () => {
      prismaMock.department.findUnique.mockResolvedValue(mockDepartment);
      prismaMock.batch.findUnique.mockResolvedValue(null);
      prismaMock.batch.create.mockResolvedValue(mockBatch);

      const result = await service.create({
        departmentId: "dept-cse-id",
        batchNumber: 67,
      });

      expect(result.batchNumber).toBe(67);
      expect(prismaMock.batch.create).toHaveBeenCalledWith({
        data: {
          departmentId: "dept-cse-id",
          batchNumber: 67,
          isActive: true,
        },
        include: expect.any(Object),
      });
    });

    it("throws BadRequestException if department does not exist", async () => {
      prismaMock.department.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          departmentId: "dept-unknown",
          batchNumber: 67,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException if department is inactive", async () => {
      prismaMock.department.findUnique.mockResolvedValue({
        ...mockDepartment,
        isActive: false,
      });

      await expect(
        service.create({
          departmentId: "dept-cse-id",
          batchNumber: 67,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ConflictException if batch already exists in same department", async () => {
      prismaMock.department.findUnique.mockResolvedValue(mockDepartment);
      prismaMock.batch.findUnique.mockResolvedValue(mockBatch);

      await expect(
        service.create({
          departmentId: "dept-cse-id",
          batchNumber: 67,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("updates batchNumber if unique in department", async () => {
      prismaMock.batch.findUnique
        .mockResolvedValueOnce(mockBatch) // existing check
        .mockResolvedValueOnce(null); // uniqueness check
      prismaMock.batch.update.mockResolvedValue({
        ...mockBatch,
        batchNumber: 71,
      });

      const result = await service.update("batch-67-id", { batchNumber: 71 });
      expect(result.batchNumber).toBe(71);
    });

    it("throws ConflictException if new batchNumber duplicates within department", async () => {
      prismaMock.batch.findUnique
        .mockResolvedValueOnce(mockBatch) // existing check
        .mockResolvedValueOnce({ id: "another-batch-id", batchNumber: 70 }); // duplicate found

      await expect(
        service.update("batch-67-id", { batchNumber: 70 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("deactivate", () => {
    it("soft-deactivates batch by setting isActive = false", async () => {
      prismaMock.batch.findUnique.mockResolvedValue(mockBatch);
      prismaMock.batch.update.mockResolvedValue({
        ...mockBatch,
        isActive: false,
      });

      const result = await service.deactivate("batch-67-id");
      expect(result.isActive).toBe(false);
      expect(prismaMock.batch.update).toHaveBeenCalledWith({
        where: { id: "batch-67-id" },
        data: { isActive: false },
        include: expect.any(Object),
      });
    });

    it("throws NotFoundException if batch does not exist", async () => {
      prismaMock.batch.findUnique.mockResolvedValue(null);

      await expect(service.deactivate("unknown-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
