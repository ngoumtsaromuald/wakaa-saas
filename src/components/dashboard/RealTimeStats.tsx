
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  MessageSquare,
  RefreshCw,
  Activity
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { useNotifications } from "@/hooks/useNotifications";

interface RealTimeStatsProps {
  merchantId: number;
  refreshInterval?: number;
}

export function RealTimeStats({ merchantId, refreshInterval = 30000 }: RealTimeStatsProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Hooks avec auto-refresh activé
  const { orders, loading: ordersLoading } = useOrders({ 
    merchantId, 
    autoRefresh: true,
    refreshInterval 
  });
  
  const { customers, loading: customersLoading } = useCustomers({ 
    merchantId,
    autoRefresh: true,
    refreshInterval: refreshInterval * 2 // Moins fréquent pour les clients
  });
  
  const { payments, getTotalAmount, loading: paymentsLoading } = usePayments({ 
    merchantId,
    autoRefresh: true,
    refreshInterval 
  });
  
  const { notifications, getNotificationsByChannel, loading: notificationsLoading } = useNotifications({ 
    merchantId,
    autoRefresh: true,
    refreshInterval 
  });

  // Calculer les statistiques en temps réel
  const stats = {
    // Commandes
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    todayOrders: orders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.create_time).toDateString() === today;
    }).length,
    
    // Revenus
    totalRevenue: getTotalAmount('completed'),
    todayRevenue: payments
      .filter(p => {
        const today = new Date().toDateString();
        return p.status === 'completed' && new Date(p.create_time).toDateString() === today;
      })
      .reduce((sum, p) => sum + p.amount, 0),
    
    // Clients
    totalCustomers: customers.length,
    newCustomersToday: customers.filter(c => {
      const today = new Date().toDateString();
      return new Date(c.create_time).toDateString() === today;
    }).length,
    
    // Messages WhatsApp
    whatsappMessages: getNotificationsByChannel('whatsapp').length,
    todayMessages: getNotificationsByChannel('whatsapp').filter(n => {
      const today = new Date().toDateString();
      return new Date(n.create_time).toDateString() === today;
    }).length
  };

  // Calculer les tendances (comparaison avec hier)
  const yesterdayOrders = orders.filter(o => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(o.create_time).toDateString() === yesterday.toDateString();
  }).length;

  const yesterdayRevenue = payments
    .filter(p => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return p.status === 'completed' && new Date(p.create_time).toDateString() === yesterday.toDateString();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const ordersTrend = yesterdayOrders > 0 ? ((stats.todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0;
  const revenueTrend = yesterdayRevenue > 0 ? ((stats.todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  const isLoading = ordersLoading || customersLoading || paymentsLoading || notificationsLoading;

  // Mettre à jour le timestamp de dernière actualisation
  useEffect(() => {
    if (!isLoading) {
      setLastUpdate(new Date());
    }
  }, [isLoading, orders, customers, payments, notifications]);

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <TrendingUp className="w-3 h-3 text-green-600" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-600" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Indicateur de mise à jour en temps réel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className={`w-4 h-4 ${isLoading ? 'animate-pulse text-blue-600' : 'text-green-600'}`} />
          <span className="text-sm text-muted-foreground">
            {isLoading ? 'Mise à jour...' : `Dernière mise à jour: ${lastUpdate.toLocaleTimeString('fr-FR')}`}
          </span>
        </div>
        <Badge variant={isLoading ? "secondary" : "default"} className="text-xs">
          {isLoading ? 'Synchronisation' : 'En temps réel'}
        </Badge>
      </div>

      {/* Statistiques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Aujourd'hui</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                stats.todayOrders
              )}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(ordersTrend)}`}>
              {getTrendIcon(ordersTrend)}
              <span className="ml-1">
                {ordersTrend >= 0 ? '+' : ''}{ordersTrend.toFixed(1)}% vs hier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Aujourd'hui</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                `${stats.todayRevenue.toLocaleString()} FCFA`
              )}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(revenueTrend)}`}>
              {getTrendIcon(revenueTrend)}
              <span className="ml-1">
                {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}% vs hier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                stats.newCustomersToday
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Total: {stats.totalCustomers} clients</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages WhatsApp</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                stats.todayMessages
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Total: {stats.whatsappMessages} messages</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes en temps réel */}
      {stats.pendingOrders > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} en attente de traitement
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
