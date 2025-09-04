
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

// Créer une instance CRUD pour la table products
const productsCrud = new CrudOperations('products');

// GET - Récupérer les produits
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  // Paramètres de filtrage spécifiques aux produits
  const merchant_id = searchParams.get('merchant_id');
  const category = searchParams.get('category');
  const is_active = searchParams.get('is_active');
  
  logApiRequest(request, { limit, offset, search, merchant_id, category, is_active });

  // Construire les filtres
  const filters: Record<string, any> = {};
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (category) {
    filters.category = category;
  }
  
  if (is_active !== null) {
    filters.is_active = is_active === 'true';
  }

  if (search) {
    // Note: Pour une recherche plus avancée par nom, on pourrait
    // implémenter une recherche côté application
    filters.name = search;
  }

  const data = await productsCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau produit
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'name', 'price'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du prix
  if (typeof body.price !== 'number' || body.price < 0) {
    return errorResponse('Le prix doit être un nombre positif ou zéro', 400);
  }

  // Validation de la quantité en stock si fournie
  if (body.stock_quantity !== undefined) {
    if (typeof body.stock_quantity !== 'number' || body.stock_quantity < 0) {
      return errorResponse('La quantité en stock doit être un nombre positif ou zéro', 400);
    }
  }

  // Validation du poids si fourni
  if (body.weight !== undefined) {
    if (typeof body.weight !== 'number' || body.weight < 0) {
      return errorResponse('Le poids doit être un nombre positif ou zéro', 400);
    }
  }

  // Validation de l'URL de l'image si fournie
  if (body.image_url) {
    try {
      new URL(body.image_url);
    } catch {
      return errorResponse('URL d\'image invalide', 400);
    }
  }

  // Ajouter des valeurs par défaut
  const productData = {
    ...body,
    stock_quantity: body.stock_quantity || 0,
    is_active: body.is_active !== undefined ? body.is_active : true,
    dimensions: body.dimensions ? JSON.stringify(body.dimensions) : null
  };

  const data = await productsCrud.create(productData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un produit
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID du produit requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que le produit existe
  const existing = await productsCrud.findById(id);
  if (!existing) {
    return errorResponse('Produit non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || body.price < 0) {
      return errorResponse('Le prix doit être un nombre positif ou zéro', 400);
    }
  }

  if (body.stock_quantity !== undefined) {
    if (typeof body.stock_quantity !== 'number' || body.stock_quantity < 0) {
      return errorResponse('La quantité en stock doit être un nombre positif ou zéro', 400);
    }
  }

  if (body.weight !== undefined) {
    if (typeof body.weight !== 'number' || body.weight < 0) {
      return errorResponse('Le poids doit être un nombre positif ou zéro', 400);
    }
  }

  if (body.image_url) {
    try {
      new URL(body.image_url);
    } catch {
      return errorResponse('URL d\'image invalide', 400);
    }
  }

  // Sérialiser dimensions si nécessaire
  const updateData = { ...body };
  if (body.dimensions && typeof body.dimensions === 'object') {
    updateData.dimensions = JSON.stringify(body.dimensions);
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await productsCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Supprimer un produit (soft delete en désactivant)
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID du produit requis', 400);
  }

  // Vérifier que le produit existe
  const existing = await productsCrud.findById(id);
  if (!existing) {
    return errorResponse('Produit non trouvé', 404);
  }

  // Soft delete: désactiver le produit
  const data = await productsCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
