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
  requireMerchant,
  AuthUser 
} from '@/lib/auth-middleware';
import { 
  AuthErrorCode, 
  createAuthError, 
  formatAuthError, 
  logAuthError 
} from '@/lib/auth-errors';

// Créer une instance CRUD pour la table merchants
const merchantsCrud = new CrudOperations('merchants');

// GET - Récupérer les marchands (Admin/Support uniquement)
export const GET = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { limit, offset, search, status } = parseQueryParams(request);
    logApiRequest(request, { limit, offset, search, status, userRole: user.role });

    // Vérifier les permissions
    const allowedRoles = ['admin', 'super_admin', 'support', 'analyst'];
    if (!allowedRoles.includes(user.role)) {
      const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
        userRole: user.role,
        allowedRoles,
        resource: 'merchants list'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,
        endpoint: '/merchants'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Construire les filtres
    const filters: Record<string, any> = {};
    
    if (status) {
      filters.status = status;
    }

    if (search) {
      // Pour la recherche, on peut chercher par business_name ou email
      filters.business_name = search;
    }

    const data = await merchantsCrud.findMany(filters, limit, offset);
    
    return successResponse(data);
  },
  { requiredRoles: ['admin', 'super_admin', 'support', 'analyst'] }
);

// POST - Créer un nouveau marchand (Admin uniquement)
export const POST = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const body = await validateRequestBody(request);
    logApiRequest(request, { userRole: user.role });
    
    // Vérifier les permissions admin
    const adminRoles = ['admin', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
        userRole: user.role,
        allowedRoles: adminRoles,
        resource: 'create merchant'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,
        endpoint: '/merchants'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }
    
    // Validation des champs obligatoires
    const requiredFields = ['business_name', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`Le champ ${field} est obligatoire`, 400);
      }
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse('Format d\'email invalide', 400);
    }

    // Vérifier l'unicité de l'email
    const existingMerchants = await merchantsCrud.findMany({ email: body.email });
    if (existingMerchants && existingMerchants.length > 0) {
      return errorResponse('Un marchand avec cet email existe déjà', 409);
    }

    // Générer un slug unique
    const baseSlug = body.business_name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const slug = `${baseSlug}-${Date.now()}`;

    // Ajouter des valeurs par défaut
    const merchantData = {
      ...body,
      slug,
      status: body.status || 'active',
      subscription_plan: body.subscription_plan || 'free',
      currency: body.currency || 'FCFA',
      timezone: body.timezone || 'Africa/Douala',
      country: body.country || 'Cameroon',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      settings: body.settings || {
        notifications: {
          email: true,
          whatsapp: true,
          sms: false
        },
        business: {
          auto_confirm_orders: false,
          require_payment_confirmation: true
        }
      }
    };

    const data = await merchantsCrud.create(merchantData);
    
    console.log(`Nouveau marchand créé par ${user.email}: ${data.business_name}`);
    
    return successResponse(data, 201);
  },
  { requiredRoles: ['admin', 'super_admin'] }
);

// PUT - Mettre à jour un marchand
export const PUT = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return errorResponse('ID du marchand requis', 400);
    }

    const body = await validateRequestBody(request);
    
    // Vérifier que le marchand existe
    const existing = await merchantsCrud.findById(id);
    if (!existing) {
      return errorResponse('Marchand non trouvé', 404);
    }

    // Vérifier les permissions
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isMerchantOwner = user.role === 'merchant' && user.id === existing.id;
    
    if (!isAdmin && !isMerchantOwner) {
      const error = createAuthError(AuthErrorCode.PERMISSION_DENIED, {
        userRole: user.role,
        resource: 'update merchant',
        merchantId: id
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,
        endpoint: '/merchants'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Les marchands ne peuvent modifier que certains champs
    if (!isAdmin) {
      const allowedFields = [
        'business_name', 'whatsapp_number', 'city', 'address',
        'description', 'logo_url', 'settings'
      ];
      
      const restrictedFields = Object.keys(body).filter(
        field => !allowedFields.includes(field)
      );
      
      if (restrictedFields.length > 0) {
        return errorResponse(
          `Champs non autorisés pour les marchands: ${restrictedFields.join(', ')}`,
          403
        );
      }
    }

    // Validation conditionnelle
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return errorResponse('Format d\'email invalide', 400);
    }

    // Vérifier l'unicité de l'email si modifié
    if (body.email && body.email !== existing.email) {
      const existingMerchants = await merchantsCrud.findMany({ email: body.email });
      if (existingMerchants && existingMerchants.length > 0) {
        return errorResponse('Un marchand avec cet email existe déjà', 409);
      }
    }

    // Mettre à jour modify_time
    const updateData = {
      ...body,
      modify_time: new Date().toISOString()
    };

    const data = await merchantsCrud.update(id, updateData);
    
    console.log(`Marchand mis à jour par ${user.email}: ${data.business_name}`);
    
    return successResponse(data);
  },
  { requiredRoles: ['merchant', 'admin', 'super_admin'] }
);

// DELETE - Désactiver un marchand (Admin uniquement)
export const DELETE = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { id } = parseQueryParams(request);

    if (!id) {
      return errorResponse('ID du marchand requis', 400);
    }

    // Vérifier les permissions admin
    const adminRoles = ['admin', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
        userRole: user.role,
        allowedRoles: adminRoles,
        resource: 'delete merchant'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,
        endpoint: '/merchants'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Vérifier que le marchand existe
    const existing = await merchantsCrud.findById(id);
    if (!existing) {
      return errorResponse('Marchand non trouvé', 404);
    }

    // Soft delete: désactiver le marchand
    const data = await merchantsCrud.update(id, {
      status: 'inactive',
      modify_time: new Date().toISOString()
    });

    console.log(`Marchand désactivé par ${user.email}: ${existing.business_name}`);

    return successResponse(data);
  },
  { requiredRoles: ['admin', 'super_admin'] }
);