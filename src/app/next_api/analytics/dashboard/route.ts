
import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  parseQueryParams,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { CrudOperations } from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Instances CRUD pour les tables nécessaires
const ordersCrud = new CrudOperations('orders');
const customersCrud = new CrudOperations('customers');
const paymentsCrud = new CrudOperations('payments');
const productsCrud = new CrudOperations('products');
const analyticsEventsCrud = new CrudOperations('analytics_events');

// Interface pour les données du dashboard
interface DashboardData {
  overview: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    average_order_value: number;
    revenue_growth: number;
    orders_growth: number;
    customers_growth: number;
    conversion_rate: number;
  };
  charts: {
    revenue_chart: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
    orders_by_status: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    top_products: Array<{
      name: string;
      sales: number;
      revenue: number;
    }>;
    customer_segments: Array<{
      segment: string;
      count: number;
      percentage: number;
    }>;
  };
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
}

// Interface pour l'activité récente
interface Activity {
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

// GET - Récupérer les données du dashboard analytics
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { merchant_id } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d
  const timezone = searchParams.get('timezone') || 'Africa/Douala';
  
  logApiRequest(request, { merchant_id, period, timezone });

  if (!merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  try {
    // Calculer les dates de période
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Récupérer les données de base
    const [orders, customers, payments, products] = await Promise.all([
      ordersCrud.findMany({ merchant_id: parseInt(merchant_id) }, 1000),
      customersCrud.findMany({ merchant_id: parseInt(merchant_id) }, 1000),
      paymentsCrud.findMany({ merchant_id: parseInt(merchant_id) }, 1000),
      productsCrud.findMany({ merchant_id: parseInt(merchant_id) }, 1000)
    ]);

    // Filtrer par période
    const currentOrders = orders?.filter(order => 
      new Date(order.create_time) >= startDate
    ) || [];
    
    const previousOrders = orders?.filter(order => 
      new Date(order.create_time) >= previousStartDate && 
      new Date(order.create_time) < startDate
    ) || [];

    const currentCustomers = customers?.filter(customer => 
      new Date(customer.create_time) >= startDate
    ) || [];
    
    const previousCustomers = customers?.filter(customer => 
      new Date(customer.create_time) >= previousStartDate && 
      new Date(customer.create_time) < startDate
    ) || [];

    const completedPayments = payments?.filter(payment => 
      payment.status === 'completed' && 
      new Date(payment.create_time) >= startDate
    ) || [];

    const previousCompletedPayments = payments?.filter(payment => 
      payment.status === 'completed' && 
      new Date(payment.create_time) >= previousStartDate && 
      new Date(payment.create_time) < startDate
    ) || [];

    // Calculer les métriques principales
    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const previousRevenue = previousCompletedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const totalOrders = currentOrders.length;
    const previousOrdersCount = previousOrders.length;
    const ordersGrowth = previousOrdersCount > 0 ? ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100 : 0;

    const totalCustomers = currentCustomers.length;
    const previousCustomersCount = previousCustomers.length;
    const customersGrowth = previousCustomersCount > 0 ? ((totalCustomers - previousCustomersCount) / previousCustomersCount) * 100 : 0;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    // Générer les données de graphique de revenus
    const revenueChart = generateRevenueChart(completedPayments, periodDays);

    // Analyser les commandes par statut
    const ordersByStatus = analyzeOrdersByStatus(currentOrders);

    // Top produits (simulation basée sur les commandes)
    const topProducts = analyzeTopProducts(currentOrders);

    // Segments de clients
    const customerSegments = analyzeCustomerSegments(customers || []);

    // Activité récente
    const recentActivity = await generateRecentActivity(merchant_id, orders || [], payments || []);

    const dashboardData: DashboardData = {
      overview: {
        total_revenue: Math.round(totalRevenue),
        total_orders: totalOrders,
        total_customers: totalCustomers,
        average_order_value: Math.round(averageOrderValue),
        revenue_growth: Math.round(revenueGrowth * 100) / 100,
        orders_growth: Math.round(ordersGrowth * 100) / 100,
        customers_growth: Math.round(customersGrowth * 100) / 100,
        conversion_rate: Math.round(conversionRate * 100) / 100
      },
      charts: {
        revenue_chart: revenueChart,
        orders_by_status: ordersByStatus,
        top_products: topProducts,
        customer_segments: customerSegments
      },
      recent_activity: recentActivity
    };

    return successResponse(dashboardData);

  } catch (error: any) {
    console.error('Erreur lors de la génération du dashboard analytics:', error);
    throw error;
  }
});

