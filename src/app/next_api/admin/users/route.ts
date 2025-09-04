
import { NextRequest } from 'next/server';
import { 
  CrudOperations, 
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
  AuthErrorCode, 
  createAuthError, 
  formatAuthError, 
  logAuthError 
} from '@/lib/auth-errors';

// Créer une instance CRUD pour la table admin_users
const adminUsersCrud = new CrudOperations('admin_users');

// GET - Récupérer les utilisateurs administrateurs
export const GET = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { limit, offset, search } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    
    const role = searchParams.get('role');
    const is_active = searchParams.get('is_active');
    
    logApiRequest(request, { limit, offset, search, role, is_active, userRole: user.role });

    // Vérifier les permissions admin
    const adminRoles = ['admin', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
        userRole: user.role,
        allowedRoles: adminRoles,
        resource: 'admin users list'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,
        endpoint: '/admin/users'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Construire les filtres
    const filters: Record<string, any> = {};
    
    if (role) {
      filters.role = role;
    }
    
    if (is_active !== null) {
      filters.is_active = is_active === 'true';
    }

    if (search) {
      filters.email = search;
    }

    const data = await adminUsersCrud.findMany(filters, limit, offset);
    
    // Masquer les mots de passe dans la réponse
    const sanitizedData = data?.map((adminUser: any) => {
      const { password_hash, two_factor_secret, ...safeUser } = adminUser;
      return safeUser;
    });

    return successResponse(sanitizedData);
  },
  { requiredRoles: ['admin', 'super_admin'] }
);

// POST - Créer un nouvel utilisateur administrateur
export const POST = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const body = await validateRequestBody(request);
    logApiRequest(request, { userRole: user.role });
    
    // Seuls les super_admin peuvent créer des utilisateurs admin
    if (user.role !== 'super_admin') {
      const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
        userRole: user.role,
        allowedRoles: ['super_admin'],
        resource: 'create admin user'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,
        endpoint: '/admin/users'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }
    
    // Validation des champs obligatoires
    const requiredFields = ['email', 'password', 'name', 'role'];
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

    // Validation du rôle
    const validRoles = ['super_admin', 'admin', 'support', 'analyst'];
    if (!validRoles.includes(body.role)) {
      return errorResponse('Rôle invalide', 400);
    }

    // Validation du mot de passe
    if (body.password.length < 8) {
      return errorResponse('Le mot de passe doit contenir au moins 8 caractères', 400);
    }

    // Vérifier l'unicité de l'email
    try {
      const existingUsers = await adminUsersCrud.findMany({ email: body.email });
      if (existingUsers && existingUsers.length > 0) {
        return errorResponse('Un utilisateur avec cet email existe déjà', 409);
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification d\'unicité:', error);
    }

    // Hash du mot de passe (simulation - dans un vrai système, utiliser bcrypt)
    const password_hash = `hashed_${body.password}_${Date.now()}`;

    // Ajouter des valeurs par défaut
    const adminUserData = {
      ...body,
      password_hash,
      is_active: body.is_active !== undefined ? body.is_active : true,
      permissions: body.permissions || {},
      two_factor_enabled: false,
      password_changed_at: new Date().toISOString()
    };

    // Supprimer le mot de passe en clair
    delete adminUserData.password;

    const data = await adminUsersCrud.create(adminUserData);
    
    console.log(`Nouvel utilisateur admin créé par ${user.email}: ${data.email} (${data.role})`);
    
    // Masquer les données sensibles dans la réponse
    const { password_hash: _, two_factor_secret, ...safeUser } = data;
    return successResponse(safeUser, 201);
  },
  { requiredRoles: ['super_admin'] }
);

