"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Layers,
  Plus,
  Power,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { getDepartments } from "@/features/auth/api/departments-api";
import {
  getBatches,
  createBatch,
  deactivateBatch,
  updateBatch,
} from "../api/batches-api";
import type { Batch } from "../types";
import type { Department } from "@/types";
import { ApiError } from "@/lib/api/client";

export function BatchManagementView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [batches, setBatches] = useState<Batch[]>([]);

  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionBatchId, setActionBatchId] = useState<string | null>(null);

  // Add Batch Form State
  const [newDepartmentId, setNewDepartmentId] = useState<string>("");
  const [newBatchNumber, setNewBatchNumber] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // Load Departments on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      try {
        setIsLoadingDepts(true);
        const data = await getDepartments();
        if (isMounted) {
          setDepartments(data);
          if (data.length > 0) {
            setSelectedDepartmentId(data[0].id);
            setNewDepartmentId(data[0].id);
          }
        }
      } catch {
        if (isMounted) {
          setFormError("Failed to load departments. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDepts(false);
        }
      }
    }
    void loadDepts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch batches when selectedDepartmentId or refreshKey changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedDepartmentId) return;

    async function loadBatches() {
      try {
        setIsLoadingBatches(true);
        const data = await getBatches({
          departmentId:
            selectedDepartmentId === "ALL" ? undefined : selectedDepartmentId,
        });
        if (isMounted) {
          setBatches(data);
        }
      } catch {
        if (isMounted) {
          setBatches([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBatches(false);
        }
      }
    }

    void loadBatches();
    return () => {
      isMounted = false;
    };
  }, [selectedDepartmentId, refreshKey]);

  // Handle department filter change
  const handleDepartmentFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setSelectedDepartmentId(value);
    if (value !== "ALL") {
      setNewDepartmentId(value);
    }
    setFormError(null);
    setSuccessMessage(null);
  };

  // Handle Add Batch Submission
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const targetDeptId = newDepartmentId || selectedDepartmentId;
    if (!targetDeptId || targetDeptId === "ALL") {
      setFormError("Please select a valid department for the batch");
      return;
    }

    const parsedBatchNumber = parseInt(newBatchNumber.trim(), 10);
    if (
      !newBatchNumber.trim() ||
      isNaN(parsedBatchNumber) ||
      parsedBatchNumber <= 0 ||
      !Number.isInteger(parsedBatchNumber)
    ) {
      setFormError("Batch number must be a positive integer");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createBatch({
        departmentId: targetDeptId,
        batchNumber: parsedBatchNumber,
      });

      const deptName =
        departments.find((d) => d.id === targetDeptId)?.code || "department";
      setSuccessMessage(
        `Batch ${created.batchNumber} successfully created for ${deptName}`,
      );
      setNewBatchNumber("");
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (
          err.statusCode === 409 ||
          err.message?.toLowerCase().includes("already exists")
        ) {
          setFormError(
            `Batch ${parsedBatchNumber} already exists for this department`,
          );
        } else {
          setFormError(err.message || "Failed to create batch");
        }
      } else {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        if (message.toLowerCase().includes("already exists")) {
          setFormError(
            `Batch ${parsedBatchNumber} already exists for this department`,
          );
        } else {
          setFormError(message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deactivate / Toggle Batch
  const handleDeactivate = async (batch: Batch) => {
    try {
      setActionBatchId(batch.id);
      setFormError(null);
      setSuccessMessage(null);
      await deactivateBatch(batch.id);
      setSuccessMessage(`Batch ${batch.batchNumber} has been deactivated`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to deactivate batch";
      setFormError(message);
    } finally {
      setActionBatchId(null);
    }
  };

  const handleActivate = async (batch: Batch) => {
    try {
      setActionBatchId(batch.id);
      setFormError(null);
      setSuccessMessage(null);
      await updateBatch(batch.id, { isActive: true });
      setSuccessMessage(`Batch ${batch.batchNumber} has been activated`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to activate batch";
      setFormError(message);
    } finally {
      setActionBatchId(null);
    }
  };

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId),
    [departments, selectedDepartmentId],
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Batch Management
              </h1>
              <p className="text-xs text-muted-foreground">
                Configure and manage official academic batches scoped by department
              </p>
            </div>
          </div>
        </div>

        {/* Department Filter Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="dept-filter-select"
            className="text-xs font-medium text-muted-foreground whitespace-nowrap"
          >
            Filter Department:
          </label>
          <select
            id="dept-filter-select"
            value={selectedDepartmentId}
            onChange={handleDepartmentFilterChange}
            disabled={isLoadingDepts}
            aria-label="Filter by department"
            className="h-9 rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Alerts */}
      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 p-3.5 text-xs animate-in fade-in-50"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add New Batch Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-xs border-border">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Add Academic Batch
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Create a new intake batch under a university department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBatch} noValidate className="space-y-4">
                {/* Department Selection */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="add-dept-select"
                    className="block text-xs font-medium text-foreground"
                  >
                    Department *
                  </label>
                  <select
                    id="add-dept-select"
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    disabled={isLoadingDepts || isSubmitting}
                    aria-label="Department for new batch"
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Number Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="batch-number-input"
                    className="block text-xs font-medium text-foreground"
                  >
                    Batch Number *
                  </label>
                  <Input
                    id="batch-number-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 71"
                    value={newBatchNumber}
                    onChange={(e) => setNewBatchNumber(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9 text-xs"
                    aria-label="Batch number"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must be a positive integer unique within the department.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || isLoadingDepts}
                  className="w-full text-xs font-semibold cursor-pointer gap-2"
                >
                  <Plus className="size-3.5" />
                  <span>{isSubmitting ? "Creating Batch..." : "Add Batch"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Batches List */}
        <div className="lg:col-span-2">
          <Card className="shadow-xs border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {selectedDepartment
                    ? `${selectedDepartment.name} Batches`
                    : "All Academic Batches"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {batches.length} total batch{batches.length === 1 ? "" : "es"} configured
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={isLoadingBatches}
                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Refresh batches"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </CardHeader>

            <CardContent>
              {isLoadingBatches ? (
                <div className="py-12 flex justify-center">
                  <LoadingState message="Loading batches..." />
                </div>
              ) : batches.length === 0 ? (
                <EmptyState
                  title="No Batches Found"
                  description="No academic batches exist for this department yet. Use the form to create one."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground">
                        <th className="py-2.5 px-3 font-semibold">Batch</th>
                        <th className="py-2.5 px-3 font-semibold">Department</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {batches.map((batch) => {
                        const isDeactivating = actionBatchId === batch.id;
                        const deptCode =
                          batch.department?.code ||
                          departments.find((d) => d.id === batch.departmentId)?.code ||
                          "";

                        return (
                          <tr
                            key={batch.id}
                            className="hover:bg-muted/40 transition-colors"
                          >
                            <td className="py-3 px-3 font-semibold text-foreground">
                              Batch {batch.batchNumber}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Building2 className="size-3.5 text-muted-foreground/80" />
                                <span>{deptCode}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {batch.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-medium"
                                >
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-muted-foreground/30 bg-muted text-muted-foreground text-[11px] font-medium"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {batch.isActive ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeactivate(batch)}
                                  disabled={isDeactivating}
                                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  aria-label={`Deactivate Batch ${batch.batchNumber}`}
                                >
                                  <Power className="size-3 mr-1" />
                                  <span>{isDeactivating ? "Processing..." : "Deactivate"}</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleActivate(batch)}
                                  disabled={isDeactivating}
                                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                  aria-label={`Activate Batch ${batch.batchNumber}`}
                                >
                                  <Power className="size-3 mr-1" />
                                  <span>{isDeactivating ? "Processing..." : "Activate"}</span>
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
