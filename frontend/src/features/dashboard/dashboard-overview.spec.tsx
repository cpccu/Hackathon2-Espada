import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardOverview } from "./dashboard-overview";
import { useAuth } from "@/features/auth";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

describe("DashboardOverview", () => {
  it("renders department name and code exactly once when name already includes the code in parentheses", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "u-1",
        name: "Rafid",
        email: "rafid@campusos.dev",
        role: "STUDENT",
        studentId: "CSE-101",
        batch: "67",
        section: "A",
        department: {
          id: "dept-1",
          name: "Department of Computer Science & Engineering (CSE)",
          code: "CSE",
        },
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        avatarUrl: null,
        isActive: true,
      },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<DashboardOverview />);

    // Should NOT have duplicate "(CSE) (CSE)"
    expect(
      screen.getByText("Department of Computer Science & Engineering (CSE)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Department of Computer Science & Engineering \(CSE\) \(CSE\)/),
    ).not.toBeInTheDocument();
  });

  it("appends department code when department name does not already include it", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "u-2",
        name: "Sadia",
        email: "sadia@campusos.dev",
        role: "STUDENT",
        studentId: "ME-102",
        batch: "66",
        section: "B",
        department: {
          id: "dept-2",
          name: "Department of Mechanical Engineering",
          code: "ME",
        },
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        avatarUrl: null,
        isActive: true,
      },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<DashboardOverview />);

    expect(
      screen.getByText("Department of Mechanical Engineering (ME)"),
    ).toBeInTheDocument();
  });
});
