
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

// Créer une instance CRUD pour la table payment_methods
const paymentMethodsCrud = new CrudOperations('payment_methods');

// GET - Récupérer les méthodes de paiement
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, merchant_id } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const provider = searchParams.get('provider');
  const is_active = searchParams.get('is_active');
  
  logApiRequest(request, { limit, offset, merchant_id, provider, is_active });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (provider) {
    filters.provider = provider;
  }
  
  if (is_active !== null) {
    filters.is_active = is_active === 'true';
  }

  const data = await paymentMethodsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer une nouvelle méthode de paiement
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'provider', 'method_name'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du provider
  const validProviders = ['cinetpay', 'mtn_momo', 'orange_money', 'bank_transfer', 'cash'];
  if (!validProviders.includes(body.provider)) {
    return errorResponse('Fournisseur de paiement invalide', 400);
  }

  // Configuration par défaut selon le provider
  const defaultConfigurations = {
    cinetpay: {
      api_key: '',
      site_id: '',
      environment: 'sandbox'
    },
    mtn_momo: {
      api_key: '',
      user_id: '',
      environment: 'sandbox'
    },
    orange_money: {
      merchant_key: '',
      environment: 'sandbox'
    },
    bank_transfer: {
      account_name: '',
      account_number: '',
      bank_name: ''
    },
    cash: {}
  };

  // Frais par défaut selon le provider
  const defaultFees = {
    cinetpay: { percentage: 2.5, fixed: 0 },
    mtn_momo: { percentage: 1.5, fixed: 0 },
    orange_money: { percentage: 1.5, fixed: 0 },
    bank_transfer: { percentage: 0, fixed: 500 },
    cash: { percentage: 0, fixed: 0 }
  };

  // Ajouter des valeurs par défaut
  const paymentMethodData = {
    ...body,
    configuration: body.configuration || defaultConfigurations[body.provider as keyof typeof defaultConfigurations],
    fees: body.fees || defaultFees[body.provider as keyof typeof defaultFees],
    supported_currencies: body.supported_currencies || ['FCFA'],
    is_active: body.is_active !== undefined ? body.is_active : true
  };

  const data = await paymentMethodsCrud.create(paymentMethodData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour une méthode de paiement
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de la méthode de paiement requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que la méthode de paiement existe
  const existing = await paymentMethodsCrud.findById(id);
  if (!existing) {
    return errorResponse('Méthode de paiement non trouvée', 404);
  }

  // Validation du provider si modifié
  if (body.provider) {
    const validProviders = ['cinetpay', 'mtn_momo', 'orange_money', 'bank_transfer', 'cash'];
    if (!validProviders.includes(body.provider)) {
      return errorResponse('Fournisseur de paiement invalide', 400);
    }
  }

  // Mettre à jour modify_time
  const updateData = {
    ...body,
    modify_time: new Date().toISOString()
  };

  const data = await paymentMethodsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Désactiver une méthode de paiement
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de la méthode de paiement requis', 400);
  }

  // Vérifier que la méthode de paiement existe
  const existing = await paymentMethodsCrud.findById(id);
  if (!existing) {
    return errorResponse('Méthode de paiement non trouvée', 404);
  }

  // Soft delete: désactiver la méthode de paiement
  const data = await paymentMethodsCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
