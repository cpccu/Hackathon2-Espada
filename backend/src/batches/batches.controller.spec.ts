import { Test } from "@nestjs/testing";
import { BatchesController } from "./batches.controller.js";
import { BatchesService } from "./batches.service.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("BatchesController", () => {
  let controller: BatchesController;
  let serviceMock: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
  };

  const adminUser: AuthenticatedUser = {
    id: "admin-uuid",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
  };

  const mockBatch = {
    id: "batch-67-id",
    departmentId: "dept-cse-id",
    batchNumber: 67,
    isActive: true,
  };

  beforeEach(async () => {
    serviceMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [BatchesController],
      providers: [
        {
          provide: BatchesService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get<BatchesController>(BatchesController);
  });

  it("delegates getBatches to BatchesService.findAll", async () => {
    serviceMock.findAll.mockResolvedValue([mockBatch]);

    const result = await controller.getBatches(
      { departmentId: "dept-cse-id" },
      adminUser,
    );
    expect(serviceMock.findAll).toHaveBeenCalledWith(
      { departmentId: "dept-cse-id" },
      adminUser,
    );
    expect(result).toEqual([mockBatch]);
  });

  it("delegates getBatch to BatchesService.findById", async () => {
    serviceMock.findById.mockResolvedValue(mockBatch);

    const result = await controller.getBatch("batch-67-id");
    expect(serviceMock.findById).toHaveBeenCalledWith("batch-67-id");
    expect(result).toEqual(mockBatch);
  });

  it("delegates createBatch to BatchesService.create", async () => {
    serviceMock.create.mockResolvedValue(mockBatch);

    const dto = { departmentId: "dept-cse-id", batchNumber: 67 };
    const result = await controller.createBatch(dto);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockBatch);
  });

  it("delegates updateBatch to BatchesService.update", async () => {
    serviceMock.update.mockResolvedValue({ ...mockBatch, batchNumber: 68 });

    const result = await controller.updateBatch("batch-67-id", {
      batchNumber: 68,
    });
    expect(serviceMock.update).toHaveBeenCalledWith("batch-67-id", {
      batchNumber: 68,
    });
    expect(result.batchNumber).toBe(68);
  });

  it("delegates deactivateBatch to BatchesService.deactivate", async () => {
    serviceMock.deactivate.mockResolvedValue({ ...mockBatch, isActive: false });

    const result = await controller.deactivateBatch("batch-67-id");
    expect(serviceMock.deactivate).toHaveBeenCalledWith("batch-67-id");
    expect(result.isActive).toBe(false);
  });
});
