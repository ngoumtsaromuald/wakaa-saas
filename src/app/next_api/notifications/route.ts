
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

// Créer une instance CRUD pour la table notifications
const notificationsCrud = new CrudOperations('notifications');

// GET - Récupérer les notifications
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const merchant_id = searchParams.get('merchant_id');
  const customer_id = searchParams.get('customer_id');
  const type = searchParams.get('type');
  const channel = searchParams.get('channel');
  const status = searchParams.get('status');
  
  logApiRequest(request, { limit, offset, search, merchant_id, customer_id, type, channel, status });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (customer_id) {
    filters.customer_id = customer_id;
  }
  
  if (type) {
    filters.type = type;
  }
  
  if (channel) {
    filters.channel = channel;
  }
  
  if (status) {
    filters.status = status;
  }

  if (search) {
    filters.recipient = search;
  }

  const data = await notificationsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer une nouvelle notification
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['type', 'channel', 'recipient', 'message'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du type de notification
  const validTypes = [
    'order_created', 'payment_received', 'order_shipped', 
    'order_delivered', 'subscription_expiring', 'system_alert'
  ];
  if (!validTypes.includes(body.type)) {
    return errorResponse('Type de notification invalide', 400);
  }

  // Validation du canal
  const validChannels = ['whatsapp', 'sms', 'email', 'push', 'in_app'];
  if (!validChannels.includes(body.channel)) {
    return errorResponse('Canal de notification invalide', 400);
  }

  // Validation du statut
  const validStatuses = ['pending', 'sent', 'delivered', 'failed', 'cancelled'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('Statut de notification invalide', 400);
  }

  // Validation du destinataire selon le canal
  if (body.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.recipient)) {
    return errorResponse('Adresse email invalide', 400);
  }

  if ((body.channel === 'whatsapp' || body.channel === 'sms') && 
      !/^\+237[0-9]{9}$/.test(body.recipient)) {
    return errorResponse('Numéro de téléphone invalide (format: +237XXXXXXXXX)', 400);
  }

  // Ajouter des valeurs par défaut
  const notificationData = {
    ...body,
    status: body.status || 'pending',
    metadata: body.metadata ? JSON.stringify(body.metadata) : null
  };

  const data = await notificationsCrud.create(notificationData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour une notification
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de la notification requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que la notification existe
  const existing = await notificationsCrud.findById(id);
  if (!existing) {
    return errorResponse('Notification non trouvée', 404);
  }

  // Validation du statut
  const validStatuses = ['pending', 'sent', 'delivered', 'failed', 'cancelled'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('Statut de notification invalide', 400);
  }

  // Validation des transitions de statut
  const currentStatus = existing.status;
  const newStatus = body.status;
  
  if (newStatus && currentStatus !== newStatus) {
    // Règles de transition de statut
    const invalidTransitions = [
      { from: 'delivered', to: 'pending' },
      { from: 'delivered', to: 'sent' },
      { from: 'failed', to: 'pending' },
      { from: 'cancelled', to: 'pending' },
      { from: 'cancelled', to: 'sent' }
    ];
    
    const isInvalidTransition = invalidTransitions.some(
      transition => transition.from === currentStatus && transition.to === newStatus
    );
    
    if (isInvalidTransition) {
      return errorResponse(`Transition de statut invalide: ${currentStatus} → ${newStatus}`, 400);
    }
  }

  // Sérialiser metadata si nécessaire
  const updateData = { ...body };
  if (body.metadata && typeof body.metadata === 'object') {
    updateData.metadata = JSON.stringify(body.metadata);
  }

  // Mettre à jour les timestamps selon le statut
  if (newStatus === 'sent' && currentStatus !== 'sent') {
    updateData.sent_at = new Date().toISOString();
  }
  
  if (newStatus === 'delivered' && currentStatus !== 'delivered') {
    updateData.delivered_at = new Date().toISOString();
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await notificationsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Annuler une notification
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de la notification requis', 400);
  }

  // Vérifier que la notification existe
  const existing = await notificationsCrud.findById(id);
  if (!existing) {
    return errorResponse('Notification non trouvée', 404);
  }

  // Vérifier que la notification peut être annulée
  if (['sent', 'delivered'].includes(existing.status)) {
    return errorResponse('Cette notification ne peut pas être annulée', 400);
  }

  // Soft delete: changer le statut à 'cancelled'
  const data = await notificationsCrud.update(id, {
    status: 'cancelled',
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
