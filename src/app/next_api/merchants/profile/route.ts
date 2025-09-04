/**
 * API pour la gestion des profils de marchands
 */

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
import { 
  withAuth,
  AuthUser 
} from '@/lib/auth-middleware';
import { 
  SubscriptionErrorCode, 
  createSubscriptionError, 
  formatSubscriptionError, 
  logSubscriptionError 
} from '@/lib/subscription-errors';
import { 
  validateMerchantProfile,
  MerchantProfile
} from '@/lib/subscription-validation';

const merchantsCrud = new CrudOperations('merchants');

// GET - Obtenir le profil du marchand connecté
export const GET = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    logApiRequest(request, { userRole: user.role, userId: user.id });

    // Seuls les marchands peuvent accéder à leur profil
    if (user.role !== 'merchant') {
      const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_NOT_FOUND);
      logSubscriptionError(error, { userId: user.id, role: user.role });
      return Response.json(formatSubscriptionError(error), { status: error.statusCode });
    }

    try {
      const profile = await merchantsCrud.findById(user.id);
      
      if (!profile) {
        const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_NOT_FOUND);
        logSubscriptionError(error, { userId: user.id });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }

      // Masquer les informations sensibles
      const safeProfile = {
        ...profile,
        // Ne pas exposer les tokens ou clés API
        settings: {
          ...profile.settings,
          api_keys: undefined,
          webhook_secrets: undefined
        }
      };

      return successResponse(safeProfile);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return errorResponse('Erreur lors de la récupération du profil', 500);
    }
  },
  { requiredRoles: ['merchant'] }
);

// PUT - Mettre à jour le profil du marchand
export const PUT = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const body = await validateRequestBody(request);
    logApiRequest(request, { userRole: user.role, userId: user.id });

    // Seuls les marchands peuvent modifier leur profil
    if (user.role !== 'merchant') {
      const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_UPDATE_FORBIDDEN);
      logSubscriptionError(error, { userId: user.id, role: user.role });
      return Response.json(formatSubscriptionError(error), { status: error.statusCode });
    }

    try {
      // Vérifier que le profil existe
      const existingProfile = await merchantsCrud.findById(user.id);
      if (!existingProfile) {
        const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_NOT_FOUND);
        logSubscriptionError(error, { userId: user.id });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }

      // Champs autorisés pour la modification par le marchand
      const allowedFields = [
        'business_name',
        'whatsapp_number',
        'email',
        'profile_image_url',
        'address',
        'city',
        'country',
        'currency',
        'timezone',
        'settings'
      ];

      // Filtrer les champs non autorisés
      const updateData: Partial<MerchantProfile> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field as keyof MerchantProfile] = body[field];
        }
      }

      // Validation des données
      const validationErrors = validateMerchantProfile(updateData);
      if (validationErrors.length > 0) {
        const error = createSubscriptionError(
          SubscriptionErrorCode.PROFILE_INVALID_DATA,
          { validationErrors }
        );
        logSubscriptionError(error, { userId: user.id, errors: validationErrors });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }

      // Vérifier l'unicité de l'email si modifié
      if (updateData.email && updateData.email !== existingProfile.email) {
        const existingWithEmail = await merchantsCrud.findMany({ email: updateData.email });
        if (existingWithEmail && existingWithEmail.length > 0) {
          const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_EMAIL_EXISTS);
          logSubscriptionError(error, { userId: user.id, email: updateData.email });
          return Response.json(formatSubscriptionError(error), { status: error.statusCode });
        }
      }

      // Vérifier l'unicité du numéro WhatsApp si modifié
      if (updateData.whatsapp_number && updateData.whatsapp_number !== existingProfile.whatsapp_number) {
        const existingWithWhatsApp = await merchantsCrud.findMany({ 
          whatsapp_number: updateData.whatsapp_number 
        });
        if (existingWithWhatsApp && existingWithWhatsApp.length > 0) {
          const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_WHATSAPP_EXISTS);
          logSubscriptionError(error, { 
            userId: user.id, 
            whatsapp_number: updateData.whatsapp_number 
          });
          return Response.json(formatSubscriptionError(error), { status: error.statusCode });
        }
      }

      // Générer un nouveau slug si le nom de l'entreprise change
      if (updateData.business_name && updateData.business_name !== existingProfile.business_name) {
        const baseSlug = updateData.business_name.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        updateData.slug = `${baseSlug}-${Date.now()}`;
      }

      // Fusionner les paramètres existants avec les nouveaux
      if (updateData.settings) {
        updateData.settings = {
          ...existingProfile.settings,
          ...updateData.settings
        };
      }

      // Ajouter la date de modification
      (updateData as any).modify_time = new Date().toISOString();

      // Mettre à jour le profil
      const updatedProfile = await merchantsCrud.update(user.id, updateData);

      // Masquer les informations sensibles dans la réponse
      const safeProfile = {
        ...updatedProfile,
        settings: {
          ...updatedProfile.settings,
          api_keys: undefined,
          webhook_secrets: undefined
        }
      };

      console.log(`Profil mis à jour pour le marchand ${user.id}: ${updatedProfile.business_name}`);

      return successResponse(safeProfile);

    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return errorResponse('Erreur lors de la mise à jour du profil', 500);
    }
  },
  { requiredRoles: ['merchant'] }
);

// PATCH - Mise à jour partielle des paramètres
export const PATCH = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const body = await validateRequestBody(request);
    logApiRequest(request, { userRole: user.role, userId: user.id });

    // Seuls les marchands peuvent modifier leurs paramètres
    if (user.role !== 'merchant') {
      const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_UPDATE_FORBIDDEN);
      logSubscriptionError(error, { userId: user.id, role: user.role });
      return Response.json(formatSubscriptionError(error), { status: error.statusCode });
    }

    try {
      // Vérifier que le profil existe
      const existingProfile = await merchantsCrud.findById(user.id);
      if (!existingProfile) {
        const error = createSubscriptionError(SubscriptionErrorCode.PROFILE_NOT_FOUND);
        logSubscriptionError(error, { userId: user.id });
        return Response.json(formatSubscriptionError(error), { status: error.statusCode });
      }

      // Cette route est spécialement pour les paramètres
      if (!body.settings) {
        return errorResponse('Les paramètres sont requis pour cette route', 400);
      }

      // Fusionner les paramètres
      const updatedSettings = {
        ...existingProfile.settings,
        ...body.settings
      };

      // Mettre à jour seulement les paramètres
      const updatedProfile = await merchantsCrud.update(user.id, {
        settings: updatedSettings,
        modify_time: new Date().toISOString()
      });

      return successResponse({
        settings: updatedSettings,
        message: 'Paramètres mis à jour avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      return errorResponse('Erreur lors de la mise à jour des paramètres', 500);
    }
  },
  { requiredRoles: ['merchant'] }
);