
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WhatsAppManagement } from "@/components/dashboard/WhatsAppManagement";

export default function WhatsAppPage() {
  return (
    <ProtectedRoute requiredRole="merchant">
      <DashboardLayout>
        <WhatsAppManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
