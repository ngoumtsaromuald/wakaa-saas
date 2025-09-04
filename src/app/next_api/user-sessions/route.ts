
import { NextRequest } from 'next/server';
import { 
  CrudOperations, 
  withErrorHandling, 
  parseQueryParams, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Créer une instance CRUD pour la table user_sessions
const userSessionsCrud = new CrudOperations('user_sessions');

// GET - Récupérer les sessions utilisateur
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, merchant_id } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const is_active = searchParams.get('is_active');
  
  logApiRequest(request, { limit, offset, merchant_id, is_active });

  if (!merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  // Construire les filtres
  const filters: Record<string, any> = {
    merchant_id: parseInt(merchant_id)
  };
  
  if (is_active !== null) {
    filters.is_active = is_active === 'true';
  }

  const data = await userSessionsCrud.findMany(filters, limit, offset);
  
  // Masquer les tokens complets dans la réponse
  const sanitizedData = data?.map((session: any) => {
    const { session_token, ...safeSession } = session;
    return {
      ...safeSession,
      token_preview: session_token ? `${session_token.substring(0, 8)}...` : null
    };
  });

  return successResponse(sanitizedData);
});

// POST - Créer une nouvelle session utilisateur
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  if (!body.merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  // Générer un token de session unique
  const generateSessionToken = () => {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  };

  const sessionToken = generateSessionToken();

  // Extraire les informations de la requête
  const ip_address = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
  const user_agent = request.headers.get('user-agent') || '';

  // Analyser l'user agent pour extraire les informations du device
  const parseUserAgent = (userAgent: string) => {
    // Analyse basique - dans un vrai système, utiliser une librairie comme ua-parser-js
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' : 
                   userAgent.includes('Safari') ? 'Safari' : 'Unknown';
    
    return {
      type: isMobile ? 'mobile' : 'desktop',
      browser,
      os: userAgent.includes('Windows') ? 'Windows' : 
          userAgent.includes('Mac') ? 'macOS' : 
          userAgent.includes('Linux') ? 'Linux' : 
          userAgent.includes('Android') ? 'Android' : 
          userAgent.includes('iOS') ? 'iOS' : 'Unknown'
    };
  };

  // Date d'expiration par défaut (30 jours)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Ajouter des valeurs par défaut
  const sessionData = {
    ...body,
    session_token: sessionToken,
    device_info: parseUserAgent(user_agent),
    ip_address,
    user_agent,
    is_active: true,
    last_activity_at: new Date().toISOString(),
    expires_at: body.expires_at || expiresAt.toISOString()
  };

  const data = await userSessionsCrud.create(sessionData);
  
  // Retourner le token complet pour cette création
  return successResponse({
    ...data,
    message: 'Session créée avec succès'
  }, 201);
});

// PUT - Mettre à jour une session utilisateur
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de la session requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que la session existe
  const existing = await userSessionsCrud.findById(id);
  if (!existing) {
    return errorResponse('Session non trouvée', 404);
  }

  // Ne pas permettre la modification du token
  const { session_token, ...allowedUpdates } = body;

  // Mettre à jour last_activity_at si c'est une activité
  const updateData = {
    ...allowedUpdates,
    last_activity_at: new Date().toISOString(),
    modify_time: new Date().toISOString()
  };

  const data = await userSessionsCrud.update(id, updateData);
  
  // Masquer le token dans la réponse
  const { session_token: _, ...safeData } = data;
  return successResponse(safeData);
});

// DELETE - Terminer une session (déconnexion)
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de la session requis', 400);
  }

  // Vérifier que la session existe
  const existing = await userSessionsCrud.findById(id);
  if (!existing) {
    return errorResponse('Session non trouvée', 404);
  }

  // Désactiver la session
  const data = await userSessionsCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  // Masquer le token dans la réponse
  const { session_token, ...safeData } = data;
  return successResponse({
    ...safeData,
    message: 'Session terminée avec succès'
  });
});
