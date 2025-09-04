
"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

interface Payment {
  id: number;
  order_id: number;
  merchant_id: number;
  amount: number;
  currency: string;
  provider: string;
  transaction_id?: string;
  external_transaction_id?: string;
  status: string;
  payment_method?: string;
  customer_phone?: string;
  webhook_data?: any;
  failure_reason?: string;
  processed_at?: string;
  expires_at?: string;
  create_time: string;
  modify_time: string;
}

interface UsePaymentsOptions {
  merchantId?: number;
  orderId?: number;
  status?: string;
  provider?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (searchParams?: Record<string, string>) => {
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

      if (options.orderId) {
        params.order_id = options.orderId.toString();
      }

      if (options.status) {
        params.status = options.status;
      }

      if (options.provider) {
        params.provider = options.provider;
      }

      const data = await api.get<Payment[]>('/payments', params);
      setPayments(data || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des paiements';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options.merchantId, options.orderId, options.status, options.provider]);

  const createPayment = async (paymentData: Partial<Payment>) => {
    try {
      const newPayment = await api.post<Payment>('/payments', paymentData);
      setPayments(prev => [newPayment, ...prev]);
      toast.success('Paiement créé avec succès');
      return newPayment;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création du paiement';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updatePayment = async (paymentId: number, updateData: Partial<Payment>) => {
    try {
      const updatedPayment = await api.put<Payment>(`/payments?id=${paymentId}`, updateData);
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? updatedPayment : payment
      ));
      toast.success('Paiement mis à jour avec succès');
      return updatedPayment;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du paiement';
      toast.error(errorMessage);
      throw err;
    }
  };

  const cancelPayment = async (paymentId: number) => {
    try {
      await api.delete(`/payments?id=${paymentId}`);
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'cancelled', modify_time: new Date().toISOString() }
          : payment
      ));
      toast.success('Paiement annulé avec succès');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de l\'annulation du paiement';
      toast.error(errorMessage);
      throw err;
    }
  };

  const createCinetPayLink = async (orderData: {
    order_id: number;
    amount: number;
    customer_phone: string;
    customer_name?: string;
    description?: string;
  }) => {
    try {
      const paymentLink = await api.post('/cinetpay/payment-links', orderData);
      toast.success('Lien de paiement CinetPay créé');
      return paymentLink;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création du lien de paiement';
      toast.error(errorMessage);
      throw err;
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const status = await api.get(`/cinetpay/payment-links?transaction_id=${transactionId}`);
      return status;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la vérification du statut';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getPaymentById = (paymentId: number): Payment | undefined => {
    return payments.find(payment => payment.id === paymentId);
  };

  const getPaymentsByStatus = (status: string): Payment[] => {
    return payments.filter(payment => payment.status === status);
  };

  const getPaymentsByProvider = (provider: string): Payment[] => {
    return payments.filter(payment => payment.provider === provider);
  };

  const getTotalAmount = (status?: string): number => {
    const filteredPayments = status 
      ? payments.filter(p => p.status === status)
      : payments;
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  // Auto-refresh si activé
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchPayments();
      }, options.refreshInterval || 30000); // 30 secondes par défaut

      return () => clearInterval(interval);
    }
  }, [fetchPayments, options.autoRefresh, options.refreshInterval]);

  // Chargement initial
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createPayment,
    updatePayment,
    cancelPayment,
    createCinetPayLink,
    checkPaymentStatus,
    getPaymentById,
    getPaymentsByStatus,
    getPaymentsByProvider,
    getTotalAmount,
    refresh: fetchPayments
  };
}
