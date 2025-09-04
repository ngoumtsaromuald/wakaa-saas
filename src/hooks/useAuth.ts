
"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { api, ApiError } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'merchant' | 'customer' | 'admin';
  avatar_url?: string;
  phone_number?: string;
  is_active: boolean;
  email_verified: boolean;
  preferences?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth().catch((err) => {
      console.error('Erreur lors de la vérification auth:', err);
      
      // Ne pas afficher d'erreur pour les problèmes d'authentification normaux
      const isAuthError = err.message && (
        err.message.includes('401') || 
        err.message.includes('403') || 
        err.message.includes('Session') ||
        err.message.includes('Token') ||
        err.message.includes('Compte désactivé')
      );
      
      if (!isAuthError) {
        setError(err.message || 'Erreur de vérification d\'authentification');
      }
      setLoading(false);
    });
  }, []);

  const checkAuth = async () => {
    try {
      setError(null);
      
      // Vérifier qu'on est côté client
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Vérifier le token avec l'API réelle
      const userData = await api.get<User>('/auth/me');
      setUser(userData);
    } catch (error) {
      console.warn('Vérification auth échouée (normal si non connecté):', error);
      
      // Nettoyer les tokens invalides
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      
      setUser(null);
      
      // Seulement définir l'erreur pour les vraies erreurs système
      if (error instanceof Error && 
          !error.message.includes('401') && 
          !error.message.includes('403') && 
          !error.message.includes('Session') &&
          !error.message.includes('Token') &&
          !error.message.includes('invalide') &&
          !error.message.includes('expirée')) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      const response = await api.post<{ user: User; token: string }>('/auth/login', {
        email,
        password
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
      setUser(response.user);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      if (error instanceof ApiError) {
        // Gestion des erreurs spécifiques d'authentification
        if (error.status === 401) {
          throw new Error('Email ou mot de passe incorrect');
        } else if (error.status === 403) {
          throw new Error('Compte désactivé ou suspendu');
        } else if (error.status === 423) {
          throw new Error('Compte verrouillé suite à trop de tentatives');
        } else {
          throw new Error(error.message || 'Erreur de connexion');
        }
      }
      throw new Error('Erreur de connexion au serveur');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post<{ user: User; token: string }>('/profiles', userData);

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
      setUser(response.user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Erreur d\'inscription');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const updatedUser = await api.put<User>(`/profiles/${user.id}`, data);
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Erreur de mise à jour du profil');
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const userData = await api.get<User>(`/profiles/${user.id}`);
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Erreur de rafraîchissement utilisateur:', error);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  };
}

export { AuthContext };
