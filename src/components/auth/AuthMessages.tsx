"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/useToast';

export function AuthMessages() {
  const { user, error: authError } = useAuth();
  const { data: subscriptionData, error: subscriptionError } = useSubscription();
  const { error: toastError, warning } = useToast();
  const hasShownAuthError = useRef(false);
  const hasShownSubscriptionWarning = useRef(false);

  // Gérer les erreurs d'authentification
  useEffect(() => {
    if (authError && !hasShownAuthError.current) {
      // Ne montrer les erreurs d'auth que si c'est vraiment critique
      if (authError.includes('Session expirée') || authError.includes('Token invalide')) {
        toastError('Session expirée. Veuillez vous reconnecter.', {
          id: 'auth-session-expired',
          duration: 5000
        });
        hasShownAuthError.current = true;
        
        // Reset après 10 secondes
        setTimeout(() => {
          hasShownAuthError.current = false;
        }, 10000);
      }
    }
  }, [authError, toastError]);

  // Gérer les messages d'abonnement
  useEffect(() => {
    if (user?.role === 'merchant' && subscriptionData && !hasShownSubscriptionWarning.current) {
      // Vérifier si l'utilisateur n'a pas d'abonnement
      if (!subscriptionData.subscription) {
        warning('Vous devez souscrire à un abonnement pour accéder à toutes les fonctionnalités.', {
          id: 'subscription-required',
          duration: 6000
        });
        hasShownSubscriptionWarning.current = true;
        
        // Reset après 30 secondes
        setTimeout(() => {
          hasShownSubscriptionWarning.current = false;
        }, 30000);
      }
      // Vérifier si l'abonnement expire bientôt
      else if (subscriptionData.alerts?.isExpiringSoon) {
        warning('Votre abonnement expire bientôt. Pensez à le renouveler.', {
          id: 'subscription-expiring',
          duration: 6000
        });
        hasShownSubscriptionWarning.current = true;
        
        setTimeout(() => {
          hasShownSubscriptionWarning.current = false;
        }, 30000);
      }
    }
  }, [user, subscriptionData, warning]);

  // Gérer les erreurs d'abonnement (silencieusement)
  useEffect(() => {
    if (subscriptionError) {
      console.warn('Erreur d\'abonnement (silencieuse):', subscriptionError);
    }
  }, [subscriptionError]);

  return null; // Ce composant ne rend rien visuellement
}