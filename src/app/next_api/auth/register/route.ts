
import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { CrudOperations } from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Créer des instances CRUD pour les tables nécessaires
const profilesCrud = new CrudOperations('profiles');
const merchantsCrud = new CrudOperations('merchants');
const subscriptionsCrud = new CrudOperations('subscriptions');

// POST - Inscription utilisateur
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
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
});
