/**
 * Service de gestion des abonnements et limites
 */

import { CrudOperations } from './api-utils';
import { 
  SubscriptionErrorCode, 
  createSubscriptionError, 
  logSubscriptionError 
} from './subscription-errors';
import { 
  Subscription, 
  MerchantProfile,
  checkSubscriptionLimits,
  isSubscriptionExpired,
  isSubscriptionExpiringSoon,
  calculateSubscriptionDates
} from './subscription-validation';

export class SubscriptionService {
  private subscriptionsCrud: CrudOperations;
  private merchantsCrud: CrudOperations;
  private ordersCrud: CrudOperations;
  private productsCrud: CrudOperations;
  private customersCrud: CrudOperations;

  constructor() {
    this.subscriptionsCrud = new CrudOperations('subscriptions');
    this.merchantsCrud = new CrudOperations('merchants');
    this.ordersCrud = new CrudOperations('orders');
    this.productsCrud = new CrudOperations('products');
    this.customersCrud = new CrudOperations('customers');
  }

  // Obtenir l'abonnement actif d'un marchand
  async getActiveSubscription(merchantId: string): Promise<Subscription | null> {
    try {
      const subscriptions = await this.subscriptionsCrud.findMany({
        merchant_id: merchantId,
        status: 'active'
      }, 1);

      if (!subscriptions || subscriptions.length === 0) {
        return null;
      }

      const subscription = subscriptions[0] as Subscription;

      // Vérifier si l'abonnement a expiré
      if (isSubscriptionExpired(subscription)) {
        await this.expireSubscription(subscription.id);
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
    }
  }

  // Vérifier si un marchand peut effectuer une action
  async canPerformAction(
    merchantId: string, 
    action: 'create_order' | 'create_product' | 'add_customer' | 'use_feature',
    featureName?: string
  ): Promise<{ allowed: boolean; error?: any }> {
    
    const subscription = await this.getActiveSubscription(merchantId);
    
    if (!subscription) {
      const error = createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
      return { allowed: false, error };
    }

    // Vérifier le statut de l'abonnement
    if (subscription.status !== 'active') {
      let errorCode: SubscriptionErrorCode;
      
      switch (subscription.status) {
        case 'expired':
          errorCode = SubscriptionErrorCode.SUBSCRIPTION_EXPIRED;
          break;
        case 'suspended':
          errorCode = SubscriptionErrorCode.SUBSCRIPTION_SUSPENDED;
          break;
        case 'cancelled':
          errorCode = SubscriptionErrorCode.SUBSCRIPTION_CANCELLED;
          break;
        default:
          errorCode = SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND;
      }
      
      const error = createSubscriptionError(errorCode);
      return { allowed: false, error };
    }

    // Vérifier les limites selon l'action
    switch (action) {
      case 'create_order':
        return await this.checkOrderLimit(subscription);
      
      case 'create_product':
        return await this.checkProductLimit(subscription);
      
      case 'add_customer':
        return await this.checkCustomerLimit(subscription);
      
      case 'use_feature':
        return this.checkFeatureAccess(subscription, featureName);
      
      default:
        return { allowed: true };
    }
  }

  // Vérifier la limite de commandes
  private async checkOrderLimit(subscription: Subscription): Promise<{ allowed: boolean; error?: any }> {
    if (subscription.orders_limit === null || subscription.orders_limit === undefined) {
      return { allowed: true }; // Illimité
    }

    const currentOrders = await this.ordersCrud.findMany({
      merchant_id: subscription.merchant_id
    });

    const orderCount = currentOrders?.length || 0;

    if (orderCount >= subscription.orders_limit) {
      const error = createSubscriptionError(
        SubscriptionErrorCode.ORDERS_LIMIT_EXCEEDED,
        { 
          current: orderCount, 
          limit: subscription.orders_limit,
          plan: subscription.plan_type
        }
      );
      return { allowed: false, error };
    }

    return { allowed: true };
  }

  // Vérifier la limite de produits
  private async checkProductLimit(subscription: Subscription): Promise<{ allowed: boolean; error?: any }> {
    // Cette limite peut être ajoutée selon les besoins du business
    // Pour l'instant, on retourne toujours autorisé
    return { allowed: true };
  }

  // Vérifier la limite de clients
  private async checkCustomerLimit(subscription: Subscription): Promise<{ allowed: boolean; error?: any }> {
    // Cette limite peut être ajoutée selon les besoins du business
    // Pour l'instant, on retourne toujours autorisé
    return { allowed: true };
  }

  // Vérifier l'accès à une fonctionnalité
  private checkFeatureAccess(
    subscription: Subscription, 
    featureName?: string
  ): { allowed: boolean; error?: any } {
    
    if (!featureName) {
      return { allowed: true };
    }

    const hasFeature = subscription.features[featureName] === true;
    
    if (!hasFeature) {
      const error = createSubscriptionError(
        SubscriptionErrorCode.FEATURES_NOT_AVAILABLE,
        { 
          feature: featureName,
          plan: subscription.plan_type,
          availableFeatures: Object.keys(subscription.features).filter(
            key => subscription.features[key] === true
          )
        }
      );
      return { allowed: false, error };
    }

    return { allowed: true };
  }

  // Incrémenter l'utilisation des commandes
  async incrementOrderUsage(merchantId: string): Promise<void> {
    const subscription = await this.getActiveSubscription(merchantId);
    
    if (subscription) {
      await this.subscriptionsCrud.update(subscription.id, {
        orders_used: subscription.orders_used + 1,
        modify_time: new Date().toISOString()
      });
    }
  }

  // Créer un nouvel abonnement
  async createSubscription(data: {
    merchant_id: string;
    plan_type: 'free' | 'standard' | 'premium';
    billing_cycle?: 'monthly' | 'yearly';
    start_date?: string;
  }): Promise<Subscription> {
    
    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existingSubscription = await this.getActiveSubscription(data.merchant_id);
    if (existingSubscription) {
      throw createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_ALREADY_EXISTS);
    }

    const startDate = new Date(data.start_date || new Date());
    const billingCycle = data.billing_cycle || 'monthly';
    
    const { nextBillingDate, endDate } = calculateSubscriptionDates(startDate, billingCycle);

    // Configuration des plans
    const planConfigs = {
      free: {
        price: 0,
        orders_limit: 10,
        features: {
          whatsapp_integration: true,
          basic_analytics: true,
          customer_management: true,
          email_support: false,
          api_access: false,
          advanced_analytics: false
        }
      },
      standard: {
        price: billingCycle === 'yearly' ? 50000 : 5000,
        orders_limit: 500,
        features: {
          whatsapp_integration: true,
          basic_analytics: true,
          customer_management: true,
          email_support: true,
          api_access: false,
          advanced_analytics: true,
          payment_integration: true
        }
      },
      premium: {
        price: billingCycle === 'yearly' ? 100000 : 10000,
        orders_limit: null,
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
    };

    const planConfig = planConfigs[data.plan_type];

    const subscriptionData = {
      merchant_id: data.merchant_id,
      plan_type: data.plan_type,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      next_billing_date: nextBillingDate.toISOString(),
      price: planConfig.price,
      currency: 'FCFA',
      billing_cycle: billingCycle,
      orders_limit: planConfig.orders_limit,
      orders_used: 0,
      features: planConfig.features,
      auto_renew: true
    };

    const subscription = await this.subscriptionsCrud.create(subscriptionData);
    
    // Mettre à jour le plan du marchand
    await this.merchantsCrud.update(data.merchant_id, {
      subscription_plan: data.plan_type,
      modify_time: new Date().toISOString()
    });

    return subscription as Subscription;
  }

  // Mettre à niveau un abonnement
  async upgradeSubscription(
    merchantId: string, 
    newPlanType: 'standard' | 'premium',
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<Subscription> {
    
    const currentSubscription = await this.getActiveSubscription(merchantId);
    
    if (!currentSubscription) {
      throw createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
    }

    // Annuler l'abonnement actuel
    await this.subscriptionsCrud.update(currentSubscription.id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
      modify_time: new Date().toISOString()
    });

    // Créer le nouvel abonnement
    return await this.createSubscription({
      merchant_id: merchantId,
      plan_type: newPlanType,
      billing_cycle: billingCycle
    });
  }

  // Annuler un abonnement
  async cancelSubscription(merchantId: string): Promise<void> {
    const subscription = await this.getActiveSubscription(merchantId);
    
    if (!subscription) {
      throw createSubscriptionError(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND);
    }

    await this.subscriptionsCrud.update(subscription.id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
      modify_time: new Date().toISOString()
    });

    // Rétrograder vers le plan gratuit
    await this.merchantsCrud.update(merchantId, {
      subscription_plan: 'free',
      modify_time: new Date().toISOString()
    });
  }

