/**
 * Gestion centralisée des erreurs d'authentification
 */

export enum AuthErrorCode {
  // Erreurs de token/session
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INACTIVE = 'SESSION_INACTIVE',
  
  // Erreurs d'utilisateur
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  USER_SUSPENDED = 'USER_SUSPENDED',
  
  // Erreurs de permissions
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_NOT_AUTHORIZED = 'ROLE_NOT_AUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Erreurs de connexion
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // Erreurs système
  AUTH_SERVICE_ERROR = 'AUTH_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
  statusCode: number;
}

export const AUTH_ERRORS: Record<AuthErrorCode, Omit<AuthError, 'details'>> = {
  [AuthErrorCode.TOKEN_MISSING]: {
    code: AuthErrorCode.TOKEN_MISSING,
    message: 'Token d\'authentification requis',
    statusCode: 401
  },
  [AuthErrorCode.TOKEN_INVALID]: {
    code: AuthErrorCode.TOKEN_INVALID,
    message: 'Token d\'authentification invalide',
    statusCode: 401
  },
  [AuthErrorCode.SESSION_EXPIRED]: {
    code: AuthErrorCode.SESSION_EXPIRED,
    message: 'Session expirée, veuillez vous reconnecter',
    statusCode: 401
  },
  [AuthErrorCode.SESSION_INACTIVE]: {
    code: AuthErrorCode.SESSION_INACTIVE,
    message: 'Session désactivée',
    statusCode: 401
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    code: AuthErrorCode.USER_NOT_FOUND,
    message: 'Utilisateur non trouvé',
    statusCode: 404
  },
  [AuthErrorCode.USER_INACTIVE]: {
    code: AuthErrorCode.USER_INACTIVE,
    message: 'Compte utilisateur désactivé',
    statusCode: 403
  },
  [AuthErrorCode.USER_SUSPENDED]: {
    code: AuthErrorCode.USER_SUSPENDED,
    message: 'Compte utilisateur suspendu',
    statusCode: 403
  },
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: {
    code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
    message: 'Permissions insuffisantes pour cette action',
    statusCode: 403
  },
  [AuthErrorCode.ROLE_NOT_AUTHORIZED]: {
    code: AuthErrorCode.ROLE_NOT_AUTHORIZED,
    message: 'Rôle non autorisé pour cette ressource',
    statusCode: 403
  },
  [AuthErrorCode.PERMISSION_DENIED]: {
    code: AuthErrorCode.PERMISSION_DENIED,
    message: 'Permission refusée',
    statusCode: 403
  },
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    code: AuthErrorCode.INVALID_CREDENTIALS,
    message: 'Email ou mot de passe incorrect',
    statusCode: 401
  },
  [AuthErrorCode.ACCOUNT_LOCKED]: {
    code: AuthErrorCode.ACCOUNT_LOCKED,
    message: 'Compte verrouillé suite à trop de tentatives de connexion',
    statusCode: 423
  },
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: {
    code: AuthErrorCode.EMAIL_NOT_VERIFIED,
    message: 'Adresse email non vérifiée',
    statusCode: 403
  },
  [AuthErrorCode.AUTH_SERVICE_ERROR]: {
    code: AuthErrorCode.AUTH_SERVICE_ERROR,
    message: 'Erreur du service d\'authentification',
    statusCode: 500
  },
  [AuthErrorCode.DATABASE_ERROR]: {
    code: AuthErrorCode.DATABASE_ERROR,
    message: 'Erreur de base de données',
    statusCode: 500
  },
  [AuthErrorCode.INTERNAL_ERROR]: {
    code: AuthErrorCode.INTERNAL_ERROR,
    message: 'Erreur interne du serveur',
    statusCode: 500
  }
};

/**
 * Créer une erreur d'authentification standardisée
 */
export function createAuthError(
  code: AuthErrorCode, 
  details?: any
): AuthError {
  const baseError = AUTH_ERRORS[code];
  return {
    ...baseError,
    details
  };
}

/**
 * Formater une erreur d'authentification pour la réponse API
 */
export function formatAuthError(error: AuthError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    }
  };
}

/**
 * Messages d'erreur spécifiques par rôle
 */
export const ROLE_ERROR_MESSAGES = {
  merchant: {
    access_denied: 'Accès refusé. Cette fonctionnalité est réservée aux marchands.',
    subscription_required: 'Abonnement requis pour accéder à cette fonctionnalité.',
    trial_expired: 'Période d\'essai expirée. Veuillez souscrire à un abonnement.'
  },
  admin: {
    access_denied: 'Accès refusé. Privilèges administrateur requis.',
    insufficient_level: 'Niveau d\'administration insuffisant pour cette action.'
  },
  customer: {
    access_denied: 'Accès refusé. Cette fonctionnalité n\'est pas disponible pour les clients.',
    account_verification: 'Vérification du compte requise pour accéder à cette fonctionnalité.'
  }
};

/**
 * Utilitaire pour logger les erreurs d'authentification
 */
export function logAuthError(
  error: AuthError, 
  context?: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
  }
) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    },
    context: context || {},
    details: error.details
  };

  // En production, envoyer vers un service de logging
  if (process.env.NODE_ENV === 'production') {
    // TODO: Intégrer avec un service de logging (Sentry, LogRocket, etc.)
    console.error('AUTH_ERROR:', JSON.stringify(logData));
  } else {
    console.error('Erreur d\'authentification:', logData);
  }
}

/**
 * Vérifier si une erreur est liée à l'authentification
 */
export function isAuthError(error: any): error is AuthError {
  return error && 
         typeof error === 'object' && 
         'code' in error && 
         Object.values(AuthErrorCode).includes(error.code);
}

/**
 * Convertir une erreur générique en erreur d'authentification
 */
export function toAuthError(error: any): AuthError {
  if (isAuthError(error)) {
    return error;
  }

  // Mapper les erreurs communes
  if (error?.message?.includes('Token')) {
    return createAuthError(AuthErrorCode.TOKEN_INVALID, { originalError: error.message });
  }

  if (error?.message?.includes('Session')) {
    return createAuthError(AuthErrorCode.SESSION_EXPIRED, { originalError: error.message });
  }

  if (error?.message?.includes('Permission') || error?.message?.includes('Accès')) {
    return createAuthError(AuthErrorCode.PERMISSION_DENIED, { originalError: error.message });
  }

  // Erreur générique
  return createAuthError(AuthErrorCode.INTERNAL_ERROR, { 
    originalError: error?.message || 'Erreur inconnue' 
  });
}