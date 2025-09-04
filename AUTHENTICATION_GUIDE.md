# Guide d'Authentification Wakaa

## Vue d'ensemble

Le système d'authentification de Wakaa est conçu pour gérer de manière sécurisée les marchands, clients et administrateurs avec une gestion d'erreurs claire et des permissions granulaires.

## Architecture

### 1. Middleware d'Authentification (`src/lib/auth-middleware.ts`)

Le middleware central qui gère :
- ✅ Vérification des tokens de session
- ✅ Validation des utilisateurs actifs
- ✅ Gestion des expirations de session
- ✅ Support des rôles multiples (profiles + admin_users)
- ✅ Mise à jour automatique de l'activité

### 2. Gestion d'Erreurs (`src/lib/auth-errors.ts`)

Système centralisé d'erreurs avec :
- ✅ Codes d'erreur standardisés
- ✅ Messages d'erreur localisés en français
- ✅ Logging structuré des erreurs
- ✅ Gestion spécifique par rôle

### 3. Validation (`src/lib/auth-validation.ts`)

Validation robuste des données :
- ✅ Validation des emails et mots de passe
- ✅ Vérification de la force des mots de passe
- ✅ Sanitisation des entrées utilisateur
- ✅ Validation spécifique par rôle

## Rôles et Permissions

### Rôles Utilisateurs (table `profiles`)
- **merchant** : Marchands avec accès à leur dashboard
- **customer** : Clients avec accès limité
- **admin** : Administrateurs avec privilèges étendus

### Rôles Administrateurs (table `admin_users`)
- **super_admin** : Accès complet au système
- **admin** : Gestion des utilisateurs et marchands
- **support** : Support client et assistance
- **analyst** : Analyse et rapports

## Routes API Sécurisées

### Authentification
- `POST /next_api/auth/login` - Connexion avec gestion d'erreurs avancée
- `GET /next_api/auth/me` - Profil utilisateur avec middleware
- `POST /next_api/auth/logout` - Déconnexion sécurisée

### Marchands (Protection par rôle)
- `GET /next_api/merchants` - Liste (Admin/Support uniquement)
- `POST /next_api/merchants` - Création (Admin uniquement)
- `PUT /next_api/merchants` - Modification (Propriétaire ou Admin)
- `DELETE /next_api/merchants` - Désactivation (Admin uniquement)

### Administration (Protection stricte)
- `GET /next_api/admin/users` - Liste des admins (Admin+)
- `POST /next_api/admin/users` - Création (Super Admin uniquement)
- `PUT /next_api/admin/users` - Modification avec permissions granulaires
- `DELETE /next_api/admin/users` - Désactivation avec vérifications

## Composants Frontend

### 1. AuthGuard (`src/components/auth/AuthGuard.tsx`)
Protection des pages avec :
- ✅ Vérification des rôles requis
- ✅ Gestion des états de chargement
- ✅ Messages d'erreur clairs
- ✅ Redirection automatique

### 2. RoleBasedAccess (`src/components/auth/RoleBasedAccess.tsx`)
Contrôle d'accès conditionnel :
- ✅ Affichage conditionnel par rôle
- ✅ Composants spécialisés (MerchantOnly, AdminOnly, etc.)
- ✅ Hook usePermissions pour la logique métier

### 3. LoginForm (`src/components/auth/LoginForm.tsx`)
Formulaire de connexion avec :
- ✅ Validation côté client
- ✅ Gestion d'erreurs utilisateur-friendly
- ✅ États de chargement
- ✅ Feedback visuel

## Sécurité Implémentée

### 1. Gestion des Sessions
- ✅ Tokens de session uniques
- ✅ Expiration automatique
- ✅ Révocation des sessions inactives
- ✅ Tracking de l'activité utilisateur

### 2. Validation des Données
- ✅ Sanitisation des entrées
- ✅ Validation des formats (email, téléphone)
- ✅ Vérification de la force des mots de passe
- ✅ Protection contre l'injection

### 3. Contrôle d'Accès
- ✅ Vérification des rôles à chaque requête
- ✅ Permissions granulaires par ressource
- ✅ Isolation des données par utilisateur
- ✅ Audit des actions sensibles

### 4. Gestion d'Erreurs
- ✅ Messages d'erreur non révélateurs
- ✅ Logging sécurisé des tentatives
- ✅ Rate limiting implicite
- ✅ Gestion des comptes verrouillés

## Utilisation

### Protection d'une Page
```tsx
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function MerchantPage() {
  return (
    <AuthGuard requiredRole="merchant">
      <div>Contenu réservé aux marchands</div>
    </AuthGuard>
  );
}
```

### Affichage Conditionnel
```tsx
import { AdminOnly } from '@/components/auth/RoleBasedAccess';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <AdminOnly>
        <button>Panneau Admin</button>
      </AdminOnly>
    </div>
  );
}
```

### Route API Protégée
```typescript
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(
  async (request, user, session) => {
    // Logique métier avec utilisateur authentifié
    return successResponse(data);
  },
  { requiredRoles: ['merchant', 'admin'] }
);
```

## Tests et Validation

### Scénarios Testés
- ✅ Connexion avec identifiants valides/invalides
- ✅ Gestion des comptes désactivés
- ✅ Expiration des sessions
- ✅ Tentatives d'accès non autorisées
- ✅ Validation des données d'entrée
- ✅ Permissions par rôle

### Gestion d'Erreurs Testée
- ✅ Messages d'erreur appropriés
- ✅ Codes de statut HTTP corrects
- ✅ Logging des erreurs
- ✅ Récupération gracieuse

## Bonnes Pratiques

### 1. Sécurité
- Toujours utiliser HTTPS en production
- Implémenter le rate limiting
- Utiliser bcrypt pour les mots de passe réels
- Configurer les CORS appropriés

### 2. UX
- Messages d'erreur clairs et utiles
- États de chargement visibles
- Redirection automatique appropriée
- Feedback immédiat sur les actions

### 3. Maintenance
- Logging structuré pour le debugging
- Codes d'erreur standardisés
- Documentation des permissions
- Tests automatisés des scénarios critiques

## Améliorations Futures

### Sécurité Avancée
- [ ] Authentification à deux facteurs (2FA)
- [ ] Rate limiting par IP
- [ ] Détection des tentatives de brute force
- [ ] Chiffrement des données sensibles

### Fonctionnalités
- [ ] Connexion sociale (Google, Facebook)
- [ ] Récupération de mot de passe
- [ ] Vérification d'email
- [ ] Sessions multiples par utilisateur

### Monitoring
- [ ] Métriques d'authentification
- [ ] Alertes de sécurité
- [ ] Audit trail complet
- [ ] Dashboard de sécurité

## Conclusion

Le système d'authentification de Wakaa est maintenant robuste avec :
- ✅ Gestion claire des erreurs
- ✅ Permissions granulaires par rôle
- ✅ Sécurité renforcée
- ✅ UX optimisée
- ✅ Code maintenable et extensible

Tous les composants sont prêts pour la production avec une architecture scalable et sécurisée.