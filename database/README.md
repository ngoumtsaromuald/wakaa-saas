
# 📊 Documentation de la Base de Données Wakaa

## 🎯 Vue d'Ensemble

La base de données Wakaa est conçue pour supporter une plateforme SaaS complète de gestion des commandes WhatsApp pour micro-entrepreneurs camerounais. Elle intègre la gestion des utilisateurs, commandes, paiements, notifications et analytics en temps réel.

## 🏗️ Architecture de la Base de Données

### Principes de Conception

1. **Sécurité First** : Row Level Security (RLS) activé sur toutes les tables sensibles
2. **Performance** : Index optimisés pour les requêtes fréquentes
3. **Scalabilité** : Structure modulaire permettant l'ajout de nouvelles fonctionnalités
4. **Intégrité** : Contraintes de clés étrangères et validations strictes
5. **Audit** : Traçabilité complète des actions utilisateurs

### Schéma Relationnel

```
profiles (utilisateurs) 
    ↓
merchants (entreprises)
    ↓
├── customers (clients)
├── products (catalogue)
├── orders (commandes) → order_items (détails)
├── payments (paiements)
├── subscriptions (abonnements)
├── notifications (communications)
└── merchant_settings (configuration)
```

## 📋 Description des Tables

### 🔐 Tables d'Authentification et Utilisateurs

#### `profiles`
**Rôle** : Table centrale pour tous les utilisateurs de la plateforme
- **Utilisateurs** : Marchands, clients, administrateurs
- **Authentification** : Email/mot de passe avec 2FA optionnel
- **Profils** : Informations personnelles et préférences

#### `admin_users`
**Rôle** : Utilisateurs administrateurs de la plateforme
- **Permissions** : Gestion granulaire des droits d'accès
- **Rôles** : super_admin, admin, support, analyst

#### `user_sessions`
**Rôle** : Gestion des sessions d'authentification
- **Sécurité** : Tokens uniques avec expiration
- **Traçabilité** : IP, user-agent, device info

### 🏢 Tables Business

#### `merchants`
**Rôle** : Informations des entreprises utilisant Wakaa
- **Business** : Nom, WhatsApp, localisation
- **Abonnement** : Plan actuel et statut
- **Configuration** : Paramètres business personnalisés

#### `subscription_plans`
**Rôle** : Définition des plans d'abonnement
- **Monétisation** : Prix, limites, fonctionnalités
- **Flexibilité** : Cycles mensuels/annuels

#### `subscriptions`
**Rôle** : Abonnements actifs des marchands
- **Facturation** : Dates, montants, renouvellement
- **Limites** : Suivi de l'utilisation vs limites

### 👥 Tables CRM

#### `customers`
**Rôle** : Base de données clients pour chaque marchand
- **Contact** : Téléphone (obligatoire), email, adresse
- **Statistiques** : Commandes, dépenses, dernière activité
- **Segmentation** : Notes et historique pour marketing

### 🛍️ Tables E-commerce

#### `products`
**Rôle** : Catalogue de produits par marchand
- **Inventaire** : Stock, prix, catégories
- **Média** : Images, descriptions
- **Logistique** : Poids, dimensions, SKU

#### `orders`
**Rôle** : Commandes passées par les clients
- **Workflow** : Statuts de commande et paiement
- **Traçabilité** : Source (WhatsApp, web, API)
- **Logistique** : Adresse livraison, tracking

#### `order_items`
**Rôle** : Détail des articles dans chaque commande
- **Granularité** : Quantité, prix unitaire, total
- **Analytics** : Données pour rapports produits

### 💳 Tables Paiements

#### `payments`
**Rôle** : Transactions de paiement
- **Intégrations** : CinetPay, MTN MoMo, Orange Money
- **Statuts** : Pending, processing, completed, failed
- **Webhooks** : Données de callback des providers

#### `payment_methods`
**Rôle** : Configuration des méthodes de paiement
- **Flexibilité** : Activation/désactivation par marchand
- **Configuration** : Clés API, frais, devises

### 📢 Tables Communication

#### `notifications`
**Rôle** : Système de notifications multi-canal
- **Canaux** : WhatsApp, SMS, Email, Push, In-app
- **Types** : Commande, paiement, livraison, système
- **Statuts** : Pending, sent, delivered, failed

### 🔧 Tables Configuration

#### `merchant_settings`
**Rôle** : Paramètres personnalisés par marchand
- **Business** : Horaires, messages automatiques
- **Templates** : Confirmation, rappels, notifications
- **Tarification** : Taxes, frais de livraison

#### `api_keys`
**Rôle** : Clés API pour intégrations tierces
- **Sécurité** : Hash des clés, permissions granulaires
- **Monitoring** : Usage, rate limiting

### 📊 Tables Analytics et Audit

