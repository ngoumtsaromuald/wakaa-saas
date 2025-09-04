
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

// Créer une instance CRUD pour la table audit_logs
const auditLogsCrud = new CrudOperations('audit_logs');

// GET - Récupérer les logs d'audit
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const user_type = searchParams.get('user_type');
  const user_id = searchParams.get('user_id');
  const action = searchParams.get('action');
  const resource_type = searchParams.get('resource_type');
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');
  
  logApiRequest(request, { 
    limit, offset, search, user_type, user_id, action, 
    resource_type, start_date, end_date 
  });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (user_type) {
    filters.user_type = user_type;
  }
  
  if (user_id) {
    filters.user_id = parseInt(user_id);
  }
  
  if (action) {
    filters.action = action;
  }
  
  if (resource_type) {
    filters.resource_type = resource_type;
  }

  if (search) {
    filters.user_email = search;
  }

  const data = await auditLogsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau log d'audit
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['user_type', 'user_id', 'action'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du type d'utilisateur
  const validUserTypes = ['merchant', 'admin', 'system'];
  if (!validUserTypes.includes(body.user_type)) {
    return errorResponse('Type d\'utilisateur invalide', 400);
  }

  // Validation des actions courantes
  const commonActions = [
    'create', 'read', 'update', 'delete',
    'login', 'logout', 'password_change',
    'order_created', 'order_updated', 'order_cancelled',
    'payment_processed', 'payment_failed',
    'settings_updated', 'api_key_created',
    'export_data', 'import_data'
  ];

  // Extraire les informations de la requête
  const ip_address = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
  const user_agent = request.headers.get('user-agent') || '';

  // Ajouter des valeurs par défaut
  const auditLogData = {
    ...body,
    ip_address,
    user_agent,
    old_values: body.old_values ? JSON.stringify(body.old_values) : null,
    new_values: body.new_values ? JSON.stringify(body.new_values) : null
  };

  const data = await auditLogsCrud.create(auditLogData);
  return successResponse(data, 201);
});

// PUT - Les logs d'audit ne sont généralement pas modifiables
export const PUT = withErrorHandling(async (request: NextRequest) => {
  return errorResponse('Les logs d\'audit ne peuvent pas être modifiés', 405);
});

// DELETE - Supprimer des logs d'audit anciens (pour maintenance)
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id, days_old } = parseQueryParams(request);

  if (id) {
    // Supprimer un log spécifique (rare, généralement pour conformité RGPD)
    const existing = await auditLogsCrud.findById(id);
    if (!existing) {
      return errorResponse('Log d\'audit non trouvé', 404);
    }

    const data = await auditLogsCrud.delete(id);
    return successResponse(data);
  }

  if (days_old) {
    // Supprimer les logs plus anciens que X jours (maintenance)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days_old));
    
    // Note: Cette opération nécessiterait une requête SQL personnalisée
    // Pour l'instant, on retourne une erreur indiquant que cette fonctionnalité
    // doit être implémentée au niveau de la base de données
    return errorResponse('Suppression en lot non implémentée. Utilisez une tâche de maintenance.', 501);
  }

  return errorResponse('ID ou days_old requis', 400);
});
