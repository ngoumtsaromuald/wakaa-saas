
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

// Créer une instance CRUD pour la table qr_codes
const qrCodesCrud = new CrudOperations('qr_codes');

// GET - Récupérer les QR codes
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, merchant_id } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const type = searchParams.get('type');
  const is_active = searchParams.get('is_active');
  
  logApiRequest(request, { limit, offset, merchant_id, type, is_active });

  if (!merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  // Construire les filtres
  const filters: Record<string, any> = {
    merchant_id: parseInt(merchant_id)
  };
  
  if (type) {
    filters.type = type;
  }
  
  if (is_active !== null) {
    filters.is_active = is_active === 'true';
  }

  const data = await qrCodesCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST - Créer un nouveau QR code
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['merchant_id', 'type', 'url'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du type
  const validTypes = ['order_link', 'product', 'catalog', 'contact', 'payment'];
  if (!validTypes.includes(body.type)) {
    return errorResponse('Type de QR code invalide', 400);
  }

  // Validation de l'URL
  try {
    new URL(body.url);
  } catch {
    return errorResponse('URL invalide', 400);
  }

  // Générer un code unique
  const generateCode = () => {
    return `QR_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  };

  const code = generateCode();

  // Simuler la génération d'image QR code
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(body.url)}`;

  // Ajouter des valeurs par défaut
  const qrCodeData = {
    ...body,
    code,
    qr_image_url: qrImageUrl,
    is_active: body.is_active !== undefined ? body.is_active : true,
    scan_count: 0,
    metadata: body.metadata || {}
  };

  const data = await qrCodesCrud.create(qrCodeData);
  return successResponse(data, 201);
});

// PUT - Mettre à jour un QR code
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID du QR code requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que le QR code existe
  const existing = await qrCodesCrud.findById(id);
  if (!existing) {
    return errorResponse('QR code non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.type) {
    const validTypes = ['order_link', 'product', 'catalog', 'contact', 'payment'];
    if (!validTypes.includes(body.type)) {
      return errorResponse('Type de QR code invalide', 400);
    }
  }

  if (body.url) {
    try {
      new URL(body.url);
    } catch {
      return errorResponse('URL invalide', 400);
    }
  }

  // Régénérer l'image QR si l'URL a changé
  const updateData = { ...body };
  if (body.url && body.url !== existing.url) {
    updateData.qr_image_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(body.url)}`;
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await qrCodesCrud.update(id, updateData);
  return successResponse(data);
});

// DELETE - Désactiver un QR code
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID du QR code requis', 400);
  }

  // Vérifier que le QR code existe
  const existing = await qrCodesCrud.findById(id);
  if (!existing) {
    return errorResponse('QR code non trouvé', 404);
  }

  // Soft delete: désactiver le QR code
  const data = await qrCodesCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  return successResponse(data);
});
