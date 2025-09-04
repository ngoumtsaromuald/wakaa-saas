
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

// Créer une instance CRUD pour la table api_keys
const apiKeysCrud = new CrudOperations('api_keys');

// GET - Récupérer les clés API
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

  const data = await apiKeysCrud.findMany(filters, limit, offset);
  
  // Masquer les hash des clés dans la réponse
  const sanitizedData = data?.map((key: any) => {
    const { key_hash, ...safeKey } = key;
    return {
      ...safeKey,
      key_preview: `${key.key_prefix}...`
    };
  });

  return successResponse(sanitizedData);
});

// POST - Créer une nouvelle clé API
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'name'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Générer une clé API unique
  const generateApiKey = () => {
    const prefix = 'wk_';
    const randomPart = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    return prefix + randomPart;
  };

  const apiKey = generateApiKey();
  const keyPrefix = apiKey.substring(0, 8);
  const keyHash = `hash_${apiKey}_${Date.now()}`; // Dans un vrai système, utiliser bcrypt

  // Permissions par défaut
  const defaultPermissions = {
    orders: { read: true, write: true, delete: false },
    customers: { read: true, write: true, delete: false },
    products: { read: true, write: true, delete: false },
    payments: { read: true, write: false, delete: false },
    analytics: { read: true, write: false, delete: false }
  };

  // Date d'expiration par défaut (1 an)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Ajouter des valeurs par défaut
  const apiKeyData = {
    ...body,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    permissions: body.permissions || defaultPermissions,
    is_active: body.is_active !== undefined ? body.is_active : true,
    expires_at: body.expires_at || expiresAt.toISOString(),
    rate_limit: body.rate_limit || 1000,
    usage_count: 0
  };

  const data = await apiKeysCrud.create(apiKeyData);
  
  // Retourner la clé complète une seule fois
  const { key_hash, ...safeData } = data;
  return successResponse({
    ...safeData,
    api_key: apiKey, // Clé complète retournée une seule fois
    message: 'Clé API créée avec succès. Sauvegardez-la car elle ne sera plus affichée.'
  }, 201);
});

// PUT - Mettre à jour une clé API
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de la clé API requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que la clé API existe
  const existing = await apiKeysCrud.findById(id);
  if (!existing) {
    return errorResponse('Clé API non trouvée', 404);
  }

  // Ne pas permettre la modification du hash ou du préfixe
  const { key_hash, key_prefix, ...allowedUpdates } = body;

  // Mettre à jour modify_time
  const updateData = {
    ...allowedUpdates,
    modify_time: new Date().toISOString()
  };

  const data = await apiKeysCrud.update(id, updateData);
  
  // Masquer le hash dans la réponse
  const { key_hash: _, ...safeData } = data;
  return successResponse(safeData);
});

// DELETE - Désactiver une clé API
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de la clé API requis', 400);
  }

  // Vérifier que la clé API existe
  const existing = await apiKeysCrud.findById(id);
  if (!existing) {
    return errorResponse('Clé API non trouvée', 404);
  }

  // Soft delete: désactiver la clé API
  const data = await apiKeysCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  // Masquer le hash dans la réponse
  const { key_hash, ...safeData } = data;
  return successResponse(safeData);
});
