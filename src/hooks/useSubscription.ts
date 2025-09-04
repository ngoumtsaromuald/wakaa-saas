/**
 * Hook personnalisé pour la gestion des abonnements
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Subscription } from '@/lib/subscription-validation';

interface SubscriptionData {
  subscription: Subscription | null;
  usage: {
    orders: { used: number; limit: number | null };
  };
  alerts: {
    isExpiringSoon: boolean;
    isNearOrderLimit: boolean;
  };
}

interface UseSubscriptionReturn {
  data: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSubscription: (planType: string, billingCycle?: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkFeature: (featureName: string) => boolean;
  canCreateOrder: () => boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les données d'abonnement
  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/next_api/merchants/subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors du chargement de l\'abonnement');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'abonnement:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Créer ou mettre à niveau un abonnement
  const createSubscription = useCallback(async (planType: string, billingCycle: string = 'monthly') => {
    try {
      setError(null);

      const response = await fetch('/next_api/merchants/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan_type: planType,
          billing_cycle: billingCycle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors de la création de l\'abonnement');
      }

      // Recharger les données après création
      await fetchSubscription();
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'abonnement:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchSubscription]);

  // Annuler un abonnement
  const cancelSubscription = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/next_api/merchants/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors de l\'annulation de l\'abonnement');
      }

      // Recharger les données après annulation
      await fetchSubscription();
    } catch (err: any) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchSubscription]);

  // Vérifier si une fonctionnalité est disponible
  const checkFeature = useCallback((featureName: string): boolean => {
    if (!data?.subscription) return false;
    return data.subscription.features[featureName] === true;
  }, [data]);

  // Vérifier si on peut créer une commande
  const canCreateOrder = useCallback((): boolean => {
    if (!data?.subscription) return false;
    
    // Si l'abonnement n'est pas actif
    if (data.subscription.status !== 'active') return false;
    
    // Si pas de limite, toujours autorisé
    if (!data.usage.orders.limit) return true;
    
    // Vérifier la limite
    return data.usage.orders.used < data.usage.orders.limit;
  }, [data]);

  // Charger les données au montage
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSubscription,
    createSubscription,
    cancelSubscription,
    checkFeature,
    canCreateOrder
  };
};