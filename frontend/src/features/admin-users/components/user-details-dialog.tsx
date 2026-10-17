"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Hash,
  Loader2,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminUser, ClubAdminAssignmentItem } from "../types";
import type { Club } from "@/features/clubs/types";
import { UserRole, type User } from "@/types";
import {
  updateUserRole,
  updateUserStatus,
  getUserClubs,
  assignUserClub,
  removeUserClub,
} from "../api/admin-users-api";
import { ApiError } from "@/lib/api/client";

interface UserDetailsDialogProps {
  isOpen: boolean;
  user: AdminUser | null;
  currentUser: User | null;
  availableClubs: Club[];
  onClose: () => void;
  onUserUpdated: (updatedUser: AdminUser) => void;
}

export function UserDetailsDialog({
  isOpen,
  user,
  currentUser,
  availableClubs,
  onClose,
  onUserUpdated,
}: UserDetailsDialogProps) {
  // Role change state
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Status toggle state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Club assignments state
  const [assignments, setAssignments] = useState<ClubAdminAssignmentItem[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [isAssigningClub, setIsAssigningClub] = useState(false);
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null);
  const [clubMessage, setClubMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Track previous user to adjust form state when target user changes (React recommended pattern)
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setSelectedRole(user.role);
    setRoleMessage(null);
    setStatusMessage(null);
    setClubMessage(null);
    setShowStatusConfirm(false);
    setSelectedClubId("");
    setAssignments(
      user.role === UserRole.CLUB_ADMIN
        ? user.clubAdminAssignments || []
        : [],
    );
  }

  // Fetch fresh club assignments asynchronously when target user is a CLUB_ADMIN
  useEffect(() => {
    let isMounted = true;
    if (user && user.role === UserRole.CLUB_ADMIN) {
      getUserClubs(user.id)
        .then((clubs) => {
          if (isMounted) {
            setAssignments(clubs);
            setIsLoadingAssignments(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoadingAssignments(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isSelf = currentUser?.id === user.id;

  // Unassigned active clubs that can be assigned
  const assignableClubs = availableClubs.filter(
    (club) =>
      club.isActive &&
      !assignments.some((assignment) => assignment.clubId === club.id),
  );

  // 1. Role Change Handler
  const handleUpdateRole = async () => {
    if (isSelf) {
      setRoleMessage({
        type: "error",
        text: "You cannot change your own administrative role.",
      });
      return;
    }
    if (selectedRole === user.role) {
      setRoleMessage({
        type: "error",
        text: "Please select a different role to update.",
      });
      return;
    }

    try {
      setIsUpdatingRole(true);
      setRoleMessage(null);
      const updated = await updateUserRole(user.id, selectedRole);
      onUserUpdated(updated);
      setRoleMessage({
        type: "success",
        text: `Role successfully updated to ${selectedRole}.`,
      });

      // If switched away from CLUB_ADMIN, assignments were cleaned up
      if (selectedRole !== UserRole.CLUB_ADMIN) {
        setAssignments([]);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to update role. Please try again.";
      setRoleMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // 2. Status Toggle Handler
  const handleToggleStatus = async () => {
    if (isSelf) {
      setStatusMessage({
        type: "error",
        text: "You cannot deactivate your own account.",
      });
      setShowStatusConfirm(false);
      return;
    }

    const nextStatus = !user.isActive;

    try {
      setIsUpdatingStatus(true);
      setStatusMessage(null);
      const updated = await updateUserStatus(user.id, nextStatus);
      onUserUpdated(updated);
      setShowStatusConfirm(false);
      setStatusMessage({
        type: "success",
        text: nextStatus
          ? "User account successfully activated."
          : "User account deactivated and all active sessions were revoked.",
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to update account status. Please try again.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 3. Club Assignment Handler
  const handleAssignClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId) {
      setClubMessage({
        type: "error",
        text: "Please select a club to assign.",
      });
      return;
    }

    try {
      setIsAssigningClub(true);
      setClubMessage(null);
      const newAssignment = await assignUserClub(user.id, selectedClubId);
      setAssignments((prev) => [...prev, newAssignment]);
      setSelectedClubId("");
      setClubMessage({
        type: "success",
        text: `Successfully assigned to ${newAssignment.club?.name || "club"}.`,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to assign club. The user may already be assigned.";
      setClubMessage({ type: "error", text: msg });
    } finally {
      setIsAssigningClub(false);
    }
  };

  // 4. Club Assignment Removal Handler
  const handleRemoveClub = async (clubId: string, clubName: string) => {
    try {
      setDeletingClubId(clubId);
      setClubMessage(null);
      await removeUserClub(user.id, clubId);
      setAssignments((prev) => prev.filter((a) => a.clubId !== clubId));
      setClubMessage({
        type: "success",
        text: `Removed assignment from ${clubName}.`,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to remove club assignment.";
      setClubMessage({ type: "error", text: msg });
    } finally {
      setDeletingClubId(null);
    }
  };

  // Format department display without raw UUID
  const departmentDisplay = user.department
    ? `${user.department.name} (${user.department.code})`
    : "None";

  // Format batch display
  const batchDisplay = user.batchDetails
    ? `Batch ${user.batchDetails.batchNumber}`
    : user.batch
      ? `Batch ${user.batch}`
      : "None";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-dialog-title"
    >
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div>
            <h2
              id="user-dialog-title"
              className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2"
            >
              <Shield className="size-5 text-primary" />
              User Details & Management
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.name} ({user.email})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dialog Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-border/60">
          {/* Section 1: User Profile Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Profile Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg border border-border/60">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Full Name
                </span>
                <p className="font-semibold text-foreground">{user.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3 text-muted-foreground" /> Email
                </span>
                <p className="font-medium text-foreground truncate">
                  {user.email}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="size-3 text-muted-foreground" /> Student ID
                </span>
                <p className="font-medium text-foreground">
                  {user.studentId || "Not assigned"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="size-3 text-muted-foreground" /> Department
                </span>
                <p className="font-medium text-foreground">
                  {departmentDisplay}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Batch & Section
                </span>
                <p className="font-medium text-foreground">
                  {batchDisplay} {user.section ? `• Sec ${user.section}` : ""}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-muted-foreground" /> Joined
                </span>
                <p className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Badge
                  variant={user.isActive ? "default" : "destructive"}
                  className="font-medium text-xs"
                >
                  {user.isActive ? "Active Account" : "Deactivated"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Role:</span>
                <Badge variant="outline" className="font-semibold text-xs">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Section 2: Role Management */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Role Assignment
            </h3>

            {isSelf && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                <ShieldAlert className="size-4 shrink-0" />
                <span>
                  You are currently logged in as this administrator. You cannot
                  modify your own role.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label htmlFor="role-select" className="sr-only">
                  Select User Role
                </label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as UserRole)
                  }
                  disabled={isSelf || isUpdatingRole}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={UserRole.STUDENT}>STUDENT (Standard User)</option>
                  <option value={UserRole.CLUB_ADMIN}>CLUB_ADMIN (Club Manager)</option>
                  <option value={UserRole.RESOURCE_ADMIN}>RESOURCE_ADMIN (Academic Hub)</option>
                  <option value={UserRole.ADMIN}>ADMIN (System Administrator)</option>
                </select>
              </div>

              <Button
                type="button"
                onClick={handleUpdateRole}
                disabled={isSelf || isUpdatingRole || selectedRole === user.role}
                size="sm"
                className="shrink-0"
              >
                {isUpdatingRole ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Role"
                )}
              </Button>
            </div>

            {user.role === UserRole.CLUB_ADMIN &&
              selectedRole !== UserRole.CLUB_ADMIN && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Note: Changing role away from Club Admin will automatically
                  remove all club assignments for this user.
                </p>
              )}

            {roleMessage && (
              <div
                className={`flex items-center gap-2 text-xs p-2.5 rounded-md border ${
                  roleMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                {roleMessage.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{roleMessage.text}</span>
              </div>
            )}
          </div>

          {/* Section 3: Status Management (Activate / Deactivate) */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Account Status & Access
            </h3>

            {isSelf && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                <ShieldAlert className="size-4 shrink-0" />
                <span>
                  You cannot deactivate your own administrative account.
                </span>
              </div>
            )}

            {!showStatusConfirm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/20 border border-border/60">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {user.isActive ? "Deactivate Account" : "Activate Account"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.isActive
                      ? "Revokes all active sessions immediately and prevents future logins."
                      : "Restores platform access and allows the user to log in again."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant={user.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setShowStatusConfirm(true)}
                  disabled={isSelf || isUpdatingStatus}
                  className="shrink-0"
                >
                  {user.isActive ? (
                    <>
                      <UserX className="mr-1.5 size-3.5" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-1.5 size-3.5" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-foreground">
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">
                      Confirm {user.isActive ? "Deactivation" : "Activation"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user.isActive
                        ? `Are you sure you want to deactivate ${user.name}? They will be immediately logged out and unable to log back in.`
                        : `Are you sure you want to activate ${user.name}? They will be able to access the platform.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusConfirm(false)}
                    disabled={isUpdatingStatus}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={user.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : user.isActive ? (
                      "Yes, Deactivate"
                    ) : (
                      "Yes, Activate"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {statusMessage && (
              <div
                className={`flex items-center gap-2 text-xs p-2.5 rounded-md border ${
                  statusMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Section 4: Club Admin Assignments */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Club Admin Assignments
            </h3>

            {user.role !== UserRole.CLUB_ADMIN ? (
              <div className="p-4 rounded-lg bg-muted/20 border border-border/60 text-xs text-muted-foreground">
                Club assignments are only available for users with the{" "}
                <span className="font-semibold text-foreground">
                  CLUB_ADMIN
                </span>{" "}
                role. Change the user&apos;s role to Club Admin above to assign
                clubs.
              </div>
            ) : (
              <div className="space-y-4">
                {/* List of Current Assignments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Assigned Clubs ({assignments.length})</span>
                  </div>

                  {isLoadingAssignments ? (
                    <div className="flex items-center justify-center p-4 border border-border/60 rounded-lg">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-xs text-muted-foreground">
                        Loading assignments...
                      </span>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                      No club assignments yet. Assign this user to a club below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/60"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {assignment.club?.name || "Unknown Club"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>@{assignment.club?.slug}</span>
                              <span>•</span>
                              <span>
                                Assigned{" "}
                                {new Date(
                                  assignment.assignedAt,
                                ).toLocaleDateString()}
                              </span>
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveClub(
                                assignment.clubId,
                                assignment.club?.name || "Club",
                              )
                            }
                            disabled={deletingClubId === assignment.clubId}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border shrink-0"
                            aria-label={`Remove assignment for ${assignment.club?.name}`}
                          >
                            {deletingClubId === assignment.clubId ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="size-3.5 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Assignment Form */}
                <form
                  onSubmit={handleAssignClub}
                  className="p-4 rounded-lg bg-muted/10 border border-border/60 space-y-3"
                >
                  <label
                    htmlFor="club-assign-select"
                    className="text-xs font-semibold text-foreground block"
                  >
                    Assign to Another Club
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      id="club-assign-select"
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      disabled={isAssigningClub || assignableClubs.length === 0}
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {assignableClubs.length === 0
                          ? "No more active clubs available"
                          : "Select an active club..."}
                      </option>
                      {assignableClubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name} (@{club.slug})
                        </option>
                      ))}
                    </select>

                    <Button
                      type="submit"
                      disabled={!selectedClubId || isAssigningClub}
                      size="sm"
                      className="shrink-0"
                    >
                      {isAssigningClub ? (
                        <>
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1.5 size-3.5" />
                          Assign Club
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {clubMessage && (
                  <div
                    className={`flex items-center gap-2 text-xs p-2.5 rounded-md border ${
                      clubMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {clubMessage.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0" />
                    )}
                    <span>{clubMessage.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-muted/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
