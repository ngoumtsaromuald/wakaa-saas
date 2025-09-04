
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

// Créer une instance CRUD pour la table subscriptions
const subscriptionsCrud = new CrudOperations('subscriptions');

// GET - Récupérer les abonnements
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const merchant_id = searchParams.get('merchant_id');
  const status = searchParams.get('status');
  const plan_type = searchParams.get('plan_type');
  
  logApiRequest(request, { limit, offset, search, merchant_id, status, plan_type });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (status) {
    filters.status = status;
  }
  
  if (plan_type) {
    filters.plan_type = plan_type;
  }

  const data = await subscriptionsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouvel abonnement
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'plan_type', 'start_date'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du type de plan
  const validPlanTypes = ['free', 'standard', 'premium'];
  if (!validPlanTypes.includes(body.plan_type)) {
    return errorResponse('Type de plan invalide', 400);
  }

  // Validation du statut
  const validStatuses = ['active', 'cancelled', 'expired', 'suspended'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('Statut d\'abonnement invalide', 400);
  }

  // Validation du cycle de facturation
  const validBillingCycles = ['monthly', 'yearly'];
  if (body.billing_cycle && !validBillingCycles.includes(body.billing_cycle)) {
    return errorResponse('Cycle de facturation invalide', 400);
  }

  // Définir les limites et prix selon le plan
  const planConfigs = {
    free: {
      price: 0,
      orders_limit: 10,
      features: {
        whatsapp_integration: true,
        basic_analytics: true,
        customer_management: true,
        email_support: false,
        api_access: false,
        advanced_analytics: false
      }
    },
    standard: {
      price: 5000,
      orders_limit: 500,
      features: {
        whatsapp_integration: true,
        basic_analytics: true,
        customer_management: true,
        email_support: true,
        api_access: false,
        advanced_analytics: true,
        payment_integration: true
      }
    },
    premium: {
      price: 10000,
      orders_limit: null, // illimité
      features: {
        whatsapp_integration: true,
        basic_analytics: true,
        customer_management: true,
        email_support: true,
        api_access: true,
        advanced_analytics: true,
        payment_integration: true,
        priority_support: true,
        custom_integrations: true
      }
    }
  };

  const planConfig = planConfigs[body.plan_type as keyof typeof planConfigs];

  // Calculer les dates
  const startDate = new Date(body.start_date);
  const billingCycle = body.billing_cycle || 'monthly';
  const nextBillingDate = new Date(startDate);
  
  if (billingCycle === 'monthly') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  // Ajouter des valeurs par défaut
  const subscriptionData = {
    ...body,
    status: body.status || 'active',
    price: body.price || planConfig.price,
    currency: body.currency || 'FCFA',
    billing_cycle: billingCycle,
    orders_limit: planConfig.orders_limit,
    orders_used: 0,
    features: planConfig.features,
    next_billing_date: nextBillingDate.toISOString(),
    auto_renew: body.auto_renew !== undefined ? body.auto_renew : true
  };

  const data = await subscriptionsCrud.create(subscriptionData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un abonnement
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de l\'abonnement requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que l'abonnement existe
  const existing = await subscriptionsCrud.findById(id);
  if (!existing) {
    return errorResponse('Abonnement non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.status) {
    const validStatuses = ['active', 'cancelled', 'expired', 'suspended'];
    if (!validStatuses.includes(body.status)) {
      return errorResponse('Statut d\'abonnement invalide', 400);
    }
  }

  if (body.plan_type) {
    const validPlanTypes = ['free', 'standard', 'premium'];
    if (!validPlanTypes.includes(body.plan_type)) {
      return errorResponse('Type de plan invalide', 400);
    }
  }

  // Traitement spécial pour l'annulation
  const updateData = { ...body };
  if (body.status === 'cancelled' && existing.status !== 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    updateData.auto_renew = false;
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await subscriptionsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Annuler un abonnement
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de l\'abonnement requis', 400);
  }

  // Vérifier que l'abonnement existe
  const existing = await subscriptionsCrud.findById(id);
  if (!existing) {
    return errorResponse('Abonnement non trouvé', 404);
  }

  // Soft delete: annuler l'abonnement
  const data = await subscriptionsCrud.update(id, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    auto_renew: false,
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
