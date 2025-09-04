import { NextRequest } from 'next/server';
import { CrudOperations, errorResponse } from '@/lib/api-utils';

// Types pour l'authentification
export interface AuthUser {
  id: string;
  email: string;
  role: 'merchant' | 'customer' | 'admin' | 'super_admin' | 'support' | 'analyst';
  is_active: boolean;
  permissions?: Record<string, boolean>;
}

export interface AuthSession {
  id: string;
  merchant_id: string;
  session_token: string;
  is_active: boolean;
  expires_at: string;
  last_activity_at: string;
}

// Instances CRUD
const profilesCrud = new CrudOperations('profiles');
const adminUsersCrud = new CrudOperations('admin_users');
const userSessionsCrud = new CrudOperations('user_sessions');

/**
 * Middleware d'authentification pour vérifier les tokens de session
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthUser | null;
  session: AuthSession | null;
  error?: string;
}> {
  try {
    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                 request.headers.get('x-session-token');

    if (!token) {
      return {
        user: null,
        session: null,
        error: 'Token d\'authentification requis'
      };
    }

    // Vérifier la session
    const sessions = await userSessionsCrud.findMany({ session_token: token });
    
    if (!sessions || sessions.length === 0) {
      return {
        user: null,
        session: null,
        error: 'Session invalide ou expirée'
      };
    }

    const session = sessions[0] as AuthSession;

    // Vérifier que la session est active
    if (!session.is_active) {
      return {
        user: null,
        session: null,
        error: 'Session désactivée'
      };
    }

    // Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      // Désactiver la session expirée
      await userSessionsCrud.update(session.id, {
        is_active: false,
        modify_time: new Date().toISOString()
      });
      
      return {
        user: null,
        session: null,
        error: 'Session expirée'
      };
    }

    // Récupérer l'utilisateur (d'abord dans profiles, puis admin_users si nécessaire)
    let user = await profilesCrud.findById(session.merchant_id);
    
    // Si pas trouvé dans profiles, chercher dans admin_users
    if (!user) {
      user = await adminUsersCrud.findById(session.merchant_id);
    }

    if (!user) {
      return {
        user: null,
        session: null,
        error: 'Utilisateur non trouvé'
      };
    }

    // Vérifier que l'utilisateur est actif
    if (!user.is_active) {
      return {
        user: null,
        session: null,
        error: 'Compte utilisateur désactivé'
      };
    }

    // Mettre à jour l'activité de la session
    await userSessionsCrud.update(session.id, {
      last_activity_at: new Date().toISOString()
    });

    return {
      user: user as AuthUser,
      session,
      error: undefined
    };

  } catch (error: any) {
    console.error('Erreur d\'authentification:', error);
    return {
      user: null,
      session: null,
      error: 'Erreur interne d\'authentification'
    };
  }
}

/**
 * Middleware pour vérifier les permissions de rôle
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
      return errorResponse(error || 'Authentification requise', 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return errorResponse(
        `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}. Votre rôle: ${user.role}`,
        403
      );
    }

    return null; // Pas d'erreur, l'utilisateur est autorisé
  };
}

/**
 * Middleware pour les routes admin uniquement
 */
export async function requireAdmin(request: NextRequest) {
  const adminRoles = ['admin', 'super_admin'];
  const authCheck = requireRole(adminRoles);
  return await authCheck(request);
}

/**
 * Middleware pour les routes marchands uniquement
 */
export async function requireMerchant(request: NextRequest) {
  const merchantRoles = ['merchant', 'admin', 'super_admin'];
  const authCheck = requireRole(merchantRoles);
  return await authCheck(request);
}

/**
 * Middleware pour les routes support/analyst
 */
export async function requireSupport(request: NextRequest) {
  const supportRoles = ['support', 'analyst', 'admin', 'super_admin'];
  const authCheck = requireRole(supportRoles);
  return await authCheck(request);
}

/**
 * Wrapper pour les routes protégées avec authentification
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser, session: AuthSession) => Promise<Response>,
  options?: {
    requiredRoles?: string[];
    requireActive?: boolean;
  }
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const { user, session, error } = await authenticateRequest(request);

      if (error || !user || !session) {
        return errorResponse(error || 'Authentification requise', 401);
      }

      // Vérifier les rôles requis
      if (options?.requiredRoles && !options.requiredRoles.includes(user.role)) {
        return errorResponse(
          `Accès refusé. Rôles autorisés: ${options.requiredRoles.join(', ')}`,
          403
        );
      }

      // Vérifier que l'utilisateur est actif (par défaut true)
      if (options?.requireActive !== false && !user.is_active) {
        return errorResponse('Compte utilisateur désactivé', 403);
      }

      return await handler(request, user, session);

    } catch (error: any) {
      console.error('Erreur dans withAuth:', error);
      return errorResponse('Erreur interne d\'authentification', 500);
    }
  };
}

/**
 * Utilitaire pour valider les permissions spécifiques
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Super admin a toutes les permissions
  if (user.role === 'super_admin') {
    return true;
  }

  // Admin a la plupart des permissions
  if (user.role === 'admin') {
    const restrictedPermissions = ['delete_admin', 'manage_super_admin'];
    return !restrictedPermissions.includes(permission);
  }

  // Vérifier les permissions spécifiques de l'utilisateur
  return user.permissions?.[permission] === true;
}

/**
 * Middleware pour vérifier une permission spécifique
 */
export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
      return errorResponse(error || 'Authentification requise', 401);
    }

    if (!hasPermission(user, permission)) {
      return errorResponse(
        `Permission refusée. Permission requise: ${permission}`,
        403
      );
    }

    return null; // Pas d'erreur, l'utilisateur a la permission
  };
}