// Fonction pour générer les données de graphique de revenus
function generateRevenueChart(payments: any[], days: number) {
  const chart = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayPayments = payments.filter(payment => 
      payment.create_time.split('T')[0] === dateStr
    );
    
    const revenue = dayPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const orders = dayPayments.length;
    
    chart.push({
      date: dateStr,
      revenue: Math.round(revenue),
      orders
    });
  }
  
  return chart;
}

// Fonction pour analyser les commandes par statut
function analyzeOrdersByStatus(orders: any[]) {
  const statusCounts: Record<string, number> = {};
  const total = orders.length;
  
  orders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });
  
  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0
  }));
}

// Fonction pour analyser les top produits
function analyzeTopProducts(orders: any[]) {
  const productStats: Record<string, { sales: number; revenue: number }> = {};
  
  orders.forEach(order => {
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const name = item.name || 'Produit inconnu';
          if (!productStats[name]) {
            productStats[name] = { sales: 0, revenue: 0 };
          }
          productStats[name].sales += item.quantity || 1;
          productStats[name].revenue += item.total || item.price * item.quantity || 0;
        });
      }
    } catch (error) {
      console.warn('Erreur lors de l\'analyse des items de commande:', error);
    }
  });
  
  return Object.entries(productStats)
    .map(([name, stats]) => ({
      name,
      sales: stats.sales,
      revenue: Math.round(stats.revenue)
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
}

// Fonction pour analyser les segments de clients
function analyzeCustomerSegments(customers: any[]) {
  const segments = {
    new: customers.filter(c => c.total_orders <= 1).length,
    regular: customers.filter(c => c.total_orders > 1 && c.total_orders <= 5).length,
    vip: customers.filter(c => c.total_orders > 5).length
  };
  
  const total = customers.length;
  
  return [
    {
      segment: 'Nouveaux',
      count: segments.new,
      percentage: total > 0 ? Math.round((segments.new / total) * 100) : 0
    },
    {
      segment: 'Réguliers',
      count: segments.regular,
      percentage: total > 0 ? Math.round((segments.regular / total) * 100) : 0
    },
    {
      segment: 'VIP',
      count: segments.vip,
      percentage: total > 0 ? Math.round((segments.vip / total) * 100) : 0
    }
  ];
}

// Fonction pour générer l'activité récente
async function generateRecentActivity(merchantId: string, orders: any[], payments: any[]): Promise<Activity[]> {
  const activities: Activity[] = [];
  
  // Dernières commandes
  const recentOrders = orders
    .sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime())
    .slice(0, 5);
  
  recentOrders.forEach(order => {
    activities.push({
      type: 'order',
      description: `Nouvelle commande ${order.order_number} - ${order.total_amount} FCFA`,
      timestamp: order.create_time,
      metadata: {
        order_id: order.id,
        amount: order.total_amount,
        status: order.status
      }
    });
  });
  
  // Derniers paiements
  const recentPayments = payments
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.processed_at || b.create_time).getTime() - new Date(a.processed_at || a.create_time).getTime())
    .slice(0, 3);
  
  recentPayments.forEach(payment => {
    activities.push({
      type: 'payment',
      description: `Paiement reçu - ${payment.amount} FCFA via ${payment.provider}`,
      timestamp: payment.processed_at || payment.create_time,
      metadata: {
        payment_id: payment.id,
        amount: payment.amount,
        provider: payment.provider
      }
    });
  });
  
  // Trier par timestamp décroissant
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}
