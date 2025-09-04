
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OrdersManagement } from "@/components/dashboard/OrdersManagement";

export default function OrdersPage() {
  return (
    <ProtectedRoute requiredRole="merchant">
      <DashboardLayout>
        <OrdersManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
