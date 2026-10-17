import type { Metadata } from "next";
import { ProtectedRoute, DashboardShell } from "@/components/layout";
import { AdminUsersView } from "@/features/admin-users";

export const metadata: Metadata = {
  title: "User Management | CampusOS",
  description: "Administrative user management and club admin assignments",
};

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <DashboardShell>
        <AdminUsersView />
      </DashboardShell>
    </ProtectedRoute>
  );
}
