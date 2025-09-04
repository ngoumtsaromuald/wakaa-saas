/**
 * Composant d'affichage des plans tarifaires
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Star,
  TrendingUp
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  ordersLimit: number | null;
  features: {
    [key: string]: boolean;
  };
  popular?: boolean;
  recommended?: boolean;
}

interface PricingPlansProps {
  currentPlan?: string;
  onSelectPlan: (planId: string, billingCycle: 'monthly' | 'yearly') => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Gratuit',
    description: 'Parfait pour commencer',
    monthlyPrice: 0,
    yearlyPrice: 0,
    ordersLimit: 10,
    features: {
      whatsapp_integration: true,
      basic_analytics: true,
      customer_management: true,
      email_support: false,
      api_access: false,
      advanced_analytics: false,
      payment_integration: false,
      priority_support: false,
      custom_integrations: false
    }
  },
  {
    id: 'standard',
    name: 'standard',
    displayName: 'Standard',
    description: 'Idéal pour les petites entreprises',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    ordersLimit: 500,
    popular: true,
    features: {
      whatsapp_integration: true,
      basic_analytics: true,
      customer_management: true,
      email_support: true,
      api_access: false,
      advanced_analytics: true,
      payment_integration: true,
      priority_support: false,
      custom_integrations: false
    }
  },
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    description: 'Pour les entreprises en croissance',
    monthlyPrice: 10000,
    yearlyPrice: 100000,
    ordersLimit: null,
    recommended: true,
    features: {
      whatsapp_integration: true,
      basic_analytics: true,
      customer_management: true,
      email_support: true,
      api_access: true,
      advanced_analytics: true,
      payment_integration: true,
      priority_support: true,
      custom_integrations: true
    }
  }
];

const FEATURE_LABELS: Record<string, string> = {
  whatsapp_integration: 'Intégration WhatsApp',
  basic_analytics: 'Analytics de base',
  customer_management: 'Gestion des clients',
  email_support: 'Support par email',
  api_access: 'Accès API',
  advanced_analytics: 'Analytics avancées',
  payment_integration: 'Intégration de paiement',
  priority_support: 'Support prioritaire',
  custom_integrations: 'Intégrations personnalisées'
};

export const PricingPlans: React.FC<PricingPlansProps> = ({
  currentPlan,
  onSelectPlan,
  isLoading = false,
  className = ''
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPrice = (plan: PricingPlan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 0;
    const monthlyTotal = plan.monthlyPrice * 12;
    const yearlySavings = monthlyTotal - plan.yearlyPrice;
    return Math.round((yearlySavings / monthlyTotal) * 100);
  };

  const handleSelectPlan = async (planId: string) => {
    if (isLoading || selectedPlan) return;
    
    setSelectedPlan(planId);
    try {
      await onSelectPlan(planId, billingCycle);
    } catch (error) {
      console.error('Erreur lors de la sélection du plan:', error);
    } finally {
      setSelectedPlan(null);
    }
  };

  const isCurrentPlan = (planId: string) => currentPlan === planId;
  const isUpgrade = (planId: string) => {
    const planOrder = { free: 0, standard: 1, premium: 2 };
    const currentOrder = planOrder[currentPlan as keyof typeof planOrder] || -1;
    const targetOrder = planOrder[planId as keyof typeof planOrder];
    return targetOrder > currentOrder;
  };

  return (
    <div className={className}>
      {/* Toggle de facturation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annuel
            <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
              Économisez jusqu'à 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const isCurrent = isCurrentPlan(plan.id);
          const isUpgradeOption = isUpgrade(plan.id);
          const isProcessing = selectedPlan === plan.id;

          return (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              } ${
                plan.recommended ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* Badge populaire/recommandé */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Populaire
                  </Badge>
                </div>
              )}
              
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Recommandé
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                <p className="text-gray-600 text-sm">{plan.description}</p>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {price === 0 ? 'Gratuit' : formatPrice(price)}
                  </div>
                  {price > 0 && (
                    <div className="text-sm text-gray-600">
                      /{billingCycle === 'monthly' ? 'mois' : 'an'}
                      {billingCycle === 'yearly' && savings > 0 && (
                        <span className="text-green-600 ml-2">
                          (Économisez {savings}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Limite de commandes */}
                <div className="text-sm text-gray-600 mt-2">
                  {plan.ordersLimit 
                    ? `${plan.ordersLimit} commandes/mois`
                    : 'Commandes illimitées'
                  }
                </div>
              </CardHeader>

              <CardContent>
                {/* Fonctionnalités */}
                <div className="space-y-3 mb-6">
                  {Object.entries(FEATURE_LABELS).map(([feature, label]) => {
                    const hasFeature = plan.features[feature];
                    return (
                      <div key={feature} className="flex items-center gap-2">
                        {hasFeature ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300" />
                        )}
                        <span className={`text-sm ${
                          hasFeature ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bouton d'action */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent || isLoading || isProcessing}
                  className={`w-full ${
                    isCurrent 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : plan.recommended 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : ''
                  }`}
                  variant={isCurrent ? 'outline' : 'default'}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Traitement...
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Plan actuel
                    </>
                  ) : isUpgradeOption ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Mettre à niveau
                    </>
                  ) : plan.id === 'free' ? (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Rétrograder
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Choisir ce plan
                    </>
                  )}
                </Button>

                {isCurrent && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Vous utilisez actuellement ce plan
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note sur les prix */}
      <div className="text-center mt-8 text-sm text-gray-600">
        <p>Tous les prix sont en Francs CFA (FCFA)</p>
        <p>Vous pouvez changer ou annuler votre abonnement à tout moment</p>
      </div>
    </div>
  );
};