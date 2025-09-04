/**
 * Hook personnalisé pour la gestion des profils
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MerchantProfile } from '@/lib/subscription-validation';

interface UseProfileReturn {
  profile: MerchantProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<MerchantProfile>) => Promise<void>;
  updateSettings: (settings: Record<string, any>) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le profil
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/next_api/merchants/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors du chargement du profil');
      }

      const result = await response.json();
      setProfile(result.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement du profil:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour le profil
  const updateProfile = useCallback(async (data: Partial<MerchantProfile>) => {
    try {
      setError(null);

      const response = await fetch('/next_api/merchants/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors de la mise à jour du profil');
      }

      const result = await response.json();
      setProfile(result.data);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Mettre à jour seulement les paramètres
  const updateSettings = useCallback(async (settings: Record<string, any>) => {
    try {
      setError(null);

      const response = await fetch('/next_api/merchants/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors de la mise à jour des paramètres');
      }

      // Recharger le profil complet
      await fetchProfile();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchProfile]);

  // Charger le profil au montage
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updateSettings,
    refetch: fetchProfile
  };
};