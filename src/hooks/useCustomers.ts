
"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

interface Customer {
  id: number;
  merchant_id: number;
  phone_number: string;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  create_time: string;
  modify_time: string;
}

interface UseCustomersOptions {
  merchantId?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (searchParams?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {
        limit: '1000',
        offset: '0',
        ...searchParams
      };

      if (options.merchantId) {
        params.merchant_id = options.merchantId.toString();
      }

      const data = await api.get<Customer[]>('/customers', params);
      setCustomers(data || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des clients';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options.merchantId]);

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const newCustomer = await api.post<Customer>('/customers', {
        ...customerData,
        merchant_id: options.merchantId || customerData.merchant_id
      });
      setCustomers(prev => [newCustomer, ...prev]);
      toast.success('Client créé avec succès');
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création du client';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateCustomer = async (customerId: number, updateData: Partial<Customer>) => {
    try {
      const updatedCustomer = await api.put<Customer>(`/customers?id=${customerId}`, updateData);
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? updatedCustomer : customer
      ));
      toast.success('Client mis à jour avec succès');
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du client';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteCustomer = async (customerId: number) => {
    try {
      await api.delete(`/customers?id=${customerId}`);
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      toast.success('Client supprimé avec succès');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la suppression du client';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getCustomerById = (customerId: number): Customer | undefined => {
    return customers.find(customer => customer.id === customerId);
  };

  const getCustomerByPhone = (phoneNumber: string): Customer | undefined => {
    return customers.find(customer => customer.phone_number === phoneNumber);
  };

  const searchCustomers = (searchTerm: string): Customer[] => {
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name?.toLowerCase().includes(term) ||
      customer.phone_number.includes(term) ||
      customer.email?.toLowerCase().includes(term)
    );
  };

  // Auto-refresh si activé
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchCustomers();
      }, options.refreshInterval || 60000); // 1 minute par défaut

      return () => clearInterval(interval);
    }
  }, [fetchCustomers, options.autoRefresh, options.refreshInterval]);

  // Chargement initial
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomerByPhone,
    searchCustomers,
    refresh: fetchCustomers
  };
}
