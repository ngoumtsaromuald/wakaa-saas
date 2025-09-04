
import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { CrudOperations } from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';
import { 
  AuthErrorCode, 
  createAuthError, 
  formatAuthError, 
  logAuthError 
} from '@/lib/auth-errors';

// Créer une instance CRUD pour la table profiles
const profilesCrud = new CrudOperations('profiles');
const userSessionsCrud = new CrudOperations('user_sessions');

// POST - Authentification utilisateur
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { email: body.email });
  
  // Validation des champs obligatoires
  const requiredFields = ['email', 'password'];
  for (const field of requiredFields) {
    if (!body[field]) {
      const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS);
      logAuthError(error, { 
        email: body.email, 
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        endpoint: '/auth/login'
      });
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS);
    logAuthError(error, { 
      email: body.email, 
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      endpoint: '/auth/login'
    });
    return Response.json(formatAuthError(error), { status: error.statusCode });
  }

  try {
    // Rechercher l'utilisateur par email (d'abord dans profiles, puis admin_users)
    let user = null;
    let userType = 'profile';
    
    const users = await profilesCrud.findMany({ email: body.email });
    if (users && users.length > 0) {
      user = users[0];
    } else {
      // Chercher dans admin_users si pas trouvé dans profiles
      const adminUsersCrud = new CrudOperations('admin_users');
      const adminUsers = await adminUsersCrud.findMany({ email: body.email });
      if (adminUsers && adminUsers.length > 0) {
        user = adminUsers[0];
        userType = 'admin';
      }
    }
    
    if (!user) {
      const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS);
      logAuthError(error, { 
        email: body.email, 
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        endpoint: '/auth/login'
      });
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Vérifier que l'utilisateur est actif
    if (!user.is_active) {
      const error = createAuthError(AuthErrorCode.USER_INACTIVE);
      logAuthError(error, { 
        userId: user.id,
        email: body.email, 
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        endpoint: '/auth/login'
      });
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Vérifier le mot de passe (simulation - dans un vrai système, utiliser bcrypt)
    const expectedHash = `hashed_${body.password}_`;
    if (!user.password_hash.startsWith(expectedHash.substring(0, expectedHash.length - 1))) {
      const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS);
      logAuthError(error, { 
        userId: user.id,
        email: body.email, 
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        endpoint: '/auth/login'
      });
      return Response.json(formatAuthError(error), { status: error.statusCode });
    }

    // Vérifier les permissions spécifiques selon le type d'utilisateur
    if (userType === 'admin') {
      const adminRoles = ['super_admin', 'admin', 'support', 'analyst'];
      if (!adminRoles.includes(user.role)) {
        const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
          userRole: user.role,
          allowedRoles: adminRoles
        });
        logAuthError(error, { 
          userId: user.id,
          email: body.email,

          endpoint: '/auth/login'
        });
        return Response.json(formatAuthError(error), { status: error.statusCode });
      }
    } else {
      const userRoles = ['merchant', 'customer', 'admin'];
      if (!userRoles.includes(user.role)) {
        const error = createAuthError(AuthErrorCode.ROLE_NOT_AUTHORIZED, {
          userRole: user.role,
          allowedRoles: userRoles
        });
        logAuthError(error, { 
          userId: user.id,
          email: body.email,

          endpoint: '/auth/login'
        });
        return Response.json(formatAuthError(error), { status: error.statusCode });
      }
    }

    // Générer un token de session
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 15)}`;

    // Extraire les informations de la requête
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
    const user_agent = request.headers.get('user-agent') || '';

    // Analyser l'user agent pour extraire les informations du device
    const parseUserAgent = (userAgent: string) => {
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                     userAgent.includes('Firefox') ? 'Firefox' : 
                     userAgent.includes('Safari') ? 'Safari' : 'Unknown';
      
      return {
        type: isMobile ? 'mobile' : 'desktop',
        browser,
        os: userAgent.includes('Windows') ? 'Windows' : 
            userAgent.includes('Mac') ? 'macOS' : 
            userAgent.includes('Linux') ? 'Linux' : 
            userAgent.includes('Android') ? 'Android' : 
            userAgent.includes('iOS') ? 'iOS' : 'Unknown'
      };
    };

    // Date d'expiration de la session
    const expiresAt = new Date();
    if (body.remember_me) {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 heures
    }

    // Créer une session utilisateur
    const sessionData = {
      merchant_id: user.id,
      session_token: sessionToken,
      device_info: parseUserAgent(user_agent),
      ip_address,
      user_agent,
      is_active: true,
      last_activity_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    await userSessionsCrud.create(sessionData);

    // Mettre à jour last_login_at
    await profilesCrud.update(user.id, {
      last_login_at: new Date().toISOString()
    });

    // Préparer les données utilisateur (sans mot de passe)
    const { password_hash, ...safeUser } = user;

    console.log(`Connexion réussie pour: ${user.email}`);

    return successResponse({
      user: safeUser,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
      message: 'Connexion réussie'
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'authentification:', error);
    
    const authError = createAuthError(AuthErrorCode.AUTH_SERVICE_ERROR, {
      originalError: error.message
    });
    
    logAuthError(authError, { 
      email: body.email, 
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      endpoint: '/auth/login'
    });
    
    return Response.json(formatAuthError(authError), { status: authError.statusCode });
  }
});
