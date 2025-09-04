
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProductsManagement } from "@/components/dashboard/ProductsManagement";

export default function ProductsPage() {
  return (
    <ProtectedRoute requiredRole="merchant">
      <DashboardLayout>
        <ProductsManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
