/**
 * Gestion des erreurs spécifiques aux abonnements et profils
 */

export enum SubscriptionErrorCode {
  // Erreurs d'abonnement
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_SUSPENDED = 'SUBSCRIPTION_SUSPENDED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_LIMIT_EXCEEDED = 'SUBSCRIPTION_LIMIT_EXCEEDED',
  SUBSCRIPTION_INVALID_PLAN = 'SUBSCRIPTION_INVALID_PLAN',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED',
  SUBSCRIPTION_ALREADY_EXISTS = 'SUBSCRIPTION_ALREADY_EXISTS',
  
  // Erreurs de profil
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_INVALID_DATA = 'PROFILE_INVALID_DATA',
  PROFILE_EMAIL_EXISTS = 'PROFILE_EMAIL_EXISTS',
  PROFILE_WHATSAPP_EXISTS = 'PROFILE_WHATSAPP_EXISTS',
  PROFILE_SLUG_EXISTS = 'PROFILE_SLUG_EXISTS',
  PROFILE_UPDATE_FORBIDDEN = 'PROFILE_UPDATE_FORBIDDEN',
  
  // Erreurs de plan
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  PLAN_INACTIVE = 'PLAN_INACTIVE',
  PLAN_INVALID_CONFIG = 'PLAN_INVALID_CONFIG',
  
  // Erreurs de limite
  ORDERS_LIMIT_EXCEEDED = 'ORDERS_LIMIT_EXCEEDED',
  PRODUCTS_LIMIT_EXCEEDED = 'PRODUCTS_LIMIT_EXCEEDED',
  CUSTOMERS_LIMIT_EXCEEDED = 'CUSTOMERS_LIMIT_EXCEEDED',
  FEATURES_NOT_AVAILABLE = 'FEATURES_NOT_AVAILABLE',
  
  // Erreurs de validation
  INVALID_BILLING_CYCLE = 'INVALID_BILLING_CYCLE',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_PRICE = 'INVALID_PRICE',
  INVALID_STATUS = 'INVALID_STATUS'
}

export interface SubscriptionError {
  code: SubscriptionErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
}

// Messages d'erreur en français
const ERROR_MESSAGES: Record<SubscriptionErrorCode, string> = {
  // Erreurs d'abonnement
  [SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND]: 'Abonnement non trouvé',
  [SubscriptionErrorCode.SUBSCRIPTION_EXPIRED]: 'Votre abonnement a expiré',
  [SubscriptionErrorCode.SUBSCRIPTION_SUSPENDED]: 'Votre abonnement est suspendu',
  [SubscriptionErrorCode.SUBSCRIPTION_CANCELLED]: 'Votre abonnement a été annulé',
  [SubscriptionErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED]: 'Limite d\'abonnement dépassée',
  [SubscriptionErrorCode.SUBSCRIPTION_INVALID_PLAN]: 'Plan d\'abonnement invalide',
  [SubscriptionErrorCode.SUBSCRIPTION_PAYMENT_FAILED]: 'Échec du paiement de l\'abonnement',
  [SubscriptionErrorCode.SUBSCRIPTION_ALREADY_EXISTS]: 'Un abonnement actif existe déjà',
  
  // Erreurs de profil
  [SubscriptionErrorCode.PROFILE_NOT_FOUND]: 'Profil non trouvé',
  [SubscriptionErrorCode.PROFILE_INVALID_DATA]: 'Données de profil invalides',
  [SubscriptionErrorCode.PROFILE_EMAIL_EXISTS]: 'Cette adresse email est déjà utilisée',
  [SubscriptionErrorCode.PROFILE_WHATSAPP_EXISTS]: 'Ce numéro WhatsApp est déjà utilisé',
  [SubscriptionErrorCode.PROFILE_SLUG_EXISTS]: 'Ce nom d\'entreprise est déjà utilisé',
  [SubscriptionErrorCode.PROFILE_UPDATE_FORBIDDEN]: 'Modification du profil non autorisée',
  
  // Erreurs de plan
  [SubscriptionErrorCode.PLAN_NOT_FOUND]: 'Plan d\'abonnement non trouvé',
  [SubscriptionErrorCode.PLAN_INACTIVE]: 'Ce plan d\'abonnement n\'est plus disponible',
  [SubscriptionErrorCode.PLAN_INVALID_CONFIG]: 'Configuration du plan invalide',
  
  // Erreurs de limite
  [SubscriptionErrorCode.ORDERS_LIMIT_EXCEEDED]: 'Limite de commandes atteinte pour votre plan',
  [SubscriptionErrorCode.PRODUCTS_LIMIT_EXCEEDED]: 'Limite de produits atteinte pour votre plan',
  [SubscriptionErrorCode.CUSTOMERS_LIMIT_EXCEEDED]: 'Limite de clients atteinte pour votre plan',
  [SubscriptionErrorCode.FEATURES_NOT_AVAILABLE]: 'Cette fonctionnalité n\'est pas disponible dans votre plan',
  
  // Erreurs de validation
  [SubscriptionErrorCode.INVALID_BILLING_CYCLE]: 'Cycle de facturation invalide',
  [SubscriptionErrorCode.INVALID_DATE_RANGE]: 'Plage de dates invalide',
  [SubscriptionErrorCode.INVALID_PRICE]: 'Prix invalide',
  [SubscriptionErrorCode.INVALID_STATUS]: 'Statut invalide'
};

