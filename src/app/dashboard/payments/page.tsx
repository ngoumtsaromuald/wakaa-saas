
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PaymentsManagement } from "@/components/dashboard/PaymentsManagement";

export default function PaymentsPage() {
  return (
    <ProtectedRoute requiredRole="merchant">
      <DashboardLayout>
        <PaymentsManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
