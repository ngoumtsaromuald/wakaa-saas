# 🚀 Wakaa SaaS Platform

Une plateforme SaaS complète pour la gestion d'e-commerce avec authentification, gestion des abonnements et tableau de bord analytique.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fonctionnalités

- 🔐 **Authentification complète** : Inscription, connexion, gestion des rôles (Admin, Merchant, User)
- 💳 **Gestion des abonnements** : Plans tarifaires flexibles avec limites d'utilisation
- 📊 **Tableau de bord analytique** : Statistiques en temps réel avec graphiques interactifs
- 🛒 **Gestion e-commerce** : Produits, commandes, clients, paiements
- 💬 **Intégration WhatsApp** : Gestion des messages et templates automatisés
- 🎨 **Interface moderne** : Design responsive avec Tailwind CSS et shadcn/ui
- 🔒 **Sécurité avancée** : Middleware de protection, validation des données
- 📱 **Responsive Design** : Compatible mobile, tablette et desktop

## 🛠️ Technologies

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI avec les dernières fonctionnalités
- **TypeScript** - Typage statique pour une meilleure robustesse
- **Tailwind CSS** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI modernes et accessibles
- **Lucide React** - Icônes SVG optimisées
- **Recharts** - Graphiques et visualisations de données

### Backend
- **Next.js API Routes** - API RESTful intégrée
- **PostgREST** - API REST automatique pour PostgreSQL
- **PostgreSQL** - Base de données relationnelle robuste
- **JWT** - Authentification par tokens sécurisés

### Outils de développement
- **ESLint** - Linting du code
- **Prettier** - Formatage automatique
- **TypeScript** - Vérification de types
- **Git** - Contrôle de version

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+ 
- PostgreSQL 13+
- npm ou yarn

### 1. Cloner le repository
```bash
git clone https://github.com/ngoumtsaromuald/wakaa-saas.git
cd wakaa-saas
```

### 2. Installer les dépendances
```bash
npm install --legacy-peer-deps
```

### 3. Configuration de l'environnement
```bash
cp .env.example .env.local
```

Configurez les variables dans `.env.local` :
```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/wakaa"
POSTGREST_URL="http://localhost:3001"
POSTGREST_API_KEY="your-api-key"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Configuration de la base de données

#### Option A : Utilisation des scripts automatisés
```bash
# Windows PowerShell
.\scripts\setup-database.ps1
.\scripts\setup-postgrest.ps1
```

#### Option B : Configuration manuelle
1. Créez la base de données PostgreSQL
2. Exécutez les migrations depuis `database/migration.sql`
3. Configurez PostgREST avec `postgrest/wakaa.conf`

### 5. Lancer l'application
```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du projet

```
wakaa-saas/
├── src/
│   ├── app/                    # Pages Next.js App Router
│   │   ├── auth/              # Pages d'authentification
│   │   ├── dashboard/         # Tableau de bord
│   │   ├── next_api/          # API Routes
│   │   └── globals.css        # Styles globaux
│   ├── components/            # Composants React
│   │   ├── auth/              # Composants d'authentification
│   │   ├── dashboard/         # Composants du tableau de bord
│   │   ├── ui/                # Composants UI (shadcn/ui)
│   │   └── landing/           # Page d'accueil
│   ├── hooks/                 # Hooks personnalisés
│   ├── lib/                   # Utilitaires et services
│   └── middleware.ts          # Middleware Next.js
├── database/                  # Scripts SQL
├── scripts/                   # Scripts d'automatisation
├── postgrest/                 # Configuration PostgREST
└── public/                    # Assets statiques
```

## 🔐 Authentification et autorisation

### Rôles utilisateur
- **Admin** : Accès complet à toutes les fonctionnalités
- **Merchant** : Gestion de son commerce et données
- **User** : Accès limité aux fonctionnalités de base

### Système d'abonnements
- **Free** : Fonctionnalités de base limitées
- **Pro** : Fonctionnalités avancées
- **Enterprise** : Accès complet sans limites

## 🧪 Tests et développement

### Lancer les tests
```bash
npm test
```

### Linting et formatage
```bash
npm run lint
npm run lint:fix
```

### Build de production
```bash
npm run build
```

## 📊 Fonctionnalités principales

### Dashboard Analytics
- Statistiques de ventes en temps réel
- Graphiques interactifs (revenus, commandes, clients)
- Métriques de performance
- Rapports exportables

### Gestion E-commerce
- Catalogue produits avec images
- Gestion des stocks
- Traitement des commandes
- Suivi des paiements
- Gestion clientèle

### Intégration WhatsApp
- Envoi de messages automatisés
- Templates personnalisables
- Historique des conversations
- Notifications en temps réel

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guidelines de contribution
- Suivez les conventions de code existantes
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Vérifiez que tous les tests passent

## 📝 Changelog

### Version 1.0.0 (2025-09-04)
- ✨ Version initiale avec authentification complète
- ✨ Système de gestion des abonnements
- ✨ Tableau de bord analytique
- ✨ Gestion e-commerce de base
- ✨ Intégration WhatsApp
- ✨ Interface responsive moderne

## 🐛 Signaler des bugs

Si vous trouvez un bug, veuillez ouvrir une [issue](https://github.com/ngoumtsaromuald/wakaa-saas/issues) avec :
- Description détaillée du problème
- Étapes pour reproduire
- Environnement (OS, navigateur, version Node.js)
- Screenshots si applicable

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développeur Principal** : [@ngoumtsaromuald](https://github.com/ngoumtsaromuald)

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) pour le framework
- [shadcn/ui](https://ui.shadcn.com/) pour les composants UI
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [PostgREST](https://postgrest.org/) pour l'API automatique

---

⭐ N'hésitez pas à donner une étoile si ce projet vous a aidé !