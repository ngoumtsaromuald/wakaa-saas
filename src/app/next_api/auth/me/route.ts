
import { NextRequest } from 'next/server';
import { 
  withErrorHandling,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { CrudOperations } from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';
import { 
  authenticateRequest,
  AuthUser 
} from '@/lib/auth-middleware';
import { 
  AuthErrorCode, 
  createAuthError, 
  formatAuthError, 
  logAuthError 
} from '@/lib/auth-errors';

// Créer des instances CRUD pour les tables nécessaires
const profilesCrud = new CrudOperations('profiles');
const userSessionsCrud = new CrudOperations('user_sessions');

// GET - Récupérer les informations de l'utilisateur connecté
export const GET = withErrorHandling(async (request: NextRequest) => {
  logApiRequest(request);
  
  try {
    // Utiliser le middleware d'authentification
    const { user, session, error } = await authenticateRequest(request);

    if (error || !user || !session) {
      let authError;
      
      if (error?.includes('Token')) {
        authError = createAuthError(AuthErrorCode.TOKEN_MISSING);
      } else if (error?.includes('Session invalide')) {
        authError = createAuthError(AuthErrorCode.TOKEN_INVALID);
      } else if (error?.includes('Session expirée')) {
        authError = createAuthError(AuthErrorCode.SESSION_EXPIRED);
      } else if (error?.includes('Session désactivée')) {
        authError = createAuthError(AuthErrorCode.SESSION_INACTIVE);
      } else if (error?.includes('Utilisateur non trouvé')) {
        authError = createAuthError(AuthErrorCode.USER_NOT_FOUND);
      } else if (error?.includes('désactivé')) {
        authError = createAuthError(AuthErrorCode.USER_INACTIVE);
      } else {
        authError = createAuthError(AuthErrorCode.AUTH_SERVICE_ERROR);
      }

      logAuthError(authError, { 
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || '',
        endpoint: '/auth/me'
      });

      return Response.json(formatAuthError(authError), { status: authError.statusCode });
    }

    // Préparer les données utilisateur sécurisées
    const { password_hash, two_factor_secret, ...safeUser } = user as any;

    // Ajouter des informations de session
    const responseData = {
      ...safeUser,
      session: {
        expires_at: session.expires_at,
        last_activity_at: session.last_activity_at
      }
    };

    return successResponse(responseData);

  } catch (error: any) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    
    const authError = createAuthError(AuthErrorCode.AUTH_SERVICE_ERROR, {
      originalError: error.message
    });
    
    logAuthError(authError, { 
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      endpoint: '/auth/me'
    });
    
    return Response.json(formatAuthError(authError), { status: authError.statusCode });
  }
});
