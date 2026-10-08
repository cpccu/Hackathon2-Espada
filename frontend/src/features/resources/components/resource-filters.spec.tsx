import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResourceFilters } from "./resource-filters";

vi.mock("@/features/batches/api/batches-api", () => ({
  getBatches: vi.fn().mockResolvedValue([
    {
      id: "b-uuid-67",
      departmentId: "d-1",
      batchNumber: 67,
      isActive: true,
    },
    {
      id: "b-uuid-68",
      departmentId: "d-1",
      batchNumber: 68,
      isActive: true,
    },
  ]),
}));

vi.mock("../hooks/use-resource-courses", () => ({
  useResourceCourses: () => ({
    courses: [
      {
        id: "c-1",
        code: "CSE 2115",
        name: "Data Structures",
        department: { id: "d-1", code: "CSE", name: "Computer Science" },
      },
      {
        id: "c-2",
        code: "CSE 3101",
        name: "Database Systems",
        department: { id: "d-1", code: "CSE", name: "Computer Science" },
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe("ResourceFilters", () => {
  it("renders with search input, course dropdown, and category pills", async () => {
    render(
      <ResourceFilters
        initialSearch="linked lists"
        onFilterChange={vi.fn()}
        onResetFilters={vi.fn()}
      />,
    );

    await screen.findByText("All Batches");

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    expect(searchInput).toHaveValue("linked lists");

    expect(screen.getByText("All Types")).toBeInTheDocument();
    expect(screen.getByText("Lecture Notes")).toBeInTheDocument();
    expect(screen.getByText("Question Papers")).toBeInTheDocument();

    expect(screen.getByRole("combobox", { name: /Filter by course/i })).toBeInTheDocument();
    expect(screen.getByText(/CSE 2115/)).toBeInTheDocument();
  });

  it("submits search and calls onFilterChange with trimmed keyword", async () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    await screen.findByText("All Batches");

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(searchInput, { target: { value: "sql joins" } });

    const searchButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(searchButton);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "sql joins",
      }),
    );
  });

  it("calls onFilterChange when category pill is selected", async () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    await screen.findByText("All Batches");

    const labManualPill = screen.getByText("Lab Manuals");
    fireEvent.click(labManualPill);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: "LAB_MANUAL",
      }),
    );
  });

  it("calls onFilterChange when course selection changes", async () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    await screen.findByText("All Batches");

    const courseSelect = screen.getByRole("combobox", {
      name: /Filter by course/i,
    });
    fireEvent.change(courseSelect, { target: { value: "c-1" } });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "c-1",
      }),
    );
  });

  it("renders Reset Filters button when active filters exist and triggers onResetFilters", async () => {
    const handleReset = vi.fn();
    render(
      <ResourceFilters
        initialSearch="sorting"
        onFilterChange={vi.fn()}
        onResetFilters={handleReset}
      />,
    );

    await screen.findByText("All Batches");

    const resetButton = screen.getByRole("button", { name: /Reset Filters/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("renders managed batch dropdown with options and triggers onFilterChange", async () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    const batchSelect = screen.getByRole("combobox", {
      name: /Filter by batch/i,
    });
    expect(batchSelect).toBeInTheDocument();
    expect(screen.getByText("All Batches")).toBeInTheDocument();

    // Verify batch options exist and do not show UUIDs
    const option67 = await screen.findByText("Batch 67");
    expect(option67).toBeInTheDocument();
    expect(screen.queryByText("b-uuid-67")).not.toBeInTheDocument();

    fireEvent.change(batchSelect, { target: { value: "67" } });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        batch: "67",
      }),
    );
  });
});
