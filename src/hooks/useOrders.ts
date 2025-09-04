
"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

interface Order {
  id: number;
  order_number: string;
  merchant_id: number;
  customer_id: number;
  items: any[];
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_id?: number;
  shipping_address?: any;
  notes?: string;
  whatsapp_message_id?: string;
  source: string;
  delivery_date?: string;
  tracking_number?: string;
  create_time: string;
  modify_time: string;
}

interface UseOrdersOptions {
  merchantId?: number;
  status?: string;
  paymentStatus?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (searchParams?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {
        limit: '100',
        offset: '0',
        ...searchParams
      };

      if (options.merchantId) {
        params.merchant_id = options.merchantId.toString();
      }

      if (options.status) {
        params.status = options.status;
      }

      if (options.paymentStatus) {
        params.payment_status = options.paymentStatus;
      }

      const data = await api.get<Order[]>('/orders', params);
      setOrders(data || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des commandes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options.merchantId, options.status, options.paymentStatus]);

  const createOrder = async (orderData: Partial<Order>) => {
    try {
      const newOrder = await api.post<Order>('/orders', orderData);
      setOrders(prev => [newOrder, ...prev]);
      toast.success('Commande créée avec succès');
      return newOrder;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création de la commande';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateOrder = async (orderId: number, updateData: Partial<Order>) => {
    try {
      const updatedOrder = await api.put<Order>(`/orders?id=${orderId}`, updateData);
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      toast.success('Commande mise à jour avec succès');
      return updatedOrder;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour de la commande';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      await api.delete(`/orders?id=${orderId}`);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('Commande supprimée avec succès');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la suppression de la commande';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getOrderById = (orderId: number): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  const getOrdersByStatus = (status: string): Order[] => {
    return orders.filter(order => order.status === status);
  };

  const getOrdersByPaymentStatus = (paymentStatus: string): Order[] => {
    return orders.filter(order => order.payment_status === paymentStatus);
  };

  // Auto-refresh si activé
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchOrders();
      }, options.refreshInterval || 30000); // 30 secondes par défaut

      return () => clearInterval(interval);
    }
  }, [fetchOrders, options.autoRefresh, options.refreshInterval]);

  // Chargement initial
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    getOrdersByStatus,
    getOrdersByPaymentStatus,
    refresh: fetchOrders
  };
}
