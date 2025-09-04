
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState, AuthContext } from '@/hooks/useAuth';
import { ClientOnly } from '@/components/ClientOnly';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState();

  return (
    <ClientOnly fallback={<div>Chargement...</div>}>
      <AuthContext.Provider value={authState}>
        {children}
      </AuthContext.Provider>
    </ClientOnly>
  );
}

// Hook pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
