import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminUsersView } from "./admin-users-view";
import * as authHook from "@/features/auth";
import * as deptApi from "@/features/auth/api/departments-api";
import { clubsApi } from "@/features/clubs/api/clubs-api";
import type { Club, PaginatedResponse } from "@/features/clubs/types";
import * as adminUsersApi from "../api/admin-users-api";
import { UserRole } from "@/types";
import type { AdminUser } from "../types";

const mockAdminUser = {
  id: "admin-1",
  name: "Master Admin",
  email: "admin@campusos.dev",
  role: UserRole.ADMIN,
  studentId: null,
  batchId: null,
  batch: null,
  section: null,
  avatarUrl: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockDepartments = [
  { id: "dept-1", code: "CSE", name: "Computer Science & Engineering" },
  { id: "dept-2", code: "EEE", name: "Electrical & Electronic Engineering" },
];

const mockClubs = [
  {
    id: "club-1",
    name: "Computer Club",
    slug: "computer-club",
    description: "Tech club",
    logoUrl: null,
    bannerUrl: null,
    category: "Technology",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "club-2",
    name: "Robotics Club",
    slug: "robotics-club",
    description: "Robotics and hardware",
    logoUrl: null,
    bannerUrl: null,
    category: "Robotics",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const mockUsersList: AdminUser[] = [
  {
    id: "admin-1",
    name: "Master Admin",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
    studentId: null,
    batchId: null,
    batch: null,
    section: null,
    avatarUrl: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "student-1",
    name: "Alice Student",
    email: "alice@campusos.dev",
    role: UserRole.STUDENT,
    studentId: "CSE-2023-001",
    batchId: "batch-67",
    batch: "67",
    batchDetails: { id: "batch-67", batchNumber: 67 },
    section: "A",
    avatarUrl: null,
    isActive: true,
    department: { id: "dept-1", code: "CSE", name: "Computer Science & Engineering" },
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "club-admin-1",
    name: "Bob Club Admin",
    email: "bob@campusos.dev",
    role: UserRole.CLUB_ADMIN,
    studentId: "CSE-2023-002",
    batchId: "batch-67",
    batch: "67",
    batchDetails: { id: "batch-67", batchNumber: 67 },
    section: "B",
    avatarUrl: null,
    isActive: true,
    department: { id: "dept-1", code: "CSE", name: "Computer Science & Engineering" },
    clubAdminAssignments: [
      {
        id: "assign-1",
        clubId: "club-1",
        assignedAt: "2026-01-03T00:00:00.000Z",
        club: {
          id: "club-1",
          name: "Computer Club",
          slug: "computer-club",
          logoUrl: null,
          isActive: true,
        },
      },
    ],
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
];

describe("AdminUsersView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(deptApi, "getDepartments").mockResolvedValue(mockDepartments);
    vi.spyOn(clubsApi, "getClubs").mockResolvedValue({
      data: mockClubs,
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    } as unknown as PaginatedResponse<Club>);

    vi.spyOn(adminUsersApi, "getAdminUsers").mockResolvedValue({
      data: mockUsersList,
      meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
    });
  });

  it("renders user table with user information and role badges", async () => {
    render(<AdminUsersView />);

    expect(screen.getByText("Loading university users...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
      expect(screen.getByText("Master Admin")).toBeInTheDocument();
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
      expect(screen.getByText("Bob Club Admin")).toBeInTheDocument();
    });

    // Check role badges
    expect(screen.getByText("System Admin")).toBeInTheDocument();
    expect(screen.getByText("Club Admin")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();

    // Check department and batch formatting without raw UUIDs
    expect(screen.getAllByText("CSE - Computer Science & Engineering").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Batch 67/).length).toBeGreaterThan(0);
  });

  it("supports searching with a single clear button", async () => {
    const getAdminUsersSpy = vi.spyOn(adminUsersApi, "getAdminUsers");

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by name, email, or student ID...",
    );

    // Initially clear button is NOT rendered
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();

    // Type query
    fireEvent.change(searchInput, { target: { value: "alice" } });

    // Single clear button appears
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();

    // Submit search
    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    await waitFor(() => {
      expect(getAdminUsersSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "alice" }),
      );
    });

    // Click clear button
    fireEvent.click(clearButton);

    // Input should be empty and clear button disappears
    expect(searchInput).toHaveValue("");
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getAdminUsersSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(getAdminUsersSpy.mock.lastCall?.[0]?.search).toBeUndefined();
    });
  });

  it("filters users by role and department", async () => {
    const getAdminUsersSpy = vi.spyOn(adminUsersApi, "getAdminUsers");

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
    });

    // Filter by role
    const roleSelect = screen.getByLabelText("Filter by Role");
    fireEvent.change(roleSelect, { target: { value: UserRole.CLUB_ADMIN } });

    await waitFor(() => {
      expect(getAdminUsersSpy).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CLUB_ADMIN }),
      );
    });

    // Filter by department
    const deptSelect = screen.getByLabelText("Filter by Department");
    fireEvent.change(deptSelect, { target: { value: "dept-1" } });

    await waitFor(() => {
      expect(getAdminUsersSpy).toHaveBeenCalledWith(
        expect.objectContaining({ departmentId: "dept-1" }),
      );
    });
  });

  it("opens management dialog and prevents self-demotion / self-deactivation", async () => {
    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Master Admin")).toBeInTheDocument();
    });

    // Click Manage on self (Master Admin is first row)
    const manageButtons = screen.getAllByRole("button", { name: /Manage/i });
    fireEvent.click(manageButtons[0]);

    // Dialog opens
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("User Details & Management")).toBeInTheDocument();
    });

    // Shows self-modification warning
    expect(
      screen.getByText(/You cannot modify your own role/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You cannot deactivate your own administrative account/),
    ).toBeInTheDocument();

    // Update Role button should be disabled
    const updateRoleBtn = screen.getByRole("button", { name: /Update Role/i });
    expect(updateRoleBtn).toBeDisabled();

    // Close dialog
    fireEvent.click(screen.getByLabelText("Close dialog"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("allows updating another user's role", async () => {
    const updateRoleSpy = vi
      .spyOn(adminUsersApi, "updateUserRole")
      .mockResolvedValue({
        ...mockUsersList[1],
        role: UserRole.RESOURCE_ADMIN,
      });

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
    });

    // Click Manage on Alice Student (second row)
    const manageButtons = screen.getAllByRole("button", { name: /Manage/i });
    fireEvent.click(manageButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Select new role
    const roleSelect = screen.getByLabelText("Select User Role");
    fireEvent.change(roleSelect, { target: { value: UserRole.RESOURCE_ADMIN } });

    const updateRoleBtn = screen.getByRole("button", { name: /Update Role/i });
    expect(updateRoleBtn).not.toBeDisabled();
    fireEvent.click(updateRoleBtn);

    await waitFor(() => {
      expect(updateRoleSpy).toHaveBeenCalledWith("student-1", UserRole.RESOURCE_ADMIN);
      expect(
        screen.getByText(/Role successfully updated to RESOURCE_ADMIN/),
      ).toBeInTheDocument();
    });
  });

  it("allows deactivating and activating another user with confirmation", async () => {
    const updateStatusSpy = vi
      .spyOn(adminUsersApi, "updateUserStatus")
      .mockResolvedValue({
        ...mockUsersList[1],
        isActive: false,
      });

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
    });

    const manageButtons = screen.getAllByRole("button", { name: /Manage/i });
    fireEvent.click(manageButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Click Deactivate button (initial step)
    const deactivateBtn = screen.getByRole("button", { name: /Deactivate/i });
    fireEvent.click(deactivateBtn);

    // Confirmation appears
    expect(screen.getByText(/Confirm Deactivation/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /Yes, Deactivate/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateStatusSpy).toHaveBeenCalledWith("student-1", false);
      expect(
        screen.getByText(/User account deactivated and all active sessions were revoked/),
      ).toBeInTheDocument();
    });
  });

  it("handles club admin assignments and removals for CLUB_ADMIN users", async () => {
    vi.spyOn(adminUsersApi, "getUserClubs").mockResolvedValue([
      {
        id: "assign-1",
        clubId: "club-1",
        assignedAt: "2026-01-03T00:00:00.000Z",
        club: {
          id: "club-1",
          name: "Computer Club",
          slug: "computer-club",
          logoUrl: null,
          isActive: true,
        },
      },
    ]);

    const assignClubSpy = vi
      .spyOn(adminUsersApi, "assignUserClub")
      .mockResolvedValue({
        id: "assign-2",
        clubId: "club-2",
        assignedAt: "2026-01-04T00:00:00.000Z",
        club: {
          id: "club-2",
          name: "Robotics Club",
          slug: "robotics-club",
          logoUrl: null,
          isActive: true,
        },
      });

    const removeClubSpy = vi
      .spyOn(adminUsersApi, "removeUserClub")
      .mockResolvedValue({
        message: "Assignment removed",
        userId: "club-admin-1",
        clubId: "club-1",
      });

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Bob Club Admin")).toBeInTheDocument();
    });

    // Click Manage on Bob Club Admin (third row)
    const manageButtons = screen.getAllByRole("button", { name: /Manage/i });
    fireEvent.click(manageButtons[2]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Computer Club")).toBeInTheDocument();
    });

    // Remove existing club assignment
    const removeBtn = screen.getByLabelText("Remove assignment for Computer Club");
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(removeClubSpy).toHaveBeenCalledWith("club-admin-1", "club-1");
      expect(
        screen.getByText(/Removed assignment from Computer Club/),
      ).toBeInTheDocument();
    });

    // Assign new club
    const clubSelect = screen.getByLabelText("Assign to Another Club");
    fireEvent.change(clubSelect, { target: { value: "club-2" } });

    const assignBtn = screen.getByRole("button", { name: /Assign Club/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(assignClubSpy).toHaveBeenCalledWith("club-admin-1", "club-2");
      expect(
        screen.getByText(/Successfully assigned to Robotics Club/),
      ).toBeInTheDocument();
    });
  });

  it("renders empty state when no users are found", async () => {
    vi.spyOn(adminUsersApi, "getAdminUsers").mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });
  });

  it("renders error state when user loading fails", async () => {
    vi.spyOn(adminUsersApi, "getAdminUsers").mockRejectedValue(
      new Error("Network connection failure"),
    );

    render(<AdminUsersView />);

    await waitFor(() => {
      expect(screen.getByText("Failed to Load Users")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
    });
  });
});
