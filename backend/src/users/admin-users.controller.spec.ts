import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminUsersController } from "./admin-users.controller.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("AdminUsersController", () => {
  let controller: AdminUsersController;
  let serviceMock: any;

  const adminUser: AuthenticatedUser = {
    id: "admin-1",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    serviceMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      updateRole: vi.fn(),
      updateStatus: vi.fn(),
      getUserClubs: vi.fn(),
      assignClub: vi.fn(),
      removeClub: vi.fn(),
    };

    controller = new AdminUsersController(serviceMock);
  });

  it("delegates getUsers query to service", async () => {
    serviceMock.findAll.mockResolvedValue({ data: [], meta: {} });
    await controller.getUsers({ page: 1, limit: 10, search: "test" });
    expect(serviceMock.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: "test",
    });
  });

  it("delegates getUserById to service", async () => {
    serviceMock.findById.mockResolvedValue({ id: "user-1" });
    const result = await controller.getUserById("user-1");
    expect(serviceMock.findById).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ id: "user-1" });
  });

  it("delegates updateUserRole to service", async () => {
    serviceMock.updateRole.mockResolvedValue({
      id: "user-1",
      role: UserRole.CLUB_ADMIN,
    });
    await controller.updateUserRole(
      "user-1",
      { role: UserRole.CLUB_ADMIN },
      adminUser,
    );
    expect(serviceMock.updateRole).toHaveBeenCalledWith(
      "user-1",
      { role: UserRole.CLUB_ADMIN },
      adminUser,
    );
  });

  it("delegates updateUserStatus to service", async () => {
    serviceMock.updateStatus.mockResolvedValue({
      id: "user-1",
      isActive: false,
    });
    await controller.updateUserStatus("user-1", { isActive: false }, adminUser);
    expect(serviceMock.updateStatus).toHaveBeenCalledWith(
      "user-1",
      { isActive: false },
      adminUser,
    );
  });

  it("delegates getUserClubs to service", async () => {
    serviceMock.getUserClubs.mockResolvedValue([]);
    await controller.getUserClubs("user-1");
    expect(serviceMock.getUserClubs).toHaveBeenCalledWith("user-1");
  });

  it("delegates assignUserClub to service", async () => {
    serviceMock.assignClub.mockResolvedValue({ id: "assign-1" });
    await controller.assignUserClub("user-1", { clubId: "club-1" }, adminUser);
    expect(serviceMock.assignClub).toHaveBeenCalledWith(
      "user-1",
      { clubId: "club-1" },
      adminUser,
    );
  });

  it("delegates removeUserClub to service", async () => {
    serviceMock.removeClub.mockResolvedValue({ message: "removed" });
    await controller.removeUserClub("user-1", "club-1");
    expect(serviceMock.removeClub).toHaveBeenCalledWith("user-1", "club-1");
  });
});
