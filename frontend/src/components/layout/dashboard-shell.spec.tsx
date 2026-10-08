import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DashboardShell } from "./dashboard-shell";
import * as authHook from "@/features/auth";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("DashboardShell Role-Based Navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Batch Management link for ADMIN users", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "admin-1",
        name: "Admin User",
        email: "admin@campusos.dev",
        role: "ADMIN",
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

    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Batch Management")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Batch Management/i });
    expect(link).toHaveAttribute("href", "/dashboard/batches");
  });

  it("renders Batch Management link for RESOURCE_ADMIN users", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "res-admin-1",
        name: "Resource Admin",
        email: "resadmin@campusos.dev",
        role: "RESOURCE_ADMIN",
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

    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Batch Management")).toBeInTheDocument();
  });

  it("does NOT render Batch Management link for STUDENT users", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "student-1",
        name: "Student User",
        email: "student@campusos.dev",
        role: "STUDENT",
        studentId: "CSE-2023-142",
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

    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );

    expect(screen.queryByText("Batch Management")).not.toBeInTheDocument();
  });

  it("does NOT render Batch Management link for CLUB_ADMIN users", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "club-admin-1",
        name: "Club Admin User",
        email: "clubadmin@campusos.dev",
        role: "CLUB_ADMIN",
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

    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );

    expect(screen.queryByText("Batch Management")).not.toBeInTheDocument();
  });
});
