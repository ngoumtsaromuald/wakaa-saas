
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CustomersManagement } from "@/components/dashboard/CustomersManagement";

export default function CustomersPage() {
  return (
    <ProtectedRoute requiredRole="merchant">
      <DashboardLayout>
        <CustomersManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