// Codes de statut HTTP pour chaque erreur
const ERROR_STATUS_CODES: Record<SubscriptionErrorCode, number> = {
  // Erreurs d'abonnement
  [SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND]: 404,
  [SubscriptionErrorCode.SUBSCRIPTION_EXPIRED]: 402,
  [SubscriptionErrorCode.SUBSCRIPTION_SUSPENDED]: 403,
  [SubscriptionErrorCode.SUBSCRIPTION_CANCELLED]: 410,
  [SubscriptionErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED]: 429,
  [SubscriptionErrorCode.SUBSCRIPTION_INVALID_PLAN]: 400,
  [SubscriptionErrorCode.SUBSCRIPTION_PAYMENT_FAILED]: 402,
  [SubscriptionErrorCode.SUBSCRIPTION_ALREADY_EXISTS]: 409,
  
  // Erreurs de profil
  [SubscriptionErrorCode.PROFILE_NOT_FOUND]: 404,
  [SubscriptionErrorCode.PROFILE_INVALID_DATA]: 400,
  [SubscriptionErrorCode.PROFILE_EMAIL_EXISTS]: 409,
  [SubscriptionErrorCode.PROFILE_WHATSAPP_EXISTS]: 409,
  [SubscriptionErrorCode.PROFILE_SLUG_EXISTS]: 409,
  [SubscriptionErrorCode.PROFILE_UPDATE_FORBIDDEN]: 403,
  
  // Erreurs de plan
  [SubscriptionErrorCode.PLAN_NOT_FOUND]: 404,
  [SubscriptionErrorCode.PLAN_INACTIVE]: 410,
  [SubscriptionErrorCode.PLAN_INVALID_CONFIG]: 400,
  
  // Erreurs de limite
  [SubscriptionErrorCode.ORDERS_LIMIT_EXCEEDED]: 429,
  [SubscriptionErrorCode.PRODUCTS_LIMIT_EXCEEDED]: 429,
  [SubscriptionErrorCode.CUSTOMERS_LIMIT_EXCEEDED]: 429,
  [SubscriptionErrorCode.FEATURES_NOT_AVAILABLE]: 403,
  
  // Erreurs de validation
  [SubscriptionErrorCode.INVALID_BILLING_CYCLE]: 400,
  [SubscriptionErrorCode.INVALID_DATE_RANGE]: 400,
  [SubscriptionErrorCode.INVALID_PRICE]: 400,
  [SubscriptionErrorCode.INVALID_STATUS]: 400
};

// Créer une erreur d'abonnement
export const createSubscriptionError = (
  code: SubscriptionErrorCode,
  details?: Record<string, any>
): SubscriptionError => {
  return {
    code,
    message: ERROR_MESSAGES[code],
    statusCode: ERROR_STATUS_CODES[code],
    details,
    timestamp: new Date().toISOString()
  };
};

// Formater une erreur pour la réponse API
export const formatSubscriptionError = (error: SubscriptionError) => {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    }
  };
};

// Logger une erreur d'abonnement
export const logSubscriptionError = (
  error: SubscriptionError,
  context?: Record<string, any>
) => {
  console.error('Subscription Error:', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    context,
    timestamp: error.timestamp
  });
};

// Vérifier si une erreur est liée aux limites d'abonnement
export const isLimitError = (code: SubscriptionErrorCode): boolean => {
  return [
    SubscriptionErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED,
    SubscriptionErrorCode.ORDERS_LIMIT_EXCEEDED,
    SubscriptionErrorCode.PRODUCTS_LIMIT_EXCEEDED,
    SubscriptionErrorCode.CUSTOMERS_LIMIT_EXCEEDED,
    SubscriptionErrorCode.FEATURES_NOT_AVAILABLE
  ].includes(code);
};

// Vérifier si une erreur nécessite une mise à niveau
export const requiresUpgrade = (code: SubscriptionErrorCode): boolean => {
  return [
    SubscriptionErrorCode.SUBSCRIPTION_EXPIRED,
    SubscriptionErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED,
    SubscriptionErrorCode.ORDERS_LIMIT_EXCEEDED,
    SubscriptionErrorCode.PRODUCTS_LIMIT_EXCEEDED,
    SubscriptionErrorCode.CUSTOMERS_LIMIT_EXCEEDED,
    SubscriptionErrorCode.FEATURES_NOT_AVAILABLE
  ].includes(code);
};

// Obtenir le message d'action recommandée
export const getRecommendedAction = (code: SubscriptionErrorCode): string => {
  if (requiresUpgrade(code)) {
    return 'Veuillez mettre à niveau votre abonnement pour continuer';
  }
  
  switch (code) {
    case SubscriptionErrorCode.SUBSCRIPTION_SUSPENDED:
      return 'Contactez le support pour réactiver votre compte';
    case SubscriptionErrorCode.SUBSCRIPTION_PAYMENT_FAILED:
      return 'Veuillez mettre à jour vos informations de paiement';
    case SubscriptionErrorCode.PROFILE_EMAIL_EXISTS:
    case SubscriptionErrorCode.PROFILE_WHATSAPP_EXISTS:
      return 'Veuillez utiliser une adresse différente';
    default:
      return 'Veuillez corriger les informations et réessayer';
  }
};