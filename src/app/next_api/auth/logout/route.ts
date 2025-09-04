import { NextRequest } from 'next/server';
import { 
  withErrorHandling,
  successResponse
} from '@/lib/api-utils';
import { CrudOperations } from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';
import { 
  authenticateRequest 
} from '@/lib/auth-middleware';
import { 
  AuthErrorCode, 
  createAuthError, 
  formatAuthError, 
  logAuthError 
} from '@/lib/auth-errors';

// Créer une instance CRUD pour les sessions
const userSessionsCrud = new CrudOperations('user_sessions');

// POST - Déconnexion utilisateur
export const POST = withErrorHandling(async (request: NextRequest) => {
  logApiRequest(request);
  
  try {
    // Utiliser le middleware d'authentification pour récupérer la session
    const { user, session, error } = await authenticateRequest(request);

    // Même si l'authentification échoue, on essaie de nettoyer la session
    if (session) {
      // Désactiver la session
      await userSessionsCrud.update(session.id, {
        is_active: false,
        modify_time: new Date().toISOString()
      });

      console.log(`Session désactivée pour l'utilisateur: ${user?.email || 'inconnu'}`);
    }

    // Toujours retourner un succès pour la déconnexion
    return successResponse({
      message: 'Déconnexion réussie'
    });

  } catch (error: any) {
    console.error('Erreur lors de la déconnexion:', error);
    
    // Même en cas d'erreur, on considère la déconnexion comme réussie
    // pour éviter que l'utilisateur reste bloqué
    return successResponse({
      message: 'Déconnexion réussie'
    });
  }
});