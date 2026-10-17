import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AdminUsersPage from "./page";
import * as authHook from "@/features/auth";
import { UserRole } from "@/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/dashboard/admin/users",
}));

vi.mock("@/features/admin-users", () => ({
  AdminUsersView: () => <div data-testid="admin-users-view">Admin Users View Content</div>,
}));

vi.mock("@/components/layout", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/components/layout",
  );
  return {
    ...actual,
    DashboardShell: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dashboard-shell">{children}</div>
    ),
  };
});

describe("AdminUsersPage Route Authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it("renders AdminUsersView when authenticated as ADMIN", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "admin-1",
        name: "Admin User",
        email: "admin@campusos.dev",
        role: UserRole.ADMIN,
        studentId: null,
        batch: null,
        section: null,
        avatarUrl: null,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.getByTestId("admin-users-view")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects STUDENT user to /dashboard and denies access", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "student-1",
        name: "Student User",
        email: "student@campusos.dev",
        role: UserRole.STUDENT,
        studentId: "CSE-2023-001",
        batch: "67",
        section: "A",
        avatarUrl: null,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.queryByTestId("admin-users-view")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects CLUB_ADMIN user to /dashboard and denies access", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "club-admin-1",
        name: "Club Admin User",
        email: "clubadmin@campusos.dev",
        role: UserRole.CLUB_ADMIN,
        studentId: null,
        batch: null,
        section: null,
        avatarUrl: null,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.queryByTestId("admin-users-view")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects RESOURCE_ADMIN user to /dashboard and denies access", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "res-admin-1",
        name: "Resource Admin User",
        email: "resadmin@campusos.dev",
        role: UserRole.RESOURCE_ADMIN,
        studentId: null,
        batch: null,
        section: null,
        avatarUrl: null,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.queryByTestId("admin-users-view")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects unauthenticated visitor to /login", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.queryByTestId("admin-users-view")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
