
import { NextRequest } from 'next/server';
import { 
  CrudOperations, 
  withErrorHandling, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Créer une instance CRUD pour la table profiles
const profilesCrud = new CrudOperations('profiles');

// GET - Récupérer un profil spécifique par ID
export const GET = withErrorHandling(async (request: NextRequest, context: { params: { id: string } }) => {
  const { id } = context.params;
  logApiRequest(request, { id });

  if (!id) {
    return errorResponse('ID du profil requis', 400);
  }

  const data = await profilesCrud.findById(id);
  
  if (!data) {
    return errorResponse('Profil non trouvé', 404);
  }

  // Masquer les données sensibles
  const { password_hash, ...safeProfile } = data;
  return successResponse(safeProfile);
});

// PUT - Mettre à jour un profil spécifique
export const PUT = withErrorHandling(async (request: NextRequest, context: { params: { id: string } }) => {
  const { id } = context.params;
  const body = await validateRequestBody(request);
  
  logApiRequest(request, { id, body });

  if (!id) {
    return errorResponse('ID du profil requis', 400);
  }

  // Vérifier que le profil existe
  const existing = await profilesCrud.findById(id);
  if (!existing) {
    return errorResponse('Profil non trouvé', 404);
  }

  // Validation conditionnelle des champs modifiés
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return errorResponse('Format d\'email invalide', 400);
  }

  if (body.role) {
    const validRoles = ['merchant', 'customer', 'admin'];
    if (!validRoles.includes(body.role)) {
      return errorResponse('Rôle invalide', 400);
    }
  }

  // Traitement du changement de mot de passe
  const updateData = { ...body };
  if (body.password) {
    if (body.password.length < 8) {
      return errorResponse('Le mot de passe doit contenir au moins 8 caractères', 400);
    }
    updateData.password_hash = `hashed_${body.password}_${Date.now()}`;
    updateData.password_changed_at = new Date().toISOString();
    delete updateData.password;
  }

  // Mettre à jour modify_time
  updateData.modify_time = new Date().toISOString();

  const data = await profilesCrud.update(id, updateData);
  
  // Masquer les données sensibles dans la réponse
  const { password_hash, ...safeProfile } = data;
  return successResponse(safeProfile);
});

// DELETE - Désactiver un profil (soft delete)
export const DELETE = withErrorHandling(async (request: NextRequest, context: { params: { id: string } }) => {
  const { id } = context.params;
  logApiRequest(request, { id });

  if (!id) {
    return errorResponse('ID du profil requis', 400);
  }

  // Vérifier que le profil existe
  const existing = await profilesCrud.findById(id);
  if (!existing) {
    return errorResponse('Profil non trouvé', 404);
  }

  // Soft delete: désactiver le profil
  const data = await profilesCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  // Masquer les données sensibles dans la réponse
  const { password_hash, ...safeProfile } = data;
  return successResponse(safeProfile);
});
