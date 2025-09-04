/**
 * Composant d'affichage des informations d'abonnement
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';
import { Subscription } from '@/lib/subscription-validation';

interface SubscriptionCardProps {
  subscription: Subscription | null;
  usage: {
    orders: { used: number; limit: number | null };
  };
  alerts: {
    isExpiringSoon: boolean;
    isNearOrderLimit: boolean;
  };
  onUpgrade?: () => void;
  onCancel?: () => void;
  className?: string;
}

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  standard: 'bg-blue-100 text-blue-800',
  premium: 'bg-purple-100 text-purple-800'
};

const PLAN_NAMES = {
  free: 'Gratuit',
  standard: 'Standard',
  premium: 'Premium'
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  suspended: 'bg-yellow-100 text-yellow-800'
};

const STATUS_NAMES = {
  active: 'Actif',
  cancelled: 'Annulé',
  expired: 'Expiré',
  suspended: 'Suspendu'
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  usage,
  alerts,
  onUpgrade,
  onCancel,
  className = ''
}) => {
  if (!subscription) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Aucun abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas d'abonnement actif. Créez un compte pour commencer.
          </p>
          {onUpgrade && (
            <Button onClick={onUpgrade} className="w-full">
              Choisir un plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'FCFA' ? 'XAF' : currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const getOrdersProgress = () => {
    if (!usage.orders.limit) return 0;
    return (usage.orders.used / usage.orders.limit) * 100;
  };

  const getOrdersColor = () => {
    const progress = getOrdersProgress();
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 75) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mon abonnement
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={PLAN_COLORS[subscription.plan_type]}>
              {PLAN_NAMES[subscription.plan_type]}
            </Badge>
            <Badge className={STATUS_COLORS[subscription.status]}>
              {STATUS_NAMES[subscription.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alertes */}
        {(alerts.isExpiringSoon || alerts.isNearOrderLimit) && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="space-y-1">
                {alerts.isExpiringSoon && (
                  <p className="text-sm text-orange-800">
                    Votre abonnement expire bientôt
                  </p>
                )}
                {alerts.isNearOrderLimit && (
                  <p className="text-sm text-orange-800">
                    Vous approchez de votre limite de commandes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informations de base */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              Prix
            </div>
            <p className="font-semibold">
              {subscription.price === 0 
                ? 'Gratuit' 
                : `${formatPrice(subscription.price, subscription.currency)}/${subscription.billing_cycle === 'monthly' ? 'mois' : 'an'}`
              }
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {subscription.next_billing_date ? 'Prochaine facturation' : 'Date de fin'}
            </div>
            <p className="font-semibold">
              {subscription.next_billing_date 
                ? formatDate(subscription.next_billing_date)
                : subscription.end_date 
                  ? formatDate(subscription.end_date)
                  : 'N/A'
              }
            </p>
          </div>
        </div>

        {/* Utilisation des commandes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              Commandes utilisées
            </div>
            <span className="text-sm font-medium">
              {usage.orders.used} / {usage.orders.limit || '∞'}
            </span>
          </div>
          
          {usage.orders.limit && (
            <div className="space-y-1">
              <Progress 
                value={getOrdersProgress()} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {usage.orders.limit - usage.orders.used} commandes restantes
              </p>
            </div>
          )}
        </div>

        {/* Fonctionnalités */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fonctionnalités incluses</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(subscription.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center gap-2">
                {enabled ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-gray-300" />
                )}
                <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                  {feature.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {subscription.plan_type !== 'premium' && onUpgrade && (
            <Button onClick={onUpgrade} className="flex-1">
              Mettre à niveau
            </Button>
          )}
          
          {subscription.plan_type !== 'free' && onCancel && (
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="flex-1"
            >
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};