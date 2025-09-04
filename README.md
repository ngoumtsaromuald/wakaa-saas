
# 🚀 Wakaa - Plateforme SaaS pour Micro-Entrepreneurs

**Transformez la gestion chaotique des commandes WhatsApp en un système structuré et automatisé**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/wakaa/wakaa)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/wakaa/wakaa/actions)

## 🎯 À Propos

Wakaa est une plateforme SaaS spécialement conçue pour les micro-entrepreneurs camerounais qui gèrent leurs commandes via WhatsApp. Notre solution transforme le chaos des messages WhatsApp en un système de gestion structuré avec paiements mobiles intégrés.

### 🌟 Problème Résolu

Les micro-entrepreneurs au Cameroun font face à :
- 📱 Gestion manuelle et chaotique des commandes WhatsApp
- 💸 Difficultés de suivi des paiements mobiles
- 📊 Absence de données pour optimiser leur business
- ⏰ Perte de temps sur des tâches répétitives

### ✨ Notre Solution

Wakaa automatise et structure :
- 🤖 **Réception automatique** des commandes WhatsApp
- 💳 **Paiements mobiles** intégrés (MTN MoMo, Orange Money)
- 📈 **Analytics en temps réel** pour optimiser les ventes
- 👥 **CRM intégré** pour fidéliser les clients

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ et pnpm
- Base de données PostgreSQL (Supabase recommandé)
- Compte WhatsApp Business API
- Compte CinetPay pour les paiements

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/wakaa/wakaa.git
cd wakaa
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env.local
# Remplir les variables d'environnement
```

4. **Migrer la base de données**
```bash
# Exécuter le fichier database/migration.sql sur votre instance PostgreSQL
psql -d your_database -f database/migration.sql
```

5. **Lancer l'application**
```bash
pnpm dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📊 État du Projet

Consultez le [**RAPPORT DE PROJET DÉTAILLÉ**](PROJECT_REPORT.md) pour :
- ✅ Fonctionnalités complètement implémentées
- 🟡 Fonctionnalités partielles
- 🔴 Fonctionnalités restantes
- 📈 Progression détaillée par module

### Résumé Rapide
- **Architecture** : 95% ✅
- **Base de Données** : 100% ✅
- **Authentification** : 90% ✅
- **Interface** : 85% ✅
- **API Backend** : 80% 🟡
- **Intégrations** : 60% 🟡

## 🏗️ Architecture Technique

### Stack Technologique

- **Frontend** : Next.js 15, React 19, TypeScript
- **UI/UX** : Tailwind CSS, Shadcn/UI, Framer Motion
- **Base de Données** : PostgreSQL avec Supabase
- **Authentification** : JWT avec Row Level Security
- **Paiements** : CinetPay API
- **Messaging** : WhatsApp Business API

### Structure du Projet

```
src/
├── app/                    # Pages et API routes Next.js
│   ├── auth/              # Pages d'authentification
│   ├── dashboard/         # Interface dashboard
│   └── next_api/          # API routes backend
├── components/            # Composants React
│   ├── ui/               # Composants UI Shadcn
│   ├── auth/             # Composants d'authentification
│   ├── dashboard/        # Composants dashboard
│   └── landing/          # Page d'accueil
├── hooks/                # Hooks React personnalisés
├── lib/                  # Utilitaires et configuration
└── database/             # Migration et documentation DB
```

## 🔧 Configuration

### Variables d'Environnement

Copiez `.env.example` vers `.env.local` et configurez :

```env
# Base de données
POSTGREST_URL=https://your-project.supabase.co/rest/v1
POSTGREST_API_KEY=your-supabase-anon-key

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# CinetPay
CINETPAY_API_KEY=your-cinetpay-key
CINETPAY_SITE_ID=your-site-id
```

### Base de Données

1. **Créer un projet Supabase** ou configurer PostgreSQL
2. **Exécuter la migration** : `database/migration.sql`
3. **Vérifier les données** : Tables et données de test créées
4. **Configurer RLS** : Politiques de sécurité activées

## 📱 Fonctionnalités Principales

### 🤖 Automatisation WhatsApp
- Réception automatique des commandes
- Parser intelligent des messages
- Réponses automatiques configurables
- Templates de messages prédéfinis

### 💳 Paiements Mobiles
- Intégration CinetPay complète
- Support MTN MoMo et Orange Money
- Liens de paiement sécurisés
- Webhooks de confirmation

### 📊 Analytics et Rapports
- Dashboard en temps réel
- KPI business essentiels
- Graphiques interactifs
- Rapports exportables

### 👥 Gestion Clients (CRM)
- Base de données clients complète
- Historique des commandes
- Segmentation automatique
- Communication multi-canal

## 🧪 Tests

### Tests Disponibles
```bash
# Tests unitaires
pnpm test

# Tests d'intégration
pnpm test:integration

# Tests end-to-end
pnpm test:e2e
```

### Couverture Actuelle
- **Tests unitaires** : 30% 🔴
- **Tests d'intégration** : 20% 🔴
- **Tests E2E** : 10% 🔴

*Note : Les tests sont en cours d'implémentation*

## 🚀 Déploiement

### Déploiement Vercel (Recommandé)

1. **Connecter le repository** à Vercel
2. **Configurer les variables** d'environnement
3. **Déployer** automatiquement

### Déploiement Manuel

```bash
# Build de production
pnpm build

# Démarrer en production
pnpm start
```

## 📚 Documentation

- [**Rapport de Projet**](PROJECT_REPORT.md) - État d'avancement détaillé
- [**Documentation DB**](database/README.md) - Architecture base de données
- [**Guide API**](docs/API.md) - Documentation des endpoints
- [**Guide Utilisateur**](docs/USER_GUIDE.md) - Manuel d'utilisation

## 🤝 Contribution

### Comment Contribuer

1. **Fork** le repository
2. **Créer une branche** feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir une Pull Request**

### Standards de Code

- **TypeScript** strict activé
- **ESLint** et **Prettier** configurés
- **Commits conventionnels** requis
- **Tests** obligatoires pour nouvelles fonctionnalités

## 🐛 Signaler un Bug

Utilisez les [**GitHub Issues**](https://github.com/wakaa/wakaa/issues) avec :
- Description détaillée du problème
- Étapes pour reproduire
- Environnement (OS, navigateur, version)
- Screenshots si applicable

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Shadcn/UI** pour les composants UI
- **Supabase** pour la base de données
- **CinetPay** pour les paiements mobiles
- **WhatsApp Business** pour l'API messaging

## 📞 Contact

- **Email** : contact@wakaa.io
- **WhatsApp** : +237 6XX XXX XXX
- **Site Web** : https://wakaa.io
- **Support** : support@wakaa.io

---

**Fait avec ❤️ pour les micro-entrepreneurs camerounais**

*Wakaa - Transformez votre business WhatsApp en entreprise structurée*
