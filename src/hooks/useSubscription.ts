/**
 * Hook personnalisé pour la gestion des abonnements
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Subscription } from '@/lib/subscription-validation';
import { apiCache } from '@/lib/api-cache';

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
  const fetchSubscription = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'subscription-data';
    
    // Vérifier le cache d'abord (sauf si refresh forcé)
    if (!forceRefresh && apiCache.has(cacheKey)) {
      const cachedData = apiCache.get(cacheKey);
      setData(cachedData);
      setIsLoading(false);
      return;
    }

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
        
        // Ne pas traiter les erreurs d'authentification comme des erreurs fatales
        if (response.status === 401 || response.status === 403) {
          console.warn('Utilisateur non authentifié pour l\'abonnement');
          setData(null);
          apiCache.delete(cacheKey);
          return;
        }
        
        throw new Error(errorData.error?.message || 'Erreur lors du chargement de l\'abonnement');
      }

      const result = await response.json();
      setData(result.data);
      
      // Mettre en cache pour 2 minutes
      apiCache.set(cacheKey, result.data, 2 * 60 * 1000);
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'abonnement:', err);
      
      // Ne pas afficher d'erreur pour les problèmes d'authentification
      if (!err.message?.includes('401') && !err.message?.includes('403')) {
        setError(err.message);
      }
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
    refetch: () => fetchSubscription(true),
    createSubscription,
    cancelSubscription,
    checkFeature,
    canCreateOrder
  };
};