/**
 * API pour la gestion des abonnements des marchands
 */

import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';
import { 
  withAuth,
  AuthUser 
} from '@/lib/auth-middleware';
import { 
  SubscriptionErrorCode, 
  createSubscriptionError, 
  formatSubscriptionError, 
  logSubscriptionError 
} from '@/lib/subscription-errors';
import { SubscriptionService } from '@/lib/subscription-service';
import { validateSubscription } from '@/lib/subscription-validation';

// GET - Obtenir l'abonnement et les statistiques d'utilisation du marchand
export const GET = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    logApiRequest(request, { userRole: user.role, userId: user.id });

    // Seuls les marchands peuvent accéder à leur abonnement
    if (user.role !== 'merchant') {
      const error = createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
      logSubscriptionError(error, { userId: user.id, role: user.role });
      return Response.json(formatSubscriptionError(error), { status: error.statusCode });
    }

    try {
      const subscriptionService = new SubscriptionService();
      const usageStats = await subscriptionService.getUsageStats(user.id);

      return successResponse({
        subscription: usageStats.subscription,
        usage: {
          orders: usageStats.orders
        },
        alerts: {
          isExpiringSoon: usageStats.isExpiringSoon,
          isNearOrderLimit: usageStats.orders.limit ? 
            (usageStats.orders.used / usageStats.orders.limit) > 0.8 : false
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      return errorResponse('Erreur lors de la récupération de l\'abonnement', 500);
    }
  },
  { requiredRoles: ['merchant'] }
);

// POST - Créer ou mettre à niveau un abonnement
export const POST = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const body = await validateRequestBody(request);
    logApiRequest(request, { userRole: user.role, userId: user.id });

    // Seuls les marchands peuvent gérer leur abonnement
    if (user.role !== 'merchant') {
      const error = createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
      logSubscriptionError(error, { userId: user.id, role: user.role });
      return Response.json(formatSubscriptionError(error), { status: error.statusCode });
    }

    try {
      const subscriptionService = new SubscriptionService();

      // Validation des données
      const subscriptionData = {
        merchant_id: user.id,
        plan_type: body.plan_type,
        billing_cycle: body.billing_cycle || 'monthly',
        start_date: body.start_date
      };

      const validationErrors = validateSubscription(subscriptionData);
      if (validationErrors.length > 0) {
        const error = createSubscriptionError(
          SubscriptionErrorCode.SUBSCRIPTION_INVALID_PLAN,
          { validationErrors }
        );
        logSubscriptionError(error, { userId: user.id, errors: validationErrors });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }

      // Vérifier s'il y a déjà un abonnement actif
      const existingSubscription = await subscriptionService.getActiveSubscription(user.id);
      
      let newSubscription;
      
      if (existingSubscription) {
        // Mise à niveau de l'abonnement existant
        if (body.plan_type === existingSubscription.plan_type) {
          return errorResponse('Vous avez déjà ce plan d\'abonnement', 400);
        }
        
        newSubscription = await subscriptionService.upgradeSubscription(
          user.id,
          body.plan_type,
          body.billing_cycle || 'monthly'
        );
        
        console.log(`Abonnement mis à niveau pour ${user.id}: ${existingSubscription.plan_type} -> ${body.plan_type}`);
      } else {
        // Création d'un nouvel abonnement
        newSubscription = await subscriptionService.createSubscription(subscriptionData);
        
        console.log(`Nouvel abonnement créé pour ${user.id}: ${body.plan_type}`);
      }

      return successResponse(newSubscription, 201);

    } catch (error: any) {
      if (error.code && Object.values(SubscriptionErrorCode).includes(error.code)) {
        logSubscriptionError(error, { userId: user.id });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }
      
      console.error('Erreur lors de la création/mise à niveau de l\'abonnement:', error);
      return errorResponse('Erreur lors de la gestion de l\'abonnement', 500);
    }
  },
  { requiredRoles: ['merchant'] }
);

// DELETE - Annuler l'abonnement
export const DELETE = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    logApiRequest(request, { userRole: user.role, userId: user.id });

    // Seuls les marchands peuvent annuler leur abonnement
    if (user.role !== 'merchant') {
      const error = createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
      logSubscriptionError(error, { userId: user.id, role: user.role });
      return Response.json(formatSubscriptionError(error), { status: error.statusCode });
    }

    try {
      const subscriptionService = new SubscriptionService();
      
      // Vérifier qu'il y a un abonnement à annuler
      const existingSubscription = await subscriptionService.getActiveSubscription(user.id);
      if (!existingSubscription) {
        const error = createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
        logSubscriptionError(error, { userId: user.id });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }

      // Ne pas permettre l'annulation du plan gratuit
      if (existingSubscription.plan_type === 'free') {
        return errorResponse('Impossible d\'annuler le plan gratuit', 400);
      }

      await subscriptionService.cancelSubscription(user.id);
      
      console.log(`Abonnement annulé pour ${user.id}: ${existingSubscription.plan_type}`);

      return successResponse({
        message: 'Abonnement annulé avec succès',
        newPlan: 'free',
        effectiveDate: new Date().toISOString()
      });

    } catch (error: any) {
      if (error.code && Object.values(SubscriptionErrorCode).includes(error.code)) {
        logSubscriptionError(error, { userId: user.id });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }
      
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      return errorResponse('Erreur lors de l\'annulation de l\'abonnement', 500);
    }
  },
  { requiredRoles: ['merchant'] }
);