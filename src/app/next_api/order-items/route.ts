
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

// Créer une instance CRUD pour la table order_items
const orderItemsCrud = new CrudOperations('order_items');

// GET - Récupérer les articles de commande
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, order_id, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const product_id = searchParams.get('product_id');
  
  logApiRequest(request, { limit, offset, order_id, product_id, search });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (order_id) {
    filters.order_id = order_id;
  }
  
  if (product_id) {
    filters.product_id = product_id;
  }

  if (search) {
    filters.product_name = search;
  }

  const data = await orderItemsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouvel article de commande
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['order_id', 'product_name', 'quantity', 'unit_price'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation des montants
  if (typeof body.unit_price !== 'number' || body.unit_price < 0) {
    return errorResponse('Le prix unitaire doit être un nombre positif ou zéro', 400);
  }

  if (typeof body.quantity !== 'number' || body.quantity <= 0) {
    return errorResponse('La quantité doit être un nombre positif', 400);
  }

  // Calculer le prix total
  const total_price = body.unit_price * body.quantity;

  // Ajouter des valeurs par défaut
  const itemData = {
    ...body,
    total_price,
    quantity: parseInt(body.quantity)
  };

  const data = await orderItemsCrud.create(itemData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un article de commande
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de l\'article requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que l'article existe
  const existing = await orderItemsCrud.findById(id);
  if (!existing) {
    return errorResponse('Article non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.unit_price !== undefined) {
    if (typeof body.unit_price !== 'number' || body.unit_price < 0) {
      return errorResponse('Le prix unitaire doit être un nombre positif ou zéro', 400);
    }
  }

  if (body.quantity !== undefined) {
    if (typeof body.quantity !== 'number' || body.quantity <= 0) {
      return errorResponse('La quantité doit être un nombre positif', 400);
    }
  }

  // Recalculer le prix total si nécessaire
  const updateData = { ...body };
  if (body.unit_price !== undefined || body.quantity !== undefined) {
    const unit_price = body.unit_price !== undefined ? body.unit_price : existing.unit_price;
    const quantity = body.quantity !== undefined ? body.quantity : existing.quantity;
    updateData.total_price = unit_price * quantity;
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await orderItemsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Supprimer un article de commande
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de l\'article requis', 400);
  }

  // Vérifier que l'article existe
  const existing = await orderItemsCrud.findById(id);
  if (!existing) {
    return errorResponse('Article non trouvé', 404);
  }

  const data = await orderItemsCrud.delete(id);
  return successResponse(data);
});
