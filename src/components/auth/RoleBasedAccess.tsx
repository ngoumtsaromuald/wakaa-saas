"use client";

import { useAuth } from '@/components/providers/AuthProvider';
import { ReactNode } from 'react';

interface RoleBasedAccessProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  requireAll?: boolean; // Si true, l'utilisateur doit avoir TOUS les rôles
}

export function RoleBasedAccess({ 
  children, 
  allowedRoles, 
  fallback = null,
  requireAll = false 
}: RoleBasedAccessProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => user.role === role)
    : allowedRoles.includes(user.role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Composants spécialisés pour différents rôles
export function MerchantOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['merchant']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['admin', 'super_admin']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['super_admin']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function SupportOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['support', 'analyst', 'admin', 'super_admin']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function CustomerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['customer']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

// Hook pour vérifier les permissions
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return user ? roles.every(role => user.role === role) : false;
  };

  const isMerchant = (): boolean => hasRole('merchant');
  const isAdmin = (): boolean => hasAnyRole(['admin', 'super_admin']);
  const isSuperAdmin = (): boolean => hasRole('super_admin');
  const isSupport = (): boolean => hasAnyRole(['support', 'analyst', 'admin', 'super_admin']);
  const isCustomer = (): boolean => hasRole('customer');

  return {
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isMerchant,
    isAdmin,
    isSuperAdmin,
    isSupport,
    isCustomer
  };
}