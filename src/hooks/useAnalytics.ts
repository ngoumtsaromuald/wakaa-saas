
"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

interface AnalyticsOverview {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  average_order_value: number;
  revenue_growth: number;
  orders_growth: number;
  customers_growth: number;
  conversion_rate: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
}

interface Activity {
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface DashboardData {
  overview: AnalyticsOverview;
  charts: {
    revenue_chart: ChartData[];
    orders_by_status: OrderStatusData[];
    top_products: TopProduct[];
    customer_segments: CustomerSegment[];
  };
  recent_activity: Activity[];
}

interface UseAnalyticsOptions {
  merchantId?: number;
  period?: '7d' | '30d' | '90d';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {};

      if (options.merchantId) {
        params.merchant_id = options.merchantId.toString();
      }

      if (options.period) {
        params.period = options.period;
      }

      const data = await api.get<DashboardData>('/analytics/dashboard', params);
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options.merchantId, options.period]);

  const trackEvent = async (eventData: {
    event_type: string;
    event_data: any;
    merchant_id?: number;
    user_id?: string;
    session_id?: string;
  }) => {
    try {
      await api.post('/analytics/events', {
        ...eventData,
        merchant_id: options.merchantId || eventData.merchant_id
      });
    } catch (err) {
      console.error('Erreur lors du tracking d\'événement:', err);
      // Ne pas afficher d'erreur à l'utilisateur pour les événements analytics
    }
  };

  const getRevenueGrowth = (): number => {
    return dashboardData?.overview.revenue_growth || 0;
  };

  const getOrdersGrowth = (): number => {
    return dashboardData?.overview.orders_growth || 0;
  };

  const getCustomersGrowth = (): number => {
    return dashboardData?.overview.customers_growth || 0;
  };

  const getTotalRevenue = (): number => {
    return dashboardData?.overview.total_revenue || 0;
  };

  const getTotalOrders = (): number => {
    return dashboardData?.overview.total_orders || 0;
  };

  const getTotalCustomers = (): number => {
    return dashboardData?.overview.total_customers || 0;
  };

  const getAverageOrderValue = (): number => {
    return dashboardData?.overview.average_order_value || 0;
  };

  const getConversionRate = (): number => {
    return dashboardData?.overview.conversion_rate || 0;
  };

  // Auto-refresh si activé
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchAnalytics();
      }, options.refreshInterval || 300000); // 5 minutes par défaut

      return () => clearInterval(interval);
    }
  }, [fetchAnalytics, options.autoRefresh, options.refreshInterval]);

  // Chargement initial
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    dashboardData,
    loading,
    error,
    fetchAnalytics,
    trackEvent,
    getRevenueGrowth,
    getOrdersGrowth,
    getCustomersGrowth,
    getTotalRevenue,
    getTotalOrders,
    getTotalCustomers,
    getAverageOrderValue,
    getConversionRate,
    refresh: fetchAnalytics
  };
}
