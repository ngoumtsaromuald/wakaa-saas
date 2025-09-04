
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

// Créer une instance CRUD pour la table payments
const paymentsCrud = new CrudOperations('payments');

// GET - Récupérer les paiements
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  // Paramètres de filtrage spécifiques aux paiements
  const merchant_id = searchParams.get('merchant_id');
  const order_id = searchParams.get('order_id');
  const status = searchParams.get('status');
  const provider = searchParams.get('provider');
  
  logApiRequest(request, { limit, offset, search, merchant_id, order_id, status, provider });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (order_id) {
    filters.order_id = order_id;
  }
  
  if (status) {
    filters.status = status;
  }
  
  if (provider) {
    filters.provider = provider;
  }

  if (search) {
    // Recherche par transaction_id
    filters.transaction_id = search;
  }

  const data = await paymentsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau paiement
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['order_id', 'merchant_id', 'amount', 'provider'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du montant
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return errorResponse('Le montant doit être un nombre positif', 400);
  }

  // Validation du provider
  const validProviders = ['cinetpay', 'mtn_momo', 'orange_money', 'manual'];
  if (!validProviders.includes(body.provider)) {
    return errorResponse('Fournisseur de paiement invalide', 400);
  }

  // Validation du statut si fourni
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('Statut de paiement invalide', 400);
  }

  // Générer un transaction_id unique si non fourni
  const transaction_id = body.transaction_id || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Définir une date d'expiration par défaut (24h)
  const expires_at = body.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Ajouter des valeurs par défaut
  const paymentData = {
    ...body,
    transaction_id,
    currency: body.currency || 'FCFA',
    status: body.status || 'pending',
    expires_at,
    webhook_data: body.webhook_data ? JSON.stringify(body.webhook_data) : null
  };

  const data = await paymentsCrud.create(paymentData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un paiement
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID du paiement requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que le paiement existe
  const existing = await paymentsCrud.findById(id);
  if (!existing) {
    return errorResponse('Paiement non trouvé', 404);
  }

  // Validation du statut
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('Statut de paiement invalide', 400);
  }

  // Validation des transitions de statut
  const currentStatus = existing.status;
  const newStatus = body.status;
  
  if (newStatus && currentStatus !== newStatus) {
    // Règles de transition de statut
    const invalidTransitions = [
      // Ne peut pas revenir de completed à pending
      { from: 'completed', to: 'pending' },
      { from: 'completed', to: 'processing' },
      // Ne peut pas revenir de failed
      { from: 'failed', to: 'pending' },
      { from: 'failed', to: 'processing' },
      // Ne peut pas revenir de cancelled
      { from: 'cancelled', to: 'pending' },
      { from: 'cancelled', to: 'processing' },
      { from: 'cancelled', to: 'completed' }
    ];
    
    const isInvalidTransition = invalidTransitions.some(
      transition => transition.from === currentStatus && transition.to === newStatus
    );
    
    if (isInvalidTransition) {
      return errorResponse(`Transition de statut invalide: ${currentStatus} → ${newStatus}`, 400);
    }
  }

  // Sérialiser webhook_data si nécessaire
  const updateData = { ...body };
  if (body.webhook_data && typeof body.webhook_data === 'object') {
    updateData.webhook_data = JSON.stringify(body.webhook_data);
  }

  // Mettre à jour processed_at si le statut devient completed
  if (newStatus === 'completed' && currentStatus !== 'completed') {
    updateData.processed_at = new Date().toISOString();
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await paymentsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Annuler un paiement
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID du paiement requis', 400);
  }

  // Vérifier que le paiement existe
  const existing = await paymentsCrud.findById(id);
  if (!existing) {
    return errorResponse('Paiement non trouvé', 404);
  }

  // Vérifier que le paiement peut être annulé
  if (['completed', 'refunded', 'cancelled'].includes(existing.status)) {
    return errorResponse('Ce paiement ne peut pas être annulé', 400);
  }

  // Soft delete: changer le statut à 'cancelled'
  const data = await paymentsCrud.update(id, {
    status: 'cancelled',
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