// PUT - Mettre à jour un utilisateur administrateur
export const PUT = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return errorResponse('ID de l\'utilisateur requis', 400);
    }

    const body = await validateRequestBody(request);
    
    // Vérifier que l'utilisateur existe
    const existing = await adminUsersCrud.findById(id);
    if (!existing) {
      return errorResponse('Utilisateur non trouvé', 404);
    }

    // Vérifier les permissions
    const canModify = user.role === 'super_admin' || 
                     (user.role === 'admin' && existing.role !== 'super_admin') ||
                     (user.id === id); // Un utilisateur peut modifier son propre profil

    if (!canModify) {
      const error = createAuthError(AuthErrorCode.PERMISSION_DENIED, {
        userRole: user.role,
        targetRole: existing.role,
        resource: 'update admin user'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,

        endpoint: '/admin/users'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Les utilisateurs non super_admin ne peuvent pas modifier certains champs
    if (user.role !== 'super_admin') {
      const restrictedFields = ['role', 'permissions'];
      const hasRestrictedFields = restrictedFields.some(field => body[field] !== undefined);
      
      if (hasRestrictedFields) {
        return errorResponse(
          'Seuls les super administrateurs peuvent modifier les rôles et permissions',
          403
        );
      }
    }

    // Validation conditionnelle des champs modifiés
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return errorResponse('Format d\'email invalide', 400);
    }

    if (body.role) {
      const validRoles = ['super_admin', 'admin', 'support', 'analyst'];
      if (!validRoles.includes(body.role)) {
        return errorResponse('Rôle invalide', 400);
      }
    }

    // Vérifier l'unicité de l'email si modifié
    if (body.email && body.email !== existing.email) {
      try {
        const existingUsers = await adminUsersCrud.findMany({ email: body.email });
        if (existingUsers && existingUsers.length > 0) {
          return errorResponse('Un utilisateur avec cet email existe déjà', 409);
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification d\'unicité:', error);
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

    // Mettre à jour last_login_at si c'est une connexion
    if (body.login) {
      updateData.last_login_at = new Date().toISOString();
      delete updateData.login;
    }

    // Mettre à jour modify_time
    updateData.modify_time = new Date().toISOString();

    const data = await adminUsersCrud.update(id, updateData);
    
    console.log(`Utilisateur admin mis à jour par ${user.email}: ${data.email}`);
    
    // Masquer les données sensibles dans la réponse
    const { password_hash, two_factor_secret, ...safeUser } = data;
    return successResponse(safeUser);
  },
  { requiredRoles: ['admin', 'super_admin'] }
);

// DELETE - Désactiver un utilisateur administrateur (soft delete)
export const DELETE = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { id } = parseQueryParams(request);

    if (!id) {
      return errorResponse('ID de l\'utilisateur requis', 400);
    }

    // Vérifier que l'utilisateur existe
    const existing = await adminUsersCrud.findById(id);
    if (!existing) {
      return errorResponse('Utilisateur non trouvé', 404);
    }

    // Vérifier les permissions
    const canDelete = user.role === 'super_admin' || 
                     (user.role === 'admin' && existing.role !== 'super_admin');

    if (!canDelete) {
      const error = createAuthError(AuthErrorCode.PERMISSION_DENIED, {
        userRole: user.role,
        targetRole: existing.role,
        resource: 'delete admin user'
      });
      
      logAuthError(error, { 
        userId: user.id,
        email: user.email,

        endpoint: '/admin/users'
      });
      
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Empêcher l'auto-suppression
    if (user.id === id) {
      return errorResponse('Vous ne pouvez pas désactiver votre propre compte', 400);
    }

    // Soft delete: désactiver l'utilisateur
    const data = await adminUsersCrud.update(id, {
      is_active: false,
      modify_time: new Date().toISOString()
    });

    console.log(`Utilisateur admin désactivé par ${user.email}: ${existing.email}`);

    // Masquer les données sensibles dans la réponse
    const { password_hash, two_factor_secret, ...safeUser } = data;
    return successResponse(safeUser);
  },
  { requiredRoles: ['admin', 'super_admin'] }
);