  // Faire expirer un abonnement
  private async expireSubscription(subscriptionId: string): Promise<void> {
    await this.subscriptionsCrud.update(subscriptionId, {
      status: 'expired',
      modify_time: new Date().toISOString()
    });
  }

  // Obtenir les statistiques d'utilisation
  async getUsageStats(merchantId: string): Promise<{
    orders: { used: number; limit: number | null };
    subscription: Subscription | null;
    isExpiringSoon: boolean;
  }> {
    
    const subscription = await this.getActiveSubscription(merchantId);
    
    if (!subscription) {
      return {
        orders: { used: 0, limit: null },
        subscription: null,
        isExpiringSoon: false
      };
    }

    const orders = await this.ordersCrud.findMany({
      merchant_id: merchantId
    });

    return {
      orders: {
        used: orders?.length || 0,
        limit: subscription.orders_limit ?? null
      },
      subscription,
      isExpiringSoon: isSubscriptionExpiringSoon(subscription)
    };
  }

  // Obtenir les abonnements expirant bientôt
  async getExpiringSoonSubscriptions(daysThreshold: number = 7): Promise<Subscription[]> {
    const allActiveSubscriptions = await this.subscriptionsCrud.findMany({
      status: 'active'
    });

    if (!allActiveSubscriptions) return [];

    return allActiveSubscriptions.filter((sub: Subscription) => 
      isSubscriptionExpiringSoon(sub, daysThreshold)
    );
  }
}