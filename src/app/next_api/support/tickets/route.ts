
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

// Créer une instance CRUD pour la table support_tickets
const supportTicketsCrud = new CrudOperations('support_tickets');

// GET - Récupérer les tickets de support
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const merchant_id = searchParams.get('merchant_id');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const category = searchParams.get('category');
  const assigned_to = searchParams.get('assigned_to');
  
  logApiRequest(request, { limit, offset, search, merchant_id, status, priority, category, assigned_to });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (status) {
    filters.status = status;
  }
  
  if (priority) {
    filters.priority = priority;
  }
  
  if (category) {
    filters.category = category;
  }
  
  if (assigned_to) {
    filters.assigned_to = assigned_to;
  }

  if (search) {
    filters.subject = search;
  }

  const data = await supportTicketsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau ticket de support
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'subject', 'description'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du statut
  const validStatuses = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('Statut de ticket invalide', 400);
  }

  // Validation de la priorité
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (body.priority && !validPriorities.includes(body.priority)) {
    return errorResponse('Priorité de ticket invalide', 400);
  }

  // Validation des catégories
  const validCategories = [
    'technical', 'billing', 'feature_request', 'bug_report', 
    'account', 'integration', 'training', 'other'
  ];
  if (body.category && !validCategories.includes(body.category)) {
    return errorResponse('Catégorie de ticket invalide', 400);
  }

  // Générer un numéro de ticket unique
  const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Ajouter des valeurs par défaut
  const ticketData = {
    ...body,
    ticket_number: ticketNumber,
    status: body.status || 'open',
    priority: body.priority || 'medium',
    attachments: body.attachments ? JSON.stringify(body.attachments) : JSON.stringify([]),
    tags: body.tags ? JSON.stringify(body.tags) : JSON.stringify([])
  };

  const data = await supportTicketsCrud.create(ticketData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un ticket de support
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID du ticket requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que le ticket existe
  const existing = await supportTicketsCrud.findById(id);
  if (!existing) {
    return errorResponse('Ticket non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.status) {
    const validStatuses = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
    if (!validStatuses.includes(body.status)) {
      return errorResponse('Statut de ticket invalide', 400);
    }
  }

  if (body.priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(body.priority)) {
      return errorResponse('Priorité de ticket invalide', 400);
    }
  }

  // Sérialiser les arrays si nécessaire
  const updateData = { ...body };
  if (body.attachments && Array.isArray(body.attachments)) {
    updateData.attachments = JSON.stringify(body.attachments);
  }
  if (body.tags && Array.isArray(body.tags)) {
    updateData.tags = JSON.stringify(body.tags);
  }

  // Mettre à jour les timestamps selon le statut
  const currentStatus = existing.status;
  const newStatus = body.status;
  
  if (newStatus === 'resolved' && currentStatus !== 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }
  
  if (newStatus === 'in_progress' && currentStatus === 'open' && !existing.first_response_at) {
    updateData.first_response_at = new Date().toISOString();
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await supportTicketsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Fermer un ticket de support
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID du ticket requis', 400);
  }

  // Vérifier que le ticket existe
  const existing = await supportTicketsCrud.findById(id);
  if (!existing) {
    return errorResponse('Ticket non trouvé', 404);
  }

  // Soft delete: fermer le ticket
  const data = await supportTicketsCrud.update(id, {
    status: 'closed',
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
