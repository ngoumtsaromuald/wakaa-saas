# 🧪 Guide de Test - Application Wakaa

## ✅ Configuration Terminée !

Ton application Wakaa est maintenant **complètement configurée** et prête pour les tests !

## 🚀 Démarrage de l'Application

### 1. Démarrer PostgREST (Terminal 1)
```powershell
cd postgrest
.\start-postgrest.ps1
```

### 2. Démarrer l'Application Next.js (Terminal 2)
```powershell
npm run dev
```

**Ou utiliser le script automatique :**
```powershell
.\scripts\start-wakaa.ps1
```

## 🔗 URLs de l'Application

| Service | URL | Description |
|---------|-----|-------------|
| **Application Wakaa** | http://localhost:3000 | Interface principale |
| **Page de Connexion** | http://localhost:3000/auth/login | Authentification |
| **Dashboard** | http://localhost:3000/dashboard | Tableau de bord |
| **API PostgREST** | http://localhost:3001 | API REST automatique |
| **Documentation API** | http://localhost:3001/ | Swagger/OpenAPI |

## 👥 Comptes de Test

### 🔑 Comptes d'Authentification

| **Email** | **Mot de passe** | **Rôle** | **Description** |
|-----------|------------------|----------|-----------------|
| `admin@wakaa.cm` | `admin123` | **Admin** | Administrateur système |
| `merchant1@wakaa.cm` | `merchant123` | **Marchand** | Boutique Jean (Douala) |
| `merchant2@wakaa.cm` | `marie123` | **Marchand** | Marie Fashion (Yaoundé) |

### 🛍️ Détails des Boutiques

#### **Boutique Jean** (merchant1@wakaa.cm)
- **Plan** : Standard (5,000 FCFA/mois)
- **Ville** : Douala
- **WhatsApp** : +237670123456
- **Produits** : 3 produits (T-shirts, Jeans, Sneakers)
- **Clients** : 2 clients
- **Commandes** : 2 commandes

#### **Marie Fashion** (merchant2@wakaa.cm)
- **Plan** : Premium (10,000 FCFA/mois)
- **Ville** : Yaoundé
- **WhatsApp** : +237680234567
- **Produits** : 3 produits (Robes, Sacs, Bijoux)
- **Clients** : 2 clients
- **Commandes** : 2 commandes

## 🧪 Scénarios de Test

### 1. **Test de Connexion**
1. Va sur http://localhost:3000/auth/login
2. Utilise : `merchant1@wakaa.cm` / `merchant123`
3. Tu devrais être redirigé vers le dashboard

### 2. **Test du Dashboard Marchand**
- **Tableau de bord** : Vue d'ensemble des ventes
- **Produits** : Gestion du catalogue
- **Commandes** : Suivi des commandes
- **Clients** : Base de données clients
- **Paiements** : Historique des transactions
- **Analytics** : Statistiques de vente

### 3. **Test des Fonctionnalités**
- ✅ Créer/modifier des produits
- ✅ Gérer les commandes
- ✅ Voir les clients
- ✅ Consulter les paiements
- ✅ Paramètres de la boutique

### 4. **Test Admin**
1. Connecte-toi avec : `admin@wakaa.cm` / `admin123`
2. Accès aux fonctions d'administration
3. Gestion des marchands et utilisateurs

## 📊 Données de Test Disponibles

### Produits (6 total)
- **Boutique Jean** : T-shirt (15k), Jean (25k), Sneakers (45k)
- **Marie Fashion** : Robe (35k), Sac (28k), Bijoux (12k)

### Commandes (4 total)
- **WK-2025-001** : Livrée, Payée (15,000 FCFA)
- **WK-2025-002** : En attente (25,000 FCFA)
- **WK-2025-003** : Expédiée, Payée (35,000 FCFA)
- **WK-2025-004** : En traitement, Payée (28,000 FCFA)

### Clients (4 total)
- 2 clients pour chaque boutique avec historique d'achats

## 🔧 Tests Techniques

### API REST (PostgREST)
```bash
# Tester l'API directement
curl http://localhost:3001/merchants
curl http://localhost:3001/products
curl http://localhost:3001/orders
```

### Base de Données
```powershell
# Vérifier la base de données
.\scripts\test-database.ps1

# Voir les données
.\scripts\setup-database.ps1 -Action status
```

## 🛠️ Dépannage

### PostgREST ne démarre pas
```powershell
# Vérifier PostgreSQL
Get-Service postgresql-x64-17

# Redémarrer si nécessaire
Start-Service postgresql-x64-17
```

### Application Next.js ne démarre pas
```powershell
# Réinstaller les dépendances
npm install --legacy-peer-deps

# Vérifier les variables d'environnement
cat .env.local
```

### Problème de connexion
```powershell
# Recréer les comptes de test
.\scripts\create-test-accounts.ps1

# Tester la stack complète
.\scripts\test-full-stack.ps1
```

## 📱 Fonctionnalités à Tester

### 🛍️ Gestion E-commerce
- [x] Catalogue produits
- [x] Gestion des commandes
- [x] Suivi des paiements
- [x] Base de données clients

### 📊 Analytics & Reporting
- [x] Statistiques de vente
- [x] Rapports de performance
- [x] Suivi des revenus

### 💬 WhatsApp Integration
- [x] Configuration WhatsApp Business
- [x] Gestion des messages
- [x] Notifications automatiques

### 💳 Paiements
- [x] Intégration CinetPay
- [x] Mobile Money (MTN, Orange)
- [x] Suivi des transactions

### ⚙️ Administration
- [x] Gestion des utilisateurs
- [x] Configuration des boutiques
- [x] Paramètres système

## 🎯 Recommandations de Test

### **Pour débuter :**
1. **Connecte-toi** avec `merchant1@wakaa.cm` / `merchant123`
2. **Explore le dashboard** pour voir les données
3. **Teste la gestion des produits** (ajouter/modifier)
4. **Simule une commande** pour voir le workflow

### **Pour tester les fonctionnalités avancées :**
1. **Utilise le compte Premium** : `merchant2@wakaa.cm` / `marie123`
2. **Teste les analytics** avancées
3. **Configure les paramètres** WhatsApp
4. **Explore les rapports** détaillés

### **Pour l'administration :**
1. **Connecte-toi en admin** : `admin@wakaa.cm` / `admin123`
2. **Gère les marchands** et leurs abonnements
3. **Consulte les logs** système
4. **Configure les paramètres** globaux

---

## 🎉 Prêt pour les Tests !

Ton application Wakaa est maintenant **100% opérationnelle** avec :
- ✅ Base de données PostgreSQL configurée
- ✅ API PostgREST fonctionnelle
- ✅ Application Next.js prête
- ✅ Comptes de test créés
- ✅ Données réalistes chargées

**Commence par te connecter et explorer l'interface !** 🚀