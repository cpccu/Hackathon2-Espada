"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { LoadingState } from "@/components/ui/spinner";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Reusable wrapper for protecting authenticated routes and role-based access.
 * Redirects unauthenticated users to /login and unauthorized roles to /dashboard.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isRoleAuthorized =
    !allowedRoles || (user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState message="Checking authorization..." />
      </div>
    );
  }

  if (!isAuthenticated || !isRoleAuthorized) {
    return null;
  }

  return <>{children}</>;
}
