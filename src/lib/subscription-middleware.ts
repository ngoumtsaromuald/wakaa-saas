/**
 * Middleware pour vérifier les limites d'abonnement
 */

import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from './subscription-service';
import { 
  SubscriptionErrorCode, 
  formatSubscriptionError, 
  logSubscriptionError 
} from './subscription-errors';
import { AuthUser } from './auth-middleware';

export interface SubscriptionCheckOptions {
  action: 'create_order' | 'create_product' | 'add_customer' | 'use_feature';
  featureName?: string;
  skipForRoles?: string[];
}

// Middleware pour vérifier les limites d'abonnement
export const withSubscriptionCheck = (
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>,
  options: SubscriptionCheckOptions
) => {
  return async (request: NextRequest, user: AuthUser): Promise<Response> => {
    
    // Ignorer la vérification pour certains rôles (admin, etc.)
    if (options.skipForRoles && options.skipForRoles.includes(user.role)) {
      return handler(request, user);
    }

    // Seuls les marchands ont des limites d'abonnement
    if (user.role !== 'merchant') {
      return handler(request, user);
    }

    try {
      const subscriptionService = new SubscriptionService();
      
      const { allowed, error } = await subscriptionService.canPerformAction(
        user.id,
        options.action,
        options.featureName
      );

      if (!allowed && error) {
        logSubscriptionError(error, {
          userId: user.id,
          email: user.email,
          action: options.action,
          featureName: options.featureName
        });

        return Response.json(
          formatSubscriptionError(error),
          { status: error.statusCode }
        );
      }

      // Si l'action est autorisée, continuer avec le handler
      const response = await handler(request, user);

      // Incrémenter l'utilisation si c'est une création de commande réussie
      if (options.action === 'create_order' && response.ok) {
        try {
          await subscriptionService.incrementOrderUsage(user.id);
        } catch (incrementError) {
          console.error('Erreur lors de l\'incrémentation de l\'utilisation:', incrementError);
          // Ne pas faire échouer la requête pour cette erreur
        }
      }

      return response;

    } catch (error) {
      console.error('Erreur dans le middleware d\'abonnement:', error);
      
      // En cas d'erreur du middleware, on laisse passer la requête
      // pour éviter de bloquer complètement l'application
      return handler(request, user);
    }
  };
};

// Middleware spécialisé pour les commandes
export const withOrderLimitCheck = (
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) => {
  return withSubscriptionCheck(handler, {
    action: 'create_order'
  });
};

// Middleware spécialisé pour les produits
export const withProductLimitCheck = (
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) => {
  return withSubscriptionCheck(handler, {
    action: 'create_product'
  });
};

// Middleware spécialisé pour les clients
export const withCustomerLimitCheck = (
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) => {
  return withSubscriptionCheck(handler, {
    action: 'add_customer'
  });
};

// Middleware spécialisé pour les fonctionnalités
export const withFeatureCheck = (
  featureName: string,
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) => {
  return withSubscriptionCheck(handler, {
    action: 'use_feature',
    featureName
  });
};

// Utilitaire pour obtenir les informations d'abonnement dans les composants
export const getSubscriptionInfo = async (merchantId: string) => {
  try {
    const subscriptionService = new SubscriptionService();
    return await subscriptionService.getUsageStats(merchantId);
  } catch (error) {
    console.error('Erreur lors de la récupération des infos d\'abonnement:', error);
    return {
      orders: { used: 0, limit: null },
      subscription: null,
      isExpiringSoon: false
    };
  }
};

// Vérifier si une fonctionnalité est disponible
export const isFeatureAvailable = async (
  merchantId: string, 
  featureName: string
): Promise<boolean> => {
  try {
    const subscriptionService = new SubscriptionService();
    const { allowed } = await subscriptionService.canPerformAction(
      merchantId,
      'use_feature',
      featureName
    );
    return allowed;
  } catch (error) {
    console.error('Erreur lors de la vérification de la fonctionnalité:', error);
    return false;
  }
};