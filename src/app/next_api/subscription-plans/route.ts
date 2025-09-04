
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

// Créer une instance CRUD pour la table subscription_plans
const subscriptionPlansCrud = new CrudOperations('subscription_plans');

// GET - Récupérer les plans d'abonnement
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, is_active } = parseQueryParams(request);
  logApiRequest(request, { limit, offset, is_active });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (is_active !== null) {
    filters.is_active = is_active === 'true';
  }

  const data = await subscriptionPlansCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau plan d'abonnement
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['name', 'display_name', 'price'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du cycle de facturation
  const validBillingCycles = ['monthly', 'yearly'];
  if (body.billing_cycle && !validBillingCycles.includes(body.billing_cycle)) {
    return errorResponse('Cycle de facturation invalide', 400);
  }

  // Validation du prix
  if (typeof body.price !== 'number' || body.price < 0) {
    return errorResponse('Le prix doit être un nombre positif ou zéro', 400);
  }

  // Ajouter des valeurs par défaut
  const planData = {
    ...body,
    currency: body.currency || 'FCFA',
    billing_cycle: body.billing_cycle || 'monthly',
    is_active: body.is_active !== undefined ? body.is_active : true,
    sort_order: body.sort_order || 0,
    features: body.features || {}
  };

  const data = await subscriptionPlansCrud.create(planData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un plan d'abonnement
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID du plan requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que le plan existe
  const existing = await subscriptionPlansCrud.findById(id);
  if (!existing) {
    return errorResponse('Plan non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.billing_cycle) {
    const validBillingCycles = ['monthly', 'yearly'];
    if (!validBillingCycles.includes(body.billing_cycle)) {
      return errorResponse('Cycle de facturation invalide', 400);
    }
  }

  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || body.price < 0) {
      return errorResponse('Le prix doit être un nombre positif ou zéro', 400);
    }
  }

  // Mettre à jour modify_time
  const updateData = {
    ...body,
    modify_time: new Date().toISOString()
  };

  const data = await subscriptionPlansCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Désactiver un plan d'abonnement
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID du plan requis', 400);
  }

  // Vérifier que le plan existe
  const existing = await subscriptionPlansCrud.findById(id);
  if (!existing) {
    return errorResponse('Plan non trouvé', 404);
  }

  // Soft delete: désactiver le plan
  const data = await subscriptionPlansCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
