import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Récupérer le token depuis les cookies ou headers
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/about',
    '/contact',
    '/pricing',
    '/features',
    '/demo',
    '/legal/privacy',
    '/legal/terms'
  ];

  // Routes d'authentification
  const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/orders',
    '/subscription',
    '/admin'
  ];

  // Si l'utilisateur est sur une route publique, laisser passer
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Si l'utilisateur est connecté et essaie d'accéder aux pages d'auth,
    // rediriger vers le dashboard
    if (token && authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Si l'utilisateur essaie d'accéder à une route protégée sans token
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    // Rediriger vers la page de connexion avec l'URL de retour
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pour toutes les autres routes, laisser passer
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};