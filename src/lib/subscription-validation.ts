/**
 * Validation des données d'abonnement et de profil
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  orders_limit?: number;
  products_limit?: number;
  customers_limit?: number;
  features: Record<string, boolean>;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  merchant_id: string;
  plan_type: 'free' | 'standard' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  orders_limit?: number;
  orders_used: number;
  features: Record<string, boolean>;
  auto_renew: boolean;
}

export interface MerchantProfile {
  id: string;
  business_name: string;
  whatsapp_number?: string;
  email?: string;
  slug: string;
  subscription_plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'suspended' | 'inactive';
  profile_image_url?: string;
  address?: string;
  city?: string;
  country: string;
  currency: string;
  timezone: string;
  settings: Record<string, any>;
}

// Validation des plans d'abonnement
export const validateSubscriptionPlan = (plan: Partial<SubscriptionPlan>): string[] => {
  const errors: string[] = [];

  if (!plan.name || plan.name.trim().length === 0) {
    errors.push('Le nom du plan est obligatoire');
  }

  if (!plan.display_name || plan.display_name.trim().length === 0) {
    errors.push('Le nom d\'affichage du plan est obligatoire');
  }

  if (plan.price === undefined || plan.price < 0) {
    errors.push('Le prix doit être un nombre positif ou zéro');
  }

  if (plan.billing_cycle && !['monthly', 'yearly'].includes(plan.billing_cycle)) {
    errors.push('Le cycle de facturation doit être "monthly" ou "yearly"');
  }

  if (plan.orders_limit !== undefined && plan.orders_limit !== null && plan.orders_limit < 0) {
    errors.push('La limite de commandes doit être positive ou nulle (illimitée)');
  }

  if (plan.products_limit !== undefined && plan.products_limit !== null && plan.products_limit < 0) {
    errors.push('La limite de produits doit être positive ou nulle (illimitée)');
  }

  if (plan.customers_limit !== undefined && plan.customers_limit !== null && plan.customers_limit < 0) {
    errors.push('La limite de clients doit être positive ou nulle (illimitée)');
  }

  return errors;
};

// Validation des abonnements
export const validateSubscription = (subscription: Partial<Subscription>): string[] => {
  const errors: string[] = [];

  if (!subscription.merchant_id) {
    errors.push('L\'ID du marchand est obligatoire');
  }

  if (!subscription.plan_type || !['free', 'standard', 'premium'].includes(subscription.plan_type)) {
    errors.push('Le type de plan doit être "free", "standard" ou "premium"');
  }

  if (subscription.status && !['active', 'cancelled', 'expired', 'suspended'].includes(subscription.status)) {
    errors.push('Le statut doit être "active", "cancelled", "expired" ou "suspended"');
  }

  if (!subscription.start_date) {
    errors.push('La date de début est obligatoire');
  } else {
    const startDate = new Date(subscription.start_date);
    if (isNaN(startDate.getTime())) {
      errors.push('La date de début doit être une date valide');
    }
  }

  if (subscription.end_date) {
    const endDate = new Date(subscription.end_date);
    if (isNaN(endDate.getTime())) {
      errors.push('La date de fin doit être une date valide');
    }
    
    if (subscription.start_date) {
      const startDate = new Date(subscription.start_date);
      if (endDate <= startDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }
  }

  if (subscription.price !== undefined && subscription.price < 0) {
    errors.push('Le prix doit être positif ou zéro');
  }

  if (subscription.billing_cycle && !['monthly', 'yearly'].includes(subscription.billing_cycle)) {
    errors.push('Le cycle de facturation doit être "monthly" ou "yearly"');
  }

  if (subscription.orders_used !== undefined && subscription.orders_used < 0) {
    errors.push('Le nombre de commandes utilisées doit être positif ou zéro');
  }

  return errors;
};

// Validation des profils de marchands
export const validateMerchantProfile = (profile: Partial<MerchantProfile>): string[] => {
  const errors: string[] = [];

  if (!profile.business_name || profile.business_name.trim().length === 0) {
    errors.push('Le nom de l\'entreprise est obligatoire');
  }

  if (profile.business_name && profile.business_name.length > 255) {
    errors.push('Le nom de l\'entreprise ne peut pas dépasser 255 caractères');
  }

  if (profile.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      errors.push('Le format de l\'email est invalide');
    }
  }

  if (profile.whatsapp_number) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(profile.whatsapp_number)) {
      errors.push('Le numéro WhatsApp doit être au format international (+237...)');
    }
  }

  if (profile.subscription_plan && !['free', 'standard', 'premium'].includes(profile.subscription_plan)) {
    errors.push('Le plan d\'abonnement doit être "free", "standard" ou "premium"');
  }

  if (profile.status && !['active', 'suspended', 'inactive'].includes(profile.status)) {
    errors.push('Le statut doit être "active", "suspended" ou "inactive"');
  }

  if (profile.profile_image_url) {
    try {
      new URL(profile.profile_image_url);
    } catch {
      errors.push('L\'URL de l\'image de profil doit être valide');
    }
  }

  if (profile.currency && profile.currency.length !== 3 && profile.currency.length !== 4) {
    errors.push('Le code de devise doit faire 3 ou 4 caractères (ex: FCFA, EUR, USD)');
  }

  return errors;
};

// Vérification des limites d'abonnement
export const checkSubscriptionLimits = (
  subscription: Subscription,
  currentUsage: {
    orders: number;
    products: number;
    customers: number;
  }
): { canProceed: boolean; limitExceeded?: string } => {
  
  // Vérifier la limite de commandes
  if (subscription.orders_limit !== null && subscription.orders_limit !== undefined) {
    if (currentUsage.orders >= subscription.orders_limit) {
      return {
        canProceed: false,
        limitExceeded: `Limite de commandes atteinte (${subscription.orders_limit})`
      };
    }
  }

  // Pour les plans avec limites de produits et clients (si implémentées)
  // Ces vérifications peuvent être ajoutées selon les besoins

  return { canProceed: true };
};

// Calcul des dates d'abonnement
export const calculateSubscriptionDates = (
  startDate: Date,
  billingCycle: 'monthly' | 'yearly'
): {
  nextBillingDate: Date;
  endDate: Date;
} => {
  const nextBillingDate = new Date(startDate);
  const endDate = new Date(startDate);

  if (billingCycle === 'monthly') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return { nextBillingDate, endDate };
};

// Vérification de l'expiration d'abonnement
export const isSubscriptionExpired = (subscription: Subscription): boolean => {
  if (!subscription.end_date) return false;
  
  const endDate = new Date(subscription.end_date);
  const now = new Date();
  
  return now > endDate;
};

// Vérification si l'abonnement expire bientôt
export const isSubscriptionExpiringSoon = (
  subscription: Subscription,
  daysThreshold: number = 7
): boolean => {
  if (!subscription.end_date) return false;
  
  const endDate = new Date(subscription.end_date);
  const now = new Date();
  const threshold = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
  
  return endDate <= threshold && endDate > now;
};