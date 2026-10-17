"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/features/auth";
import { getDepartments } from "@/features/auth/api/departments-api";
import { clubsApi } from "@/features/clubs/api/clubs-api";
import type { Club } from "@/features/clubs/types";
import { UserRole, type Department } from "@/types";
import type { AdminUser, QueryAdminUsersParams } from "../types";
import { getAdminUsers } from "../api/admin-users-api";
import { UserDetailsDialog } from "./user-details-dialog";
import { ApiError } from "@/lib/api/client";

export function AdminUsersView() {
  const { user: currentUser } = useAuth();

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected user for management dialog
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load departments and clubs on mount
  useEffect(() => {
    let isMounted = true;
    async function initMetadata() {
      try {
        const [deptList, clubsRes] = await Promise.all([
          getDepartments().catch(() => []),
          clubsApi.getClubs({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          setDepartments(deptList);
          setClubs(clubsRes.data || []);
        }
      } catch {
        // Soft fail for metadata
      }
    }
    void initMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch users with current filters & pagination asynchronously
  useEffect(() => {
    let isCurrent = true;

    const params: QueryAdminUsersParams = {
      page: currentPage,
      limit: 10,
    };

    if (activeSearch.trim()) {
      params.search = activeSearch.trim();
    }

    if (selectedRole !== "ALL") {
      params.role = selectedRole as UserRole;
    }

    if (selectedDeptId !== "ALL") {
      params.departmentId = selectedDeptId;
    }

    getAdminUsers(params)
      .then((res) => {
        if (isCurrent) {
          setUsers(res.data);
          setMeta(res.meta);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Failed to load user directory. Please try again.";
          setError(msg);
          setUsers([]);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [currentPage, activeSearch, selectedRole, selectedDeptId, refreshKey]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentPage(1);
    setActiveSearch(searchInput.trim());
  };

  // Handle single clear button
  const handleClearSearch = () => {
    setIsLoading(true);
    setSearchInput("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  // Handle Role filter change
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsLoading(true);
    setSelectedRole(e.target.value);
    setCurrentPage(1);
  };

  // Handle Department filter change
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsLoading(true);
    setSelectedDeptId(e.target.value);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setIsLoading(true);
    setSearchInput("");
    setActiveSearch("");
    setSelectedRole("ALL");
    setSelectedDeptId("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(activeSearch) || selectedRole !== "ALL" || selectedDeptId !== "ALL";

  // Handle opening user dialog
  const handleManageUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Handle user updated in dialog
  const handleUserUpdated = (updatedUser: AdminUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    );
    setSelectedUser(updatedUser);
  };

  // Helper for role badge variant
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge
            variant="default"
            className="bg-primary/90 text-primary-foreground font-semibold text-xs"
          >
            System Admin
          </Badge>
        );
      case UserRole.CLUB_ADMIN:
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold text-xs"
          >
            Club Admin
          </Badge>
        );
      case UserRole.RESOURCE_ADMIN:
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold text-xs"
          >
            Resource Admin
          </Badge>
        );
      case UserRole.STUDENT:
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground font-medium text-xs">
            Student
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="size-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage university student accounts, role permissions, and club administrator assignments.
          </p>
        </div>

        {meta.total > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/60 self-start md:self-auto">
            <span>Total Accounts:</span>
            <span className="font-semibold text-foreground">{meta.total}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box with EXACTLY ONE Clear Button */}
          <form
            onSubmit={handleSearchSubmit}
            className="md:col-span-6 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button type="submit" size="sm" className="px-4 shrink-0">
              Search
            </Button>
          </form>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <label htmlFor="filter-role-select" className="sr-only">
              Filter by Role
            </label>
            <select
              id="filter-role-select"
              value={selectedRole}
              onChange={handleRoleChange}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Roles</option>
              <option value={UserRole.ADMIN}>ADMIN (System Admin)</option>
              <option value={UserRole.CLUB_ADMIN}>CLUB_ADMIN (Club Admin)</option>
              <option value={UserRole.RESOURCE_ADMIN}>RESOURCE_ADMIN (Resource Admin)</option>
              <option value={UserRole.STUDENT}>STUDENT</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <label htmlFor="filter-dept-select" className="sr-only">
              Filter by Department
            </label>
            <select
              id="filter-dept-select"
              value={selectedDeptId}
              onChange={handleDeptChange}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filters active</span>
              {activeSearch && (
                <span className="bg-muted px-2 py-0.5 rounded text-foreground">
                  &ldquo;{activeSearch}&rdquo;
                </span>
              )}
              {selectedRole !== "ALL" && (
                <span className="bg-muted px-2 py-0.5 rounded text-foreground">
                  Role: {selectedRole}
                </span>
              )}
              {selectedDeptId !== "ALL" && (
                <span className="bg-muted px-2 py-0.5 rounded text-foreground">
                  Dept: {departments.find((d) => d.id === selectedDeptId)?.code || "Selected"}
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 bg-card border border-border rounded-xl">
          <LoadingState message="Loading university users..." />
        </div>
      ) : error ? (
        <div className="p-8 bg-card border border-destructive/30 rounded-xl space-y-4 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Failed to Load Users</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              setRefreshKey((k) => k + 1);
            }}
          >
            Try Again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="p-6 bg-card border border-border rounded-xl">
          <EmptyState
            title="No users found"
            description={
              hasActiveFilters
                ? "No accounts match the current filter or search criteria."
                : "No registered accounts found in the database."
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  <RotateCcw className="size-3 mr-1" />
                  Reset Filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Batch / Section</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {users.map((user) => {
                  const deptDisplay = user.department
                    ? `${user.department.code} - ${user.department.name}`
                    : "—";

                  const batchDisplay = user.batchDetails
                    ? `Batch ${user.batchDetails.batchNumber}`
                    : user.batch
                      ? `Batch ${user.batch}`
                      : "—";

                  const sectionDisplay = user.section ? `Sec ${user.section}` : "";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* User Column */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                          {user.studentId && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5 font-mono">
                              ID: {user.studentId}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Department Column (never raw UUID) */}
                      <td className="py-3 px-4 text-xs font-medium text-foreground">
                        {deptDisplay}
                      </td>

                      {/* Batch & Section Column */}
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {batchDisplay !== "—" ? (
                          <span>
                            {batchDisplay}{" "}
                            {sectionDisplay && `• ${sectionDisplay}`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                          className="text-[11px] font-medium"
                        >
                          {user.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageUser(user)}
                          className="h-8 gap-1.5 text-xs font-medium"
                        >
                          <Settings className="size-3.5" />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(meta.page - 1) * meta.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{meta.total}</span>{" "}
              accounts
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="h-8 px-2.5"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>

              <span className="px-2 font-medium text-foreground">
                Page {meta.page} of {Math.max(meta.totalPages, 1)}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, meta.totalPages))
                }
                disabled={currentPage >= meta.totalPages}
                className="h-8 px-2.5"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details & Management Dialog */}
      <UserDetailsDialog
        isOpen={isDialogOpen}
        user={selectedUser}
        currentUser={currentUser}
        availableClubs={clubs}
        onClose={() => setIsDialogOpen(false)}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
