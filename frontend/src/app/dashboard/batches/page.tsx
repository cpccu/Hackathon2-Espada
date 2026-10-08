import type { Metadata } from "next";
import { ProtectedRoute, DashboardShell } from "@/components/layout";
import { BatchManagementView } from "@/features/batches/components/batch-management-view";

export const metadata: Metadata = {
  title: "Batch Management",
  description: "Manage university academic batches and department associations",
};

export default function BatchesPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "RESOURCE_ADMIN"]}>
      <DashboardShell>
        <BatchManagementView />
      </DashboardShell>
    </ProtectedRoute>
  );
}
