"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'merchant' | 'customer' | 'admin' | 'super_admin' | 'support' | 'analyst';
  requiredRoles?: string[];
  fallbackPath?: string;
  showError?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredRole,
  requiredRoles,
  fallbackPath = '/auth/login',
  showError = true
}: AuthGuardProps) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Déterminer les rôles autorisés
  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : []);

  useEffect(() => {
    if (!loading) {
      // Pas d'utilisateur connecté
      if (!user) {
        if (showError) {
          setAuthError('Vous devez être connecté pour accéder à cette page');
        }
        setTimeout(() => {
          router.push(fallbackPath);
        }, 2000);
        return;
      }

      // Utilisateur inactif
      if (!user.is_active) {
        setAuthError('Votre compte est désactivé. Contactez le support.');
        setIsChecking(false);
        return;
      }

      // Vérification des rôles
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        setAuthError(
          `Accès refusé. Cette page est réservée aux utilisateurs avec les rôles: ${allowedRoles.join(', ')}`
        );
        setIsChecking(false);
        return;
      }

      // Tout est OK
      setAuthError(null);
      setIsChecking(false);
    }
  }, [user, loading, allowedRoles, router, fallbackPath, showError]);

  // Affichage pendant le chargement
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-muted-foreground">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs d'authentification
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Accès Refusé
            </h1>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {authError}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Se Connecter
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Retour à l'Accueil
            </Button>
          </div>

          {user && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Connecté en tant que: <strong>{user.email}</strong></p>
              <p>Rôle actuel: <strong>{user.role}</strong></p>
              {allowedRoles.length > 0 && (
                <p>Rôles requis: <strong>{allowedRoles.join(', ')}</strong></p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Erreur générale d'authentification
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Erreur d'Authentification
            </h1>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Réessayer
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Se Reconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>;
}

// Composants spécialisés pour différents rôles
export function MerchantGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="merchant" {...props}>
      {children}
    </AuthGuard>
  );
}

export function AdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRoles'>) {
  return (
    <AuthGuard requiredRoles={['admin', 'super_admin']} {...props}>
      {children}
    </AuthGuard>
  );
}

export function SuperAdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="super_admin" {...props}>
      {children}
    </AuthGuard>
  );
}

export function SupportGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRoles'>) {
  return (
    <AuthGuard requiredRoles={['support', 'analyst', 'admin', 'super_admin']} {...props}>
      {children}
    </AuthGuard>
  );
}