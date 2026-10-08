import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BatchManagementView } from "./batch-management-view";
import * as departmentsApi from "@/features/auth/api/departments-api";
import * as batchesApi from "../api/batches-api";
import { ApiError } from "@/lib/api/client";

describe("BatchManagementView", () => {
  const mockDepartments = [
    {
      id: "dept-1",
      name: "Department of Computer Science & Engineering",
      code: "CSE",
    },
    {
      id: "dept-2",
      name: "Department of Electrical & Electronic Engineering",
      code: "EEE",
    },
  ];

  const mockBatches = [
    {
      id: "b-1",
      departmentId: "dept-1",
      batchNumber: 67,
      isActive: true,
      department: { id: "dept-1", code: "CSE", name: "CSE" },
    },
    {
      id: "b-2",
      departmentId: "dept-1",
      batchNumber: 68,
      isActive: false,
      department: { id: "dept-1", code: "CSE", name: "CSE" },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(departmentsApi, "getDepartments").mockResolvedValue(mockDepartments);
    vi.spyOn(batchesApi, "getBatches").mockResolvedValue(mockBatches);
  });

  it("loads departments and displays batches with status badges and no raw UUIDs", async () => {
    render(<BatchManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Batch 67")).toBeInTheDocument();
      expect(screen.getByText("Batch 68")).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();

    // Verify raw UUIDs are not rendered
    expect(screen.queryByText("b-1")).not.toBeInTheDocument();
    expect(screen.queryByText("dept-1")).not.toBeInTheDocument();
  });

  it("filters batches when department selector changes", async () => {
    render(<BatchManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Batch 67")).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/Filter by department/i);
    fireEvent.change(filterSelect, { target: { value: "dept-2" } });

    await waitFor(() => {
      expect(batchesApi.getBatches).toHaveBeenCalledWith({
        departmentId: "dept-2",
      });
    });
  });

  it("successfully creates a new batch and refreshes the batch list", async () => {
    const createSpy = vi.spyOn(batchesApi, "createBatch").mockResolvedValue({
      id: "b-3",
      departmentId: "dept-1",
      batchNumber: 71,
      isActive: true,
    });

    render(<BatchManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Batch 67")).toBeInTheDocument();
    });

    const batchInput = screen.getByLabelText(/Batch number/i);
    fireEvent.change(batchInput, { target: { value: "71" } });

    const submitBtn = screen.getByRole("button", { name: /Add Batch/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        departmentId: "dept-1",
        batchNumber: 71,
      });
      expect(
        screen.getByText(/Batch 71 successfully created/i),
      ).toBeInTheDocument();
    });
  });

  it("displays clear conflict error when creating a duplicate batch", async () => {
    vi.spyOn(batchesApi, "createBatch").mockRejectedValue(
      new ApiError("Batch 67 already exists in CSE", 409),
    );

    render(<BatchManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Batch 67")).toBeInTheDocument();
    });

    const batchInput = screen.getByLabelText(/Batch number/i);
    fireEvent.change(batchInput, { target: { value: "67" } });

    const submitBtn = screen.getByRole("button", { name: /Add Batch/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Batch 67 already exists for this department"),
      ).toBeInTheDocument();
    });
  });

  it("validates that batch number must be a positive integer", async () => {
    render(<BatchManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Batch 67")).toBeInTheDocument();
    });

    const batchInput = screen.getByLabelText(/Batch number/i);
    fireEvent.change(batchInput, { target: { value: "-5" } });

    const submitBtn = screen.getByRole("button", { name: /Add Batch/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Batch number must be a positive integer"),
      ).toBeInTheDocument();
    });
  });

  it("calls deactivateBatch and shows success message when deactivating a batch", async () => {
    const deactivateSpy = vi
      .spyOn(batchesApi, "deactivateBatch")
      .mockResolvedValue({
        id: "b-1",
        departmentId: "dept-1",
        batchNumber: 67,
        isActive: false,
      });

    render(<BatchManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Batch 67")).toBeInTheDocument();
    });

    const deactivateBtn = screen.getByRole("button", {
      name: /Deactivate Batch 67/i,
    });
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(deactivateSpy).toHaveBeenCalledWith("b-1");
      expect(
        screen.getByText("Batch 67 has been deactivated"),
      ).toBeInTheDocument();
    });
  });
});
