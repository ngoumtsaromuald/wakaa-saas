
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

// Créer une instance CRUD pour la table analytics_events
const analyticsEventsCrud = new CrudOperations('analytics_events');

// GET - Récupérer les événements analytics
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const merchant_id = searchParams.get('merchant_id');
  const event_type = searchParams.get('event_type');
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');
  
  logApiRequest(request, { limit, offset, search, merchant_id, event_type, start_date, end_date });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (event_type) {
    filters.event_type = event_type;
  }

  if (search) {
    filters.user_id = search;
  }

  const data = await analyticsEventsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Enregistrer un nouvel événement analytics
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['event_type', 'event_data'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du type d'événement
  const validEventTypes = [
    'page_view', 'order_created', 'payment_completed', 'user_registered',
    'product_viewed', 'cart_abandoned', 'whatsapp_message_sent', 'login',
    'logout', 'subscription_upgraded', 'feature_used'
  ];
  
  if (!validEventTypes.includes(body.event_type)) {
    return errorResponse('Type d\'événement invalide', 400);
  }

  // Validation des données d'événement
  if (typeof body.event_data !== 'object') {
    return errorResponse('Les données d\'événement doivent être un objet JSON', 400);
  }

  // Extraire les informations de la requête
  const ip_address = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
  const user_agent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';

  // Ajouter des valeurs par défaut
  const eventData = {
    ...body,
    event_data: JSON.stringify(body.event_data),
    ip_address,
    user_agent,
    referrer: referrer || null,
    session_id: body.session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  const data = await analyticsEventsCrud.create(eventData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un événement analytics (rare, principalement pour corrections)
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de l\'événement requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que l'événement existe
  const existing = await analyticsEventsCrud.findById(id);
  if (!existing) {
    return errorResponse('Événement non trouvé', 404);
  }

  // Sérialiser event_data si nécessaire
  const updateData = { ...body };
  if (body.event_data && typeof body.event_data === 'object') {
    updateData.event_data = JSON.stringify(body.event_data);
  }

  const data = await analyticsEventsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Supprimer un événement analytics (pour conformité RGPD)
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de l\'événement requis', 400);
  }

  // Vérifier que l'événement existe
  const existing = await analyticsEventsCrud.findById(id);
  if (!existing) {
    return errorResponse('Événement non trouvé', 404);
  }

  const data = await analyticsEventsCrud.delete(id);
  return successResponse(data);
});
