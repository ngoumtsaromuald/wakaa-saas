# 🗄️ Configuration Base de Données Wakaa

Ce guide explique comment configurer PostgreSQL local pour l'application Wakaa.

## 📋 Prérequis

- PostgreSQL 17 installé (✅ Déjà installé)
- PowerShell
- Accès administrateur Windows

## 🚀 Configuration Rapide

### 1. Démarrer PostgreSQL

**Option A: PowerShell Administrateur**
```powershell
# Ouvrir PowerShell en tant qu'administrateur
Start-Service postgresql-x64-17
```

**Option B: Services Windows**
1. `Win + R` → `services.msc`
2. Trouver "postgresql-x64-17"
3. Clic droit → Démarrer

**Option C: Menu Démarrer**
1. Chercher "PostgreSQL" 
2. Lancer "Start PostgreSQL Server"

### 2. Configurer la Base de Données

```powershell
# Dans le répertoire du projet Wakaa
.\scripts\setup-database.ps1
```

Cette commande va :
- ✅ Créer la base de données `wakaa`
- ✅ Exécuter toutes les migrations
- ✅ Insérer les données de test
- ✅ Configurer les index et triggers

### 3. Vérifier l'Installation

```powershell
.\scripts\test-connection.ps1
```

## 🔧 Commandes Utiles

### Configuration Complète
```powershell
# Configuration complète (défaut)
.\scripts\setup-database.ps1 -Action setup

# Avec mot de passe personnalisé
.\scripts\setup-database.ps1 -Action setup -Password monmotdepasse
```

### Gestion de la Base de Données
```powershell
# Réinitialiser la base de données
.\scripts\setup-database.ps1 -Action reset

# Exécuter uniquement les migrations
.\scripts\setup-database.ps1 -Action migrate

# Insérer uniquement les données de test
.\scripts\setup-database.ps1 -Action seed

# Vérifier le statut
.\scripts\setup-database.ps1 -Action status
```

## 📊 Informations de Connexion

Une fois configuré, voici les informations de connexion :

```
Host: localhost
Port: 5432
Database: wakaa
Username: postgres
Password: postgres (par défaut)
```

**URL de connexion complète :**
```
postgresql://postgres:postgres@localhost:5432/wakaa
```

## 🏗️ Structure de la Base de Données

### Tables Principales
- `profiles` - Utilisateurs et authentification
- `merchants` - Marchands/Entreprises
- `customers` - Clients
- `products` - Catalogue produits
- `orders` - Commandes
- `order_items` - Articles de commande
- `payments` - Paiements
- `notifications` - Notifications
- `webhooks_log` - Logs des webhooks
- `subscriptions` - Abonnements
- `merchant_settings` - Paramètres marchands

### Données de Test Incluses
- 3 profils utilisateurs (admin + 2 marchands)
- 2 marchands avec boutiques configurées
- 4 clients de test
- 6 produits variés
- 4 commandes avec différents statuts
- Paiements et notifications de test

## 🔍 Vérification Manuelle

Si tu veux vérifier manuellement la base de données :

```powershell
# Se connecter à PostgreSQL
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d wakaa

# Dans psql, lister les tables
\dt

# Compter les enregistrements
SELECT 'merchants' as table_name, COUNT(*) as count FROM merchants
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

# Quitter psql
\q
```

## ⚠️ Dépannage

### Service PostgreSQL ne démarre pas
```powershell
# Vérifier le statut
Get-Service postgresql-x64-17

# Redémarrer le service (en tant qu'admin)
Restart-Service postgresql-x64-17
```

### Erreur d'authentification
1. Vérifier que le service est démarré
2. Essayer avec un mot de passe différent :
   ```powershell
   .\scripts\setup-database.ps1 -Password votre_mot_de_passe
   ```

### Port 5432 occupé
```powershell
# Vérifier quel processus utilise le port
netstat -ano | findstr :5432
```

### Réinitialisation complète
```powershell
# Arrêter le service
Stop-Service postgresql-x64-17

# Redémarrer le service
Start-Service postgresql-x64-17

# Reconfigurer
.\scripts\setup-database.ps1 -Action reset
.\scripts\setup-database.ps1 -Action setup
```

## 🔗 Fichiers de Configuration

- `.env.local` - Variables d'environnement locales
- `database/migration.sql` - Structure de la base de données
- `database/seed.sql` - Données de test
- `scripts/setup-database.ps1` - Script de configuration
- `scripts/test-connection.ps1` - Test de connexion

## 📝 Notes Importantes

1. **Sécurité** : Change le mot de passe par défaut en production
2. **Sauvegarde** : Sauvegarde régulièrement tes données
3. **Performance** : Les index sont optimisés pour les requêtes fréquentes
4. **Développement** : Les données de test sont parfaites pour le développement

## 🎯 Base de Données Configurée avec Succès !

✅ **Configuration terminée** - Ta base de données PostgreSQL est maintenant prête !

### 📊 Résumé de l'Installation

- **Base de données** : `wakaa`
- **Tables créées** : 25 tables
- **Contraintes** : 28 clés étrangères
- **Index** : Optimisés pour les performances
- **Données de test** : Complètes et réalistes

### 🔗 Informations de Connexion

```
Host: localhost
Port: 5432
Database: wakaa
Username: postgres
Password: Romuald12
URL: postgresql://postgres:Romuald12@localhost:5432/wakaa
```

### 👥 Comptes de Test Disponibles

| Email | Rôle | Mot de passe | Description |
|-------|------|--------------|-------------|
| `admin@wakaa.cm` | Admin | `$2b$12$...` | Administrateur système |
| `merchant1@wakaa.cm` | Merchant | `$2b$12$...` | Boutique Jean (Douala) |
| `merchant2@wakaa.cm` | Merchant | `$2b$12$...` | Marie Fashion (Yaoundé) |

### 🛍️ Données de Test Incluses

- **2 boutiques** configurées avec abonnements
- **6 produits** variés (vêtements, chaussures, accessoires)
- **4 clients** avec historique d'achats
- **4 commandes** avec différents statuts
- **4 paiements** (CinetPay, Mobile Money, Cash)
- **3 notifications** WhatsApp
- **Paramètres marchands** configurés

### 🧪 Tests Disponibles

```powershell
# Test complet de la base de données
.\scripts\test-database.ps1

# Test de connexion simple
.\scripts\test-connection.ps1

# Vérifier le statut
.\scripts\setup-database.ps1 -Action status
```

## 🎯 Prochaines Étapes

Maintenant que la base de données est configurée :

1. ✅ **Base de données PostgreSQL** - Terminé !
2. 🔄 **Configurer l'application Next.js**
3. 🔄 **Créer les API endpoints**
4. 🔄 **Implémenter l'authentification**
5. 🔄 **Intégrer WhatsApp Business API**
6. 🔄 **Configurer CinetPay pour les paiements**

### 📝 Commandes Utiles pour la Suite

```bash
# Démarrer le serveur de développement Next.js
npm run dev

# Générer les types TypeScript depuis la DB
npx supabase gen types typescript --local > types/database.types.ts

# Tester les connexions API
curl http://localhost:3000/api/health
```

---

**🎉 Félicitations !** Ta base de données Wakaa est maintenant opérationnelle et prête pour le développement de l'application.