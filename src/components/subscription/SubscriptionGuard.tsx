/**
 * Composant de garde pour vérifier les limites d'abonnement
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Lock, 
  TrendingUp, 
  Crown,
  Zap
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  action?: 'create_order' | 'create_product' | 'add_customer';
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const FEATURE_NAMES: Record<string, string> = {
  api_access: 'Accès API',
  advanced_analytics: 'Analytics avancées',
  priority_support: 'Support prioritaire',
  custom_integrations: 'Intégrations personnalisées',
  email_support: 'Support par email',
  payment_integration: 'Intégration de paiement'
};

const ACTION_NAMES: Record<string, string> = {
  create_order: 'créer des commandes',
  create_product: 'ajouter des produits',
  add_customer: 'ajouter des clients'
};

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  action,
  fallback,
  showUpgradePrompt = true,
  className = ''
}) => {
  const { data, isLoading, createSubscription } = useSubscription();

  // Pendant le chargement
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Pas d'abonnement
  if (!data?.subscription) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Abonnement requis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.
          </p>
          {showUpgradePrompt && (
            <Button 
              onClick={() => createSubscription('standard')}
              className="w-full"
            >
              <Crown className="h-4 w-4 mr-2" />
              Choisir un plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Abonnement inactif
  if (data.subscription.status !== 'active') {
    const statusMessages = {
      expired: 'Votre abonnement a expiré',
      cancelled: 'Votre abonnement a été annulé',
      suspended: 'Votre abonnement est suspendu'
    };

    if (fallback) return <>{fallback}</>;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Lock className="h-5 w-5" />
            Abonnement inactif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {statusMessages[data.subscription.status as keyof typeof statusMessages] || 'Votre abonnement n\'est pas actif'}
          </p>
          {showUpgradePrompt && (
            <Button 
              onClick={() => createSubscription('standard')}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Réactiver l'abonnement
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Vérification des fonctionnalités
  if (feature) {
    const hasFeature = data.subscription.features[feature] === true;
    
    if (!hasFeature) {
      if (fallback) return <>{fallback}</>;

      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Crown className="h-5 w-5" />
              Fonctionnalité premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              La fonctionnalité "{FEATURE_NAMES[feature] || feature}" n'est pas disponible dans votre plan actuel.
            </p>
            {showUpgradePrompt && data.subscription.plan_type !== 'premium' && (
              <Button 
                onClick={() => createSubscription('premium')}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Passer au plan Premium
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }
  }

  // Vérification des limites d'actions
  if (action === 'create_order') {
    const canCreate = data.usage.orders.limit === null || 
                     data.usage.orders.used < data.usage.orders.limit;
    
    if (!canCreate) {
      if (fallback) return <>{fallback}</>;

      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Limite atteinte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous avez atteint votre limite de {data.usage.orders.limit} commandes pour ce mois.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Commandes utilisées</span>
                <span>{data.usage.orders.used} / {data.usage.orders.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {showUpgradePrompt && data.subscription && data.subscription.plan_type !== 'premium' && (
              <Button 
                onClick={() => createSubscription(
                  data.subscription!.plan_type === 'free' ? 'standard' : 'premium'
                )}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {data.subscription!.plan_type === 'free' 
                  ? 'Passer au plan Standard' 
                  : 'Passer au plan Premium (illimité)'
                }
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }
  }

  // Alertes préventives
  const showOrderLimitWarning = data.usage.orders.limit && 
    (data.usage.orders.used / data.usage.orders.limit) > 0.8;

  return (
    <div className={className}>
      {/* Alerte de limite proche */}
      {showOrderLimitWarning && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Attention : vous approchez de votre limite de commandes ({data.usage.orders.used}/{data.usage.orders.limit}).
            {showUpgradePrompt && data.subscription && data.subscription.plan_type !== 'premium' && (
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2 text-orange-800 underline"
                onClick={() => createSubscription(
                  data.subscription!.plan_type === 'free' ? 'standard' : 'premium'
                )}
              >
                Mettre à niveau
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerte d'expiration proche */}
      {data.alerts.isExpiringSoon && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Votre abonnement expire bientôt. 
            {showUpgradePrompt && data.subscription && (
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2 text-yellow-800 underline"
                onClick={() => createSubscription(data.subscription!.plan_type)}
              >
                Renouveler
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {children}
    </div>
  );
};