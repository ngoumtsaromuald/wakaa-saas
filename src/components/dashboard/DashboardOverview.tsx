
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  MessageSquare,
  ArrowUpRight,
  Plus,
  Eye,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Link from "next/link";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/components/providers/AuthProvider";
import { RealTimeStats } from "./RealTimeStats";
import { DatabaseStatus } from "./DatabaseStatus";
import { api } from "@/lib/api-client";

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

export function DashboardOverview() {
  const { user } = useAuth();
  const [merchantId, setMerchantId] = useState<number | null>(null);
  
  // Récupérer l'ID du marchand depuis la base de données
  useEffect(() => {
    const fetchMerchantId = async () => {
      if (user?.role === 'merchant' && user?.email) {
        try {
          const merchants = await api.get('/merchants', { search: user.email });
          if (merchants && merchants.length > 0) {
            setMerchantId(merchants[0].id);
          } else {
            setMerchantId(1); // Fallback
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'ID marchand:', error);
          setMerchantId(1); // Fallback
        }
      } else {
        setMerchantId(1); // Fallback pour les tests
      }
    };

    fetchMerchantId();
  }, [user]);
  
  // Utiliser les hooks réels pour récupérer les données (seulement si merchantId est disponible)
  const { orders, loading: ordersLoading } = useOrders({ 
    merchantId: merchantId || undefined, 
    autoRefresh: !!merchantId,
    refreshInterval: 60000 
  });
  
  const { customers, loading: customersLoading } = useCustomers({ 
    merchantId: merchantId || undefined,
    autoRefresh: !!merchantId,
    refreshInterval: 120000 
  });
  
  const { payments, loading: paymentsLoading, getTotalAmount } = usePayments({ 
    merchantId: merchantId || undefined,
    autoRefresh: !!merchantId,
    refreshInterval: 30000 
  });
  
  const { dashboardData, loading: analyticsLoading, fetchAnalytics } = useAnalytics({ 
    merchantId: merchantId || undefined,
    period: '30d',
    autoRefresh: !!merchantId,
    refreshInterval: 300000 
  });

  // Calculer les statistiques réelles
  const stats = {
    totalRevenue: getTotalAmount('completed'),
    totalOrders: orders.length,
    totalCustomers: customers.length,
    newCustomers: customers.filter(c => {
      const createdDate = new Date(c.create_time);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return createdDate >= thirtyDaysAgo;
    }).length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    paidOrders: orders.filter(o => o.payment_status === 'paid').length,
    shippedOrders: orders.filter(o => o.status === 'shipped').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length
  };

  // Données pour le graphique des statuts de commandes (réelles)
  const orderStatusData = [
    { 
      name: "En attente", 
      value: orders.filter(o => o.status === 'pending').length, 
      color: "#f59e0b" 
    },
    { 
      name: "Confirmées", 
      value: orders.filter(o => o.status === 'confirmed').length, 
      color: "#3b82f6" 
    },
    { 
      name: "Expédiées", 
      value: orders.filter(o => o.status === 'shipped').length, 
      color: "#8b5cf6" 
    },
    { 
      name: "Livrées", 
      value: orders.filter(o => o.status === 'delivered').length, 
      color: "#10b981" 
    },
  ];

  // Commandes récentes (réelles)
  const recentOrders = orders
    .sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime())
    .slice(0, 4)
    .map(order => {
      const customer = customers.find(c => c.id === order.customer_id);
      return {
        id: order.order_number,
        customer: customer?.name || customer?.phone_number || 'Client inconnu',
        amount: order.total_amount,
        status: order.payment_status,
        date: new Date(order.create_time).toISOString().split('T')[0]
      };
    });

  // Top produits (calculés à partir des commandes réelles)
  const topProducts = (() => {
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
        console.warn('Erreur lors de l\'analyse des items:', error);
      }
    });
    
    return Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        sales: stats.sales,
        revenue: Math.round(stats.revenue)
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);
  })();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Payée", variant: "default" as const, color: "text-green-600" },
      pending: { label: "En attente", variant: "secondary" as const, color: "text-yellow-600" },
      shipped: { label: "Expédiée", variant: "outline" as const, color: "text-blue-600" },
      delivered: { label: "Livrée", variant: "default" as const, color: "text-green-600" },
      failed: { label: "Échoué", variant: "destructive" as const, color: "text-red-600" }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  // Fonction pour actualiser les analytics (corrigée)
  const handleFetchAnalytics = () => {
    fetchAnalytics();
  };

  const isLoading = ordersLoading || customersLoading || paymentsLoading || analyticsLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">
            Bonjour {user?.full_name?.split(' ')[0] || 'Utilisateur'} ! 👋
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de votre activité en temps réel
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleFetchAnalytics} 
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button asChild>
            <Link href="/dashboard/orders">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Commande
            </Link>
          </Button>
        </div>
      </div>

      {/* Statut de la base de données et stats temps réel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <DatabaseStatus showInitButton={true} />
        </div>
        <div className="lg:col-span-3">
          {merchantId && <RealTimeStats merchantId={merchantId} />}
        </div>
      </div>

      {/* KPI Cards - Données Réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                `${stats.totalRevenue.toLocaleString()} FCFA`
              )}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              {dashboardData?.overview.revenue_growth?.toFixed(1) || 0}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                stats.totalOrders
              )}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              {dashboardData?.overview.orders_growth?.toFixed(1) || 0}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                stats.totalCustomers
              )}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{stats.newCustomers} nouveaux ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                `${dashboardData?.overview.average_order_value?.toLocaleString() || 0} FCFA`
              )}
            </div>
            <div className="flex items-center text-xs text-blue-600">
              Taux de conversion: {dashboardData?.overview.conversion_rate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Données Réelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Ventes</CardTitle>
            <CardDescription>
              Revenus et commandes basés sur vos données réelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : dashboardData?.charts.revenue_chart ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.charts.revenue_chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `${value} FCFA` : value,
                      name === 'revenue' ? 'Revenus' : 'Commandes'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Chart - Données Réelles */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des Commandes</CardTitle>
            <CardDescription>
              Répartition actuelle de vos commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : orderStatusData.some(item => item.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderStatusData.filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} commandes`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {orderStatusData.filter(item => item.value > 0).map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune commande pour le moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Section - Données Réelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders - Données Réelles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Commandes Récentes</CardTitle>
              <CardDescription>
                Vos dernières commandes reçues
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/orders">
                <Eye className="w-4 h-4 mr-2" />
                Voir tout ({orders.length})
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusConfig = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{order.id}</span>
                          <Badge variant={statusConfig.variant} className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.amount.toLocaleString()} FCFA</p>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/orders?search=${order.id}`}>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune commande récente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products - Données Réelles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Produits Populaires</CardTitle>
              <CardDescription>
                Vos meilleures ventes calculées en temps réel
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/products">
                <Eye className="w-4 h-4 mr-2" />
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} ventes • {product.revenue.toLocaleString()} FCFA
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune vente pour le moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status - Données Réelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Statut de l'Abonnement</span>
            <Badge className="bg-gradient-to-r from-green-600 to-blue-600">
              Premium
            </Badge>
          </CardTitle>
          <CardDescription>
            Votre plan Premium expire le 15 février 2024
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Commandes utilisées ce mois</span>
                <span>{stats.totalOrders} / Illimitées</span>
              </div>
              <Progress value={Math.min((stats.totalOrders / 500) * 100, 100)} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Renouvellement automatique activé</p>
                <p className="text-xs text-muted-foreground">
                  Prochain paiement: 10 000 FCFA le 15 février 2024
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings/billing">
                  Gérer
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