#### `analytics_events`
**Rôle** : Collecte d'événements pour business intelligence
- **Événements** : Page views, commandes, paiements
- **Contexte** : Session, IP, user-agent, referrer

#### `audit_logs`
**Rôle** : Journalisation des actions utilisateurs
- **Conformité** : Traçabilité complète des modifications
- **Sécurité** : Détection d'activités suspectes

#### `webhooks_log`
**Rôle** : Logs des webhooks reçus
- **Debugging** : Payload, headers, signatures
- **Monitoring** : Statuts de traitement

### 🎯 Tables Fonctionnalités Avancées

#### `qr_codes`
**Rôle** : Génération et gestion des QR codes
- **Types** : Commandes, produits, catalogue, contact
- **Analytics** : Scans, dernière utilisation

#### `support_tickets`
**Rôle** : Système de support client
- **Workflow** : Ouvert → En cours → Résolu → Fermé
- **Priorisation** : Low, medium, high, urgent

#### `affiliate_programs` & `affiliate_referrals`
**Rôle** : Programme d'affiliation
- **Acquisition** : Codes de parrainage
- **Commissions** : Calcul et paiement automatiques

## 🔒 Sécurité et Permissions

### Row Level Security (RLS)

Toutes les tables sensibles ont RLS activé avec des politiques strictes :

```sql
-- Exemple : Les marchands ne voient que leurs propres données
CREATE POLICY merchant_own_data ON customers FOR ALL USING (
  merchant_id IN (
    SELECT id FROM merchants WHERE email = current_setting('app.current_user_email', true)
  )
);
```

### Isolation des Données

- **Multi-tenant** : Chaque marchand ne peut accéder qu'à ses propres données
- **Validation** : Contraintes CHECK sur les énums et valeurs critiques
- **Chiffrement** : Mots de passe hashés, tokens sécurisés

## 📈 Optimisations Performance

### Index Stratégiques

- **Requêtes fréquentes** : merchant_id, status, dates
- **Recherche** : email, phone_number, order_number
- **Analytics** : create_time, event_type

### Triggers Automatiques

- **modify_time** : Mise à jour automatique des timestamps
- **customer_stats** : Calcul automatique des statistiques clients
- **audit_trail** : Journalisation automatique des modifications

## 🚀 Migration et Déploiement

### Prérequis

1. **PostgreSQL 13+** avec extensions activées
2. **Supabase** ou instance PostgreSQL compatible
3. **Permissions** : CREATE, ALTER, INSERT sur la base

### Étapes de Migration

1. **Backup** : Sauvegarder la base existante si applicable
2. **Exécution** : Lancer le script `migration.sql`
3. **Vérification** : Contrôler les tables, index et données
4. **Configuration** : Mettre à jour les variables d'environnement

### Variables d'Environnement Requises

```env
POSTGREST_URL=https://your-project.supabase.co/rest/v1
POSTGREST_SCHEMA=public
POSTGREST_API_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📊 Données de Test Incluses

La migration inclut des données de test réalistes :

- **1 Marchand** : Boutique Mode Marie (Yaoundé)
- **3 Clients** : Avec historique de commandes
- **3 Produits** : Mode africaine avec images
- **2 Commandes** : Une livrée, une en cours
- **1 Paiement** : Transaction CinetPay complétée

## 🔄 Workflow des Données

### Cycle de Vie d'une Commande

1. **Réception WhatsApp** → `webhooks_log`
2. **Parsing automatique** → `orders` + `order_items`
3. **Notification client** → `notifications`
4. **Génération paiement** → `payments`
5. **Webhook paiement** → Mise à jour statuts
6. **Livraison** → Notification finale

### Intégrations Externes

- **WhatsApp Business API** : Webhooks bidirectionnels
- **CinetPay** : Paiements mobiles sécurisés
- **Analytics** : Collecte d'événements temps réel

## 🛠️ Maintenance et Monitoring

### Tâches Automatiques Recommandées

1. **Nettoyage sessions** : Supprimer les sessions expirées
2. **Archive logs** : Archiver les anciens webhooks/audit logs
3. **Stats refresh** : Recalculer les statistiques clients
4. **Backup** : Sauvegarde quotidienne automatique

### Monitoring Clés

- **Performance** : Temps de réponse des requêtes
- **Intégrité** : Vérification des contraintes
- **Sécurité** : Tentatives d'accès non autorisées
- **Capacité** : Utilisation vs limites d'abonnement

## 📞 Support

Pour toute question sur la base de données :
- **Documentation** : Consultez ce README
- **Issues** : Créer un ticket de support
- **Contact** : admin@wakaa.io

---

**Version** : 1.0  
**Dernière mise à jour** : 2024  
**Compatibilité** : PostgreSQL 13+, Supabase
