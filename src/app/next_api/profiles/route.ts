
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

// Créer une instance CRUD pour la table profiles (utilisateurs)
const profilesCrud = new CrudOperations('profiles');
const merchantsCrud = new CrudOperations('merchants');
const subscriptionsCrud = new CrudOperations('subscriptions');

// GET - Récupérer les profils utilisateurs
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  const searchParams = request.nextUrl.searchParams;
  
  const role = searchParams.get('role');
  const is_active = searchParams.get('is_active');
  
  logApiRequest(request, { limit, offset, search, role, is_active });

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

  const data = await profilesCrud.findMany(filters, limit, offset);
  
  // Masquer les mots de passe dans la réponse
  const sanitizedData = data?.map((user: any) => {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  });

  return successResponse(sanitizedData);
});

// POST - Créer un nouveau profil utilisateur (inscription complète)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { email: body.email, role: body.role });
  
  // Validation des champs obligatoires
  const requiredFields = ['email', 'password', 'full_name', 'role'];
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
  const validRoles = ['merchant', 'customer', 'admin'];
  if (!validRoles.includes(body.role)) {
    return errorResponse('Rôle invalide', 400);
  }

  // Validation du mot de passe
  if (body.password.length < 8) {
    return errorResponse('Le mot de passe doit contenir au moins 8 caractères', 400);
  }

  try {
    // Vérifier l'unicité de l'email
    const existingUsers = await profilesCrud.findMany({ email: body.email });
    if (existingUsers && existingUsers.length > 0) {
      return errorResponse('Un utilisateur avec cet email existe déjà', 409);
    }

    // Hash du mot de passe (simulation - dans un vrai système, utiliser bcrypt)
    const passwordHash = `hashed_${body.password}_${Date.now()}`;

    // Générer un ID utilisateur unique
    const user_id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer le profil utilisateur
    const profileData = {
      id: user_id,
      email: body.email,
      password_hash: passwordHash,
      full_name: body.full_name,
      role: body.role,
      is_active: true,
      avatar_url: body.avatar_url || null,
      phone_number: body.phone_number || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || 'Cameroon',
      timezone: body.timezone || 'Africa/Douala',
      language: body.language || 'fr',
      email_verified: false,
      phone_verified: false,
      two_factor_enabled: false,
      preferences: body.preferences || {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        theme: 'system',
        language: 'fr'
      }
    };

    const newUser = await profilesCrud.create(profileData);

    // Si c'est un marchand, créer aussi l'entrée merchant
    if (body.role === 'merchant') {
      const merchantData = {
        business_name: body.business_name || body.full_name,
        whatsapp_number: body.phone_number || body.whatsapp_number,
        email: body.email,
        slug: `${body.full_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        subscription_plan: body.subscription_plan || 'free',
        status: 'active',
        city: body.city,
        country: body.country || 'Cameroon',
        currency: 'FCFA',
        timezone: 'Africa/Douala',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 jours d'essai
        settings: {
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

      const merchant = await merchantsCrud.create(merchantData);

      // Créer l'abonnement initial
      const subscriptionData = {
        merchant_id: merchant.id,
        plan_type: body.subscription_plan || 'free',
        status: 'active',
        start_date: new Date().toISOString(),
        auto_renew: true
      };

      await subscriptionsCrud.create(subscriptionData);
    }

    // Générer un token de session pour la connexion automatique
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 15)}`;

    // Préparer les données utilisateur (sans mot de passe)
    const { password_hash: _, ...safeUser } = newUser;

    console.log(`Nouvel utilisateur créé: ${newUser.email} (${newUser.role})`);

    return successResponse({
      user: safeUser,
      token: sessionToken,
      message: 'Compte créé avec succès'
    }, 201);

  } catch (error: any) {
    console.error('Erreur lors de la création du profil:', error);
    throw error;
  }
});

// PUT - Mettre à jour un profil utilisateur
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID de l\'utilisateur requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que l'utilisateur existe
  const existing = await profilesCrud.findById(id);
  if (!existing) {
    return errorResponse('Utilisateur non trouvé', 404);
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

  // Vérifier l'unicité de l'email si modifié
  if (body.email && body.email !== existing.email) {
    try {
      const existingUsers = await profilesCrud.findMany({ email: body.email });
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

  const data = await profilesCrud.update(id, updateData);
  
  // Masquer les données sensibles dans la réponse
  const { password_hash, ...safeUser } = data;
  return successResponse(safeUser);
});

// DELETE - Désactiver un utilisateur (soft delete)
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID de l\'utilisateur requis', 400);
  }

  // Vérifier que l'utilisateur existe
  const existing = await profilesCrud.findById(id);
  if (!existing) {
    return errorResponse('Utilisateur non trouvé', 404);
  }

  // Soft delete: désactiver l'utilisateur
  const data = await profilesCrud.update(id, {
    is_active: false,
    modify_time: new Date().toISOString()
  });

  // Masquer les données sensibles dans la réponse
  const { password_hash, ...safeUser } = data;
  return successResponse(safeUser);
});
