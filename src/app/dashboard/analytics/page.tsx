
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requiredRole="merchant">
      <DashboardLayout>
        <AnalyticsDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
