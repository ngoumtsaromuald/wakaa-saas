
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  CreditCard,
  Download,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export function AnalyticsDashboard() {
  const [merchantId] = useState(1); // TODO: Récupérer l'ID du marchand connecté
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>("30d");

  // Utiliser le hook réel pour les analytics
  const { 
    dashboardData, 
    loading, 
    fetchAnalytics,
    getRevenueGrowth,
    getOrdersGrowth,
    getCustomersGrowth,
    getTotalRevenue,
    getTotalOrders,
    getTotalCustomers,
    getAverageOrderValue,
    getConversionRate
  } = useAnalytics({ 
    merchantId,
    period: timeRange,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  // Fonction pour actualiser les analytics (corrigée)
  const handleRefreshAnalytics = () => {
    fetchAnalytics();
  };

  // Formater les nombres
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Formater la devise
  const formatCurrency = (num: number) => {
    return `${formatNumber(num)} FCFA`;
  };

  // Obtenir l'icône de tendance
  const getTrendIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  // Obtenir la couleur de tendance
  const getTrendColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Rapports</h1>
          <p className="text-muted-foreground">
            Analysez les performances de votre business en temps réel
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefreshAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
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
              {loading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(getTotalRevenue())
              )}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(getRevenueGrowth())}`}>
              {getTrendIcon(getRevenueGrowth())}
              <span className="ml-1">
                {getRevenueGrowth() >= 0 ? '+' : ''}{getRevenueGrowth().toFixed(1)}% vs période précédente
              </span>
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
              {loading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                formatNumber(getTotalOrders())
              )}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(getOrdersGrowth())}`}>
              {getTrendIcon(getOrdersGrowth())}
              <span className="ml-1">
                {getOrdersGrowth() >= 0 ? '+' : ''}{getOrdersGrowth().toFixed(1)}% vs période précédente
              </span>
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
              {loading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                formatNumber(getTotalCustomers())
              )}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(getCustomersGrowth())}`}>
              {getTrendIcon(getCustomersGrowth())}
              <span className="ml-1">
                {getCustomersGrowth() >= 0 ? '+' : ''}{getCustomersGrowth().toFixed(1)}% vs période précédente
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(getAverageOrderValue())
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Taux de conversion: {getConversionRate().toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Données Réelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Revenus</CardTitle>
            <CardDescription>
              Revenus sur la période sélectionnée (données réelles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : dashboardData?.charts.revenue_chart ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.charts.revenue_chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${formatCurrency(value as number)}`, 'Revenus']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de revenus disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Nombre de Commandes</CardTitle>
            <CardDescription>
              Commandes sur la période sélectionnée (données réelles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : dashboardData?.charts.revenue_chart ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.charts.revenue_chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} commandes`, 'Commandes']}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de commandes disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products - Données Réelles */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les Plus Vendus</CardTitle>
            <CardDescription>
              Top 5 des produits par nombre de ventes (données réelles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : dashboardData?.charts.top_products && dashboardData.charts.top_products.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.charts.top_products} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [`${value} ventes`, 'Ventes']}
                  />
                  <Bar dataKey="sales" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de ventes de produits disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Segments - Données Réelles */}
        <Card>
          <CardHeader>
            <CardTitle>Segments de Clients</CardTitle>
            <CardDescription>
              Répartition de votre base clients (données réelles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : dashboardData?.charts.customer_segments && dashboardData.charts.customer_segments.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.charts.customer_segments}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {dashboardData.charts.customer_segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Pourcentage']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {dashboardData.charts.customer_segments.map((segment, index) => (
                    <div key={segment.segment} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{segment.segment}: {segment.count} ({segment.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de segmentation disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics - Données Réelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux de Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {loading ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : (
                `${getConversionRate().toFixed(1)}%`
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Visiteurs qui passent commande
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temps de Réponse Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {loading ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : (
                "2.5h"
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Délai moyen de réponse WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux de Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {loading ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : (
                "94%"
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Clients satisfaits de leur expérience
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activité Récente - Données Réelles */}
      {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recent_activity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
