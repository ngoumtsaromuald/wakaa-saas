"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

/**
 * Composant qui redirige les utilisateurs authentifiés loin des pages d'auth
 * et les utilisateurs non authentifiés vers les pages d'auth
 */
export function AuthRedirect({ 
  children, 
  redirectIfAuthenticated = true,
  redirectTo = '/dashboard'
}: AuthRedirectProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (redirectIfAuthenticated && user) {
        // Rediriger les utilisateurs connectés loin des pages d'auth
        const targetPath = user.role === 'admin' || (user.role as any) === 'super_admin' 
          ? '/admin' 
          : redirectTo;
        router.push(targetPath);
      }
    }
  }, [user, loading, redirectIfAuthenticated, redirectTo, router]);

  // Afficher le loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-muted-foreground">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté et qu'on doit le rediriger, ne rien afficher
  if (redirectIfAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-muted-foreground">
            Redirection en cours...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}