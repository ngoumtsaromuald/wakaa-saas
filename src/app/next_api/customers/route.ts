
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

// Créer une instance CRUD pour la table customers
const customersCrud = new CrudOperations('customers');

// GET - Récupérer les clients
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  // Paramètres de filtrage spécifiques aux clients
  const merchant_id = searchParams.get('merchant_id');
  
  logApiRequest(request, { limit, offset, search, merchant_id });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }

  if (search) {
    // Note: Pour une recherche plus avancée, on pourrait implémenter
    // une recherche par nom ou numéro de téléphone côté application
    filters.phone_number = search;
  }

  const data = await customersCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau client
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'phone_number'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du numéro de téléphone (format camerounais)
  const phoneRegex = /^\+237[0-9]{9}$/;
  if (!phoneRegex.test(body.phone_number)) {
    return errorResponse('Format de numéro de téléphone invalide (ex: +237612345678)', 400);
  }

  // Validation de l'email si fourni
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return errorResponse('Format d\'email invalide', 400);
  }

  // Vérifier l'unicité du numéro de téléphone pour ce marchand
  try {
    const existingCustomers = await customersCrud.findMany({
      merchant_id: body.merchant_id,
      phone_number: body.phone_number
    });
    
    if (existingCustomers && existingCustomers.length > 0) {
      return errorResponse('Un client avec ce numéro de téléphone existe déjà', 409);
    }
  } catch (error) {
    // Continuer si l'erreur n'est pas critique
    console.warn('Erreur lors de la vérification d\'unicité:', error);
  }

  // Ajouter des valeurs par défaut
  const customerData = {
    ...body,
    total_orders: 0,
    total_spent: 0,
    last_order_at: null
  };

  const data = await customersCrud.create(customerData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un client
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID du client requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que le client existe
  const existing = await customersCrud.findById(id);
  if (!existing) {
    return errorResponse('Client non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.phone_number && !/^\+237[0-9]{9}$/.test(body.phone_number)) {
    return errorResponse('Format de numéro de téléphone invalide', 400);
  }

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return errorResponse('Format d\'email invalide', 400);
  }

  // Vérifier l'unicité du numéro si modifié
  if (body.phone_number && body.phone_number !== existing.phone_number) {
    try {
      const existingCustomers = await customersCrud.findMany({
        merchant_id: existing.merchant_id,
        phone_number: body.phone_number
      });
      
      if (existingCustomers && existingCustomers.length > 0) {
        return errorResponse('Un client avec ce numéro de téléphone existe déjà', 409);
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification d\'unicité:', error);
    }
  }

  // Mettre à jour modify_time
  const updateData = {
    ...body,
    modify_time: new Date().toISOString()
  };

  const data = await customersCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Supprimer un client
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID du client requis', 400);
  }

  // Vérifier que le client existe
  const existing = await customersCrud.findById(id);
  if (!existing) {
    return errorResponse('Client non trouvé', 404);
  }

  // Vérifier s'il y a des commandes associées
  // Note: Dans un vrai système, on voudrait peut-être empêcher la suppression
  // si le client a des commandes, ou faire un soft delete
  
  const data = await customersCrud.delete(id);
  return successResponse(data);
});
