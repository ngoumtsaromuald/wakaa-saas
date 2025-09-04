
-- =====================================================
-- WAKAA - MIGRATION COMPLÈTE DE LA BASE DE DONNÉES
-- =====================================================
-- Version: 1.0
-- Date: 2024
-- Description: Migration complète pour la plateforme Wakaa
-- Auteur: Équipe Wakaa
-- =====================================================

-- Supprimer les tables existantes si elles existent (pour une migration propre)
DROP TABLE IF EXISTS affiliate_referrals CASCADE;
DROP TABLE IF EXISTS affiliate_programs CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS webhooks_log CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS merchant_settings CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 1. TABLE PROFILES (Utilisateurs principaux)
-- =====================================================
-- Description: Table centrale pour tous les utilisateurs (marchands, clients, admins)
-- Rôle: Authentification et gestion des profils utilisateurs

CREATE TABLE profiles (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'merchant' CHECK (role IN ('merchant', 'customer', 'admin')),
  avatar_url TEXT,
  phone_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Cameroon',
  timezone VARCHAR(50) DEFAULT 'Africa/Douala',
  language VARCHAR(10) DEFAULT 'fr',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_active ON profiles (is_active);
CREATE INDEX idx_profiles_phone ON profiles (phone_number);

-- =====================================================
-- 2. TABLE ADMIN_USERS (Utilisateurs administrateurs)
-- =====================================================
-- Description: Utilisateurs administrateurs de la plateforme
-- Rôle: Gestion et supervision de la plateforme

CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support', 'analyst')),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_email ON admin_users (email);
CREATE INDEX idx_admin_users_role ON admin_users (role);
CREATE INDEX idx_admin_users_active ON admin_users (is_active);

-- =====================================================
-- 3. TABLE USER_SESSIONS (Sessions utilisateurs)
-- =====================================================
-- Description: Gestion des sessions d'authentification
-- Rôle: Sécurité et suivi des connexions

CREATE TABLE user_sessions (
  id BIGSERIAL PRIMARY KEY,
  merchant_id VARCHAR(255) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_merchant ON user_sessions (merchant_id);
CREATE INDEX idx_sessions_token ON user_sessions (session_token);
CREATE INDEX idx_sessions_active ON user_sessions (is_active, expires_at);

-- =====================================================
-- 4. TABLE SUBSCRIPTION_PLANS (Plans d'abonnement)
-- =====================================================
-- Description: Définition des plans d'abonnement disponibles
-- Rôle: Monétisation et gestion des fonctionnalités

CREATE TABLE subscription_plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0 NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  orders_limit INTEGER,
  products_limit INTEGER,
  customers_limit INTEGER,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_active ON subscription_plans (is_active, sort_order);

-- =====================================================
-- 5. TABLE MERCHANTS (Marchands/Entreprises)
-- =====================================================
-- Description: Informations des entreprises utilisant Wakaa
-- Rôle: Gestion des comptes business

CREATE TABLE merchants (
  id BIGSERIAL PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(100) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Cameroon',
  currency VARCHAR(10) DEFAULT 'FCFA',
  timezone VARCHAR(50) DEFAULT 'Africa/Douala',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email) REFERENCES profiles(email) ON DELETE CASCADE,
  FOREIGN KEY (subscription_plan) REFERENCES subscription_plans(name) ON DELETE SET DEFAULT
);

CREATE INDEX idx_merchants_email ON merchants (email);
CREATE INDEX idx_merchants_slug ON merchants (slug);
CREATE INDEX idx_merchants_status ON merchants (status);
CREATE INDEX idx_merchants_whatsapp ON merchants (whatsapp_number);

-- =====================================================
-- 6. TABLE SUBSCRIPTIONS (Abonnements actifs)
-- =====================================================
-- Description: Abonnements des marchands aux plans
-- Rôle: Gestion de la facturation et des limites

CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT NOT NULL,
  plan_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  price NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'FCFA',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  orders_limit INTEGER,
  orders_used INTEGER DEFAULT 0,
  features JSONB DEFAULT '{}',
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_type) REFERENCES subscription_plans(name) ON DELETE RESTRICT
);

CREATE INDEX idx_subscriptions_merchant ON subscriptions (merchant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_billing ON subscriptions (next_billing_date);

-- =====================================================
-- 7. TABLE API_KEYS (Clés API pour intégrations)
-- =====================================================
-- Description: Clés API pour accès programmatique
-- Rôle: Intégrations tierces et automatisation

CREATE TABLE api_keys (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 1000,
  expires_at TIMESTAMP WITH TIME ZONE,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_merchant ON api_keys (merchant_id);
CREATE INDEX idx_api_keys_active ON api_keys (is_active, expires_at);
CREATE INDEX idx_api_keys_prefix ON api_keys (key_prefix);

-- =====================================================
-- 8. TABLE MERCHANT_SETTINGS (Paramètres marchands)
-- =====================================================
-- Description: Configuration personnalisée par marchand
-- Rôle: Personnalisation de l'expérience business

CREATE TABLE merchant_settings (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT UNIQUE NOT NULL,
  notification_preferences JSONB DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',
  auto_reply_enabled BOOLEAN DEFAULT true,
  auto_reply_message TEXT,
  order_confirmation_template TEXT,
  payment_reminder_template TEXT,
  delivery_notification_template TEXT,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  minimum_order_amount NUMERIC(10,2) DEFAULT 0,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_merchant_settings_merchant ON merchant_settings (merchant_id);

-- =====================================================
-- 9. TABLE CUSTOMERS (Clients des marchands)
-- =====================================================
-- Description: Base de données clients pour chaque marchand
-- Rôle: CRM et gestion de la relation client

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  UNIQUE(merchant_id, phone_number)
);

CREATE INDEX idx_customers_merchant ON customers (merchant_id);
CREATE INDEX idx_customers_phone ON customers (phone_number);
CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_customers_orders ON customers (total_orders DESC);

-- =====================================================
-- 10. TABLE PRODUCTS (Catalogue produits)
-- =====================================================
-- Description: Catalogue de produits pour chaque marchand
-- Rôle: Gestion de l'inventaire et des prix

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(15,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sku VARCHAR(100),
  weight NUMERIC(8,2),
  dimensions JSONB,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_products_merchant ON products (merchant_id);
CREATE INDEX idx_products_active ON products (merchant_id, is_active);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_sku ON products (sku);

-- =====================================================
-- 11. TABLE ORDERS (Commandes)
-- =====================================================
-- Description: Commandes passées par les clients
-- Rôle: Gestion du processus de vente

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  merchant_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  items JSONB NOT NULL,
  subtotal_amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  shipping_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id BIGINT,
  shipping_address JSONB,
  notes TEXT,
  whatsapp_message_id VARCHAR(255),
  source VARCHAR(50) DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'web', 'api', 'manual')),
  delivery_date TIMESTAMP WITH TIME ZONE,
  tracking_number VARCHAR(255),
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_merchant ON orders (merchant_id);
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_payment_status ON orders (payment_status);
CREATE INDEX idx_orders_date ON orders (create_time DESC);
CREATE INDEX idx_orders_number ON orders (order_number);

-- =====================================================
-- 12. TABLE ORDER_ITEMS (Articles de commande)
-- =====================================================
-- Description: Détail des articles dans chaque commande
-- Rôle: Traçabilité et analytics produits

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) NOT NULL,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);

-- =====================================================
-- 13. TABLE PAYMENTS (Paiements)
-- =====================================================
-- Description: Transactions de paiement
-- Rôle: Gestion financière et réconciliation

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  merchant_id BIGINT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('cinetpay', 'mtn_momo', 'orange_money', 'manual')),
  transaction_id VARCHAR(255),
  external_transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  customer_phone VARCHAR(20),
  webhook_data JSONB,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order ON payments (order_id);
CREATE INDEX idx_payments_merchant ON payments (merchant_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_provider ON payments (provider);
CREATE INDEX idx_payments_transaction ON payments (transaction_id);

-- =====================================================
-- 14. TABLE NOTIFICATIONS (Notifications)
-- =====================================================
-- Description: Système de notifications multi-canal
-- Rôle: Communication automatisée avec les clients

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT,
  customer_id BIGINT,
  order_id BIGINT,
  type VARCHAR(100) NOT NULL CHECK (type IN ('order_created', 'payment_received', 'order_shipped', 'order_delivered', 'subscription_expiring', 'system_alert')),
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'push', 'in_app')),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_merchant ON notifications (merchant_id);
CREATE INDEX idx_notifications_customer ON notifications (customer_id);
CREATE INDEX idx_notifications_status ON notifications (status);
CREATE INDEX idx_notifications_channel ON notifications (channel);
CREATE INDEX idx_notifications_type ON notifications (type);

-- =====================================================
-- 15. TABLE QR_CODES (Codes QR)
-- =====================================================
-- Description: Génération et gestion des QR codes
-- Rôle: Faciliter les commandes et paiements

CREATE TABLE qr_codes (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT NOT NULL,
  code VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('order_link', 'product', 'catalog', 'contact', 'payment')),
  url TEXT NOT NULL,
  qr_image_url TEXT,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_qr_codes_merchant ON qr_codes (merchant_id);
CREATE INDEX idx_qr_codes_code ON qr_codes (code);
CREATE INDEX idx_qr_codes_type ON qr_codes (type);
CREATE INDEX idx_qr_codes_active ON qr_codes (is_active);

-- =====================================================
-- 16. TABLE WEBHOOKS_LOG (Logs des webhooks)
-- =====================================================
-- Description: Journalisation des webhooks reçus
-- Rôle: Debugging et audit des intégrations

CREATE TABLE webhooks_log (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL CHECK (source IN ('whatsapp', 'cinetpay', 'mtn_momo', 'orange_money')),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  signature_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  payment_id BIGINT,
  order_id BIGINT,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_webhooks_source ON webhooks_log (source);
CREATE INDEX idx_webhooks_status ON webhooks_log (status);
CREATE INDEX idx_webhooks_date ON webhooks_log (create_time DESC);

-- =====================================================
-- 17. TABLE SUPPORT_TICKETS (Tickets de support)
-- =====================================================
-- Description: Système de support client
-- Rôle: Assistance et résolution de problèmes

CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(100) UNIQUE NOT NULL,
  merchant_id BIGINT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50) CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'account', 'integration', 'training', 'other')),
  assigned_to BIGINT,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_support_tickets_merchant ON support_tickets (merchant_id);
CREATE INDEX idx_support_tickets_status ON support_tickets (status);
CREATE INDEX idx_support_tickets_priority ON support_tickets (priority);
CREATE INDEX idx_support_tickets_assigned ON support_tickets (assigned_to);

-- =====================================================
-- 18. TABLE AUDIT_LOGS (Logs d'audit)
-- =====================================================
-- Description: Journalisation des actions utilisateurs
-- Rôle: Sécurité et conformité

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('merchant', 'admin', 'system')),
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs (user_type, user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_date ON audit_logs (create_time DESC);

-- =====================================================
-- 19. TABLE ANALYTICS_EVENTS (Événements analytics)
-- =====================================================
-- Description: Collecte d'événements pour analytics
-- Rôle: Business intelligence et optimisation

CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_analytics_merchant ON analytics_events (merchant_id);
CREATE INDEX idx_analytics_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_date ON analytics_events (create_time);

-- =====================================================
-- 20. TABLE PAYMENT_METHODS (Méthodes de paiement)
-- =====================================================
-- Description: Configuration des méthodes de paiement par marchand
-- Rôle: Flexibilité des options de paiement

CREATE TABLE payment_methods (
  id BIGSERIAL PRIMARY KEY,
  merchant_id BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('cinetpay', 'mtn_momo', 'orange_money', 'bank_transfer', 'cash')),
  method_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  fees JSONB DEFAULT '{}',
  supported_currencies JSONB DEFAULT '["FCFA"]',
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_methods_merchant ON payment_methods (merchant_id);
CREATE INDEX idx_payment_methods_active ON payment_methods (merchant_id, is_active);

-- =====================================================
-- 21. TABLE AFFILIATE_PROGRAMS (Programmes d'affiliation)
-- =====================================================
-- Description: Gestion du programme d'affiliation
-- Rôle: Acquisition et rétention via parrainage

CREATE TABLE affiliate_programs (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id UUID UNIQUE NOT NULL,
  affiliate_name VARCHAR(255) NOT NULL,
  affiliate_email VARCHAR(255) UNIQUE NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  payment_method JSONB DEFAULT '{}',
  last_payout_at TIMESTAMP WITH TIME ZONE,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_affiliate_programs_code ON affiliate_programs (referral_code);
CREATE INDEX idx_affiliate_programs_status ON affiliate_programs (status);
CREATE INDEX idx_affiliate_programs_email ON affiliate_programs (affiliate_email);

-- =====================================================
-- 22. TABLE AFFILIATE_REFERRALS (Parrainages)
-- =====================================================
-- Description: Suivi des parrainages et commissions
-- Rôle: Calcul et paiement des commissions

CREATE TABLE affiliate_referrals (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL,
  merchant_id BIGINT NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  commission_amount NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (affiliate_id) REFERENCES affiliate_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_affiliate_referrals_affiliate ON affiliate_referrals (affiliate_id);
CREATE INDEX idx_affiliate_referrals_merchant ON affiliate_referrals (merchant_id);
CREATE INDEX idx_affiliate_referrals_status ON affiliate_referrals (status);

-- =====================================================
-- 23. TABLE SYSTEM_SETTINGS (Paramètres système)
-- =====================================================
-- Description: Configuration globale de la plateforme
-- Rôle: Administration et configuration système

CREATE TABLE system_settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings (key);
CREATE INDEX idx_system_settings_category ON system_settings (category);
CREATE INDEX idx_system_settings_public ON system_settings (is_public);

-- =====================================================
-- CONTRAINTES DE CLÉS ÉTRANGÈRES SUPPLÉMENTAIRES
-- =====================================================

-- Ajouter la contrainte pour payment_id dans orders
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment 
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Description: Sécurité au niveau des lignes pour isoler les données

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les marchands (accès à leurs propres données uniquement)
CREATE POLICY merchant_own_profile ON profiles FOR ALL USING (
  id = current_setting('app.current_user_id', true)
);

CREATE POLICY merchant_own_data ON merchants FOR ALL USING (
  email = current_setting('app.current_user_email', true)
);

CREATE POLICY merchant_customers ON customers FOR ALL USING (
  merchant_id IN (
    SELECT id FROM merchants WHERE email = current_setting('app.current_user_email', true)
  )
);

CREATE POLICY merchant_orders ON orders FOR ALL USING (
  merchant_id IN (
    SELECT id FROM merchants WHERE email = current_setting('app.current_user_email', true)
  )
);

CREATE POLICY merchant_payments ON payments FOR ALL USING (
  merchant_id IN (
    SELECT id FROM merchants WHERE email = current_setting('app.current_user_email', true)
  )
);

CREATE POLICY merchant_products ON products FOR ALL USING (
  merchant_id IN (
    SELECT id FROM merchants WHERE email = current_setting('app.current_user_email', true)
  )
);

-- =====================================================
-- DONNÉES D'INITIALISATION
-- =====================================================

-- Plans d'abonnement par défaut
INSERT INTO subscription_plans (name, display_name, description, price, currency, billing_cycle, orders_limit, features, is_active, sort_order) VALUES
('free', 'Gratuit', 'Plan gratuit pour débuter avec Wakaa', 0, 'FCFA', 'monthly', 10, 
 '{"whatsapp_integration": true, "basic_analytics": true, "customer_management": true, "email_support": false}', 
 true, 1),
('standard', 'Standard', 'Plan standard pour entreprises en croissance', 5000, 'FCFA', 'monthly', 500, 
 '{"whatsapp_integration": true, "basic_analytics": true, "customer_management": true, "email_support": true, "payment_integration": true, "advanced_analytics": true}', 
 true, 2),
('premium', 'Premium', 'Plan premium pour entreprises établies', 10000, 'FCFA', 'monthly', null, 
 '{"whatsapp_integration": true, "advanced_analytics": true, "api_access": true, "priority_support": true, "custom_integrations": true, "unlimited_orders": true}', 
 true, 3);

-- Paramètres système par défaut
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app_name', '"Wakaa"', 'Nom de l''application', 'general', true),
('app_version', '"1.0.0"', 'Version de l''application', 'general', true),
('maintenance_mode', 'false', 'Mode maintenance activé', 'general', false),
('max_file_size', '10485760', 'Taille maximale des fichiers (10MB)', 'uploads', false),
('default_currency', '"FCFA"', 'Devise par défaut', 'business', true),
('default_timezone', '"Africa/Douala"', 'Fuseau horaire par défaut', 'general', true),
('whatsapp_webhook_token', '"wakaa_webhook_token"', 'Token de vérification WhatsApp', 'integrations', false),
('cinetpay_environment', '"sandbox"', 'Environnement CinetPay (sandbox/live)', 'payments', false);

-- Utilisateur administrateur par défaut
INSERT INTO profiles (id, email, password_hash, full_name, role, phone_number, city, is_active, email_verified) VALUES
('admin_wakaa_001', 'admin@wakaa.io', 'hashed_adminpass_1234567890', 'Admin Wakaa', 'admin', '+237698765432', 'Douala', true, true);

INSERT INTO admin_users (email, password_hash, name, role, is_active, permissions) VALUES
('admin@wakaa.io', 'hashed_adminpass_1234567890', 'Admin Wakaa', 'super_admin', true, 
 '{"users": {"read": true, "write": true, "delete": true}, "merchants": {"read": true, "write": true, "delete": true}, "system": {"read": true, "write": true}}');

-- Utilisateur marchand de test
INSERT INTO profiles (id, email, password_hash, full_name, role, phone_number, city, is_active, email_verified) VALUES
('merchant_test_001', 'marie@boutique.com', 'hashed_password123_1234567890', 'Marie Ngono', 'merchant', '+237612345678', 'Yaoundé', true, true);

INSERT INTO merchants (id, business_name, whatsapp_number, email, slug, subscription_plan, status, city) VALUES
(1, 'Boutique Mode Marie', '+237612345678', 'marie@boutique.com', 'boutique-mode-marie-001', 'premium', 'active', 'Yaoundé');

INSERT INTO subscriptions (merchant_id, plan_type, status, start_date, price, currency, billing_cycle, auto_renew) VALUES
(1, 'premium', 'active', CURRENT_TIMESTAMP, 10000, 'FCFA', 'monthly', true);

-- Paramètres par défaut pour le marchand de test
INSERT INTO merchant_settings (merchant_id, notification_preferences, business_hours, auto_reply_enabled, auto_reply_message, order_confirmation_template, payment_reminder_template, delivery_notification_template) VALUES
(1, 
 '{"email": true, "whatsapp": true, "sms": false}',
 '{"monday": {"open": "08:00", "close": "18:00", "closed": false}, "tuesday": {"open": "08:00", "close": "18:00", "closed": false}, "wednesday": {"open": "08:00", "close": "18:00", "closed": false}, "thursday": {"open": "08:00", "close": "18:00", "closed": false}, "friday": {"open": "08:00", "close": "18:00", "closed": false}, "saturday": {"open": "08:00", "close": "18:00", "closed": false}, "sunday": {"open": "08:00", "close": "18:00", "closed": true}}',
 true,
 'Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.',
 'Votre commande #{order_number} a été confirmée. Montant: {total_amount} FCFA',
 'Rappel: Votre commande #{order_number} est en attente de paiement.',
 'Votre commande #{order_number} a été expédiée !');

-- Clients de test
INSERT INTO customers (id, merchant_id, phone_number, name, email, city, total_orders, total_spent, last_order_at) VALUES
(1, 1, '+237698765432', 'Jean Mbarga', 'jean@email.com', 'Douala', 3, 75000, CURRENT_TIMESTAMP),
(2, 1, '+237677889900', 'Grace Bello', 'grace@email.com', 'Yaoundé', 1, 25000, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(3, 1, '+237655443322', 'Paul Nkomo', null, null, 2, 45000, CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Produits de test
INSERT INTO products (id, merchant_id, name, description, price, image_url, category, stock_quantity, is_active, sku) VALUES
(1, 1, 'Robe Africaine Premium', 'Belle robe traditionnelle africaine en tissu wax de qualité', 25000, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', 'Mode & Vêtements', 15, true, 'RAF-001'),
(2, 1, 'Ensemble Traditionnel', 'Ensemble complet avec boubou et pantalon assorti', 35000, 'https://images.unsplash.com/photo-1583391733956-6461ffad8d80?w=400&h=400&fit=crop', 'Mode & Vêtements', 8, true, 'ENS-001'),
(3, 1, 'Accessoires Mode', 'Colliers et bracelets artisanaux', 15000, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop', 'Accessoires', 25, true, 'ACC-001');

-- Commandes de test
INSERT INTO orders (id, merchant_id, customer_id, order_number, items, subtotal_amount, tax_amount, shipping_amount, total_amount, currency, status, payment_status, source, create_time) VALUES
(1, 1, 1, 'CMD-001-2024', '[{"name": "Robe Africaine Premium", "quantity": 1, "price": 25000, "total": 25000}]', 25000, 0, 0, 25000, 'FCFA', 'delivered', 'paid', 'whatsapp', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(2, 1, 2, 'CMD-002-2024', '[{"name": "Ensemble Traditionnel", "quantity": 1, "price": 35000, "total": 35000}]', 35000, 0, 2000, 37000, 'FCFA', 'pending', 'pending', 'whatsapp', CURRENT_TIMESTAMP);

-- Articles de commande
INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price) VALUES
(1, 1, 'Robe Africaine Premium', 'RAF-001', 1, 25000, 25000),
(2, 2, 'Ensemble Traditionnel', 'ENS-001', 1, 35000, 35000);

-- Paiements de test
INSERT INTO payments (id, order_id, merchant_id, amount, currency, provider, transaction_id, status, payment_method, customer_phone, processed_at) VALUES
(1, 1, 1, 25000, 'FCFA', 'cinetpay', 'TXN-001-2024', 'completed', 'mtn_momo', '+237698765432', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Mettre à jour la commande avec l'ID de paiement
UPDATE orders SET payment_id = 1 WHERE id = 1;

-- Méthodes de paiement par défaut pour le marchand de test
INSERT INTO payment_methods (merchant_id, provider, method_name, is_active, configuration, fees) VALUES
(1, 'cinetpay', 'CinetPay', true, '{"api_key": "", "site_id": "", "environment": "sandbox"}', '{"percentage": 2.5, "fixed": 0}'),
(1, 'mtn_momo', 'MTN Mobile Money', true, '{"api_key": "", "user_id": "", "environment": "sandbox"}', '{"percentage": 1.5, "fixed": 0}'),
(1, 'orange_money', 'Orange Money', true, '{"merchant_key": "", "environment": "sandbox"}', '{"percentage": 1.5, "fixed": 0}');

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour modify_time automatiquement
CREATE OR REPLACE FUNCTION update_modify_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modify_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec modify_time
CREATE TRIGGER update_profiles_modify_time BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_merchants_modify_time BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_customers_modify_time BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_orders_modify_time BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_payments_modify_time BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_products_modify_time BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_subscriptions_modify_time BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_modify_time();
CREATE TRIGGER update_notifications_modify_time BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_modify_time();

-- Fonction pour mettre à jour les statistiques clients
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Mettre à jour les statistiques du client
    UPDATE customers SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = NEW.customer_id AND status IN ('delivered', 'paid')
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_amount), 0) FROM orders 
        WHERE customer_id = NEW.customer_id AND payment_status = 'paid'
      ),
      last_order_at = (
        SELECT MAX(create_time) FROM orders 
        WHERE customer_id = NEW.customer_id
      )
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats clients automatiquement
CREATE TRIGGER update_customer_stats_trigger 
  AFTER INSERT OR UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- =====================================================
-- VUES UTILES POUR LES ANALYTICS
-- =====================================================

-- Vue pour les revenus par mois
CREATE VIEW monthly_revenue AS
SELECT 
  m.id as merchant_id,
  m.business_name,
  DATE_TRUNC('month', p.processed_at) as month,
  COUNT(p.id) as total_payments,
  SUM(p.amount) as total_revenue,
  AVG(p.amount) as average_payment
FROM merchants m
LEFT JOIN payments p ON m.id = p.merchant_id AND p.status = 'completed'
GROUP BY m.id, m.business_name, DATE_TRUNC('month', p.processed_at)
ORDER BY month DESC;

-- Vue pour les top produits
CREATE VIEW top_products AS
SELECT 
  p.merchant_id,
  p.id as product_id,
  p.name as product_name,
  COUNT(oi.id) as total_sales,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'paid')
GROUP BY p.merchant_id, p.id, p.name
ORDER BY total_sales DESC;

-- =====================================================
-- COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE profiles IS 'Table principale des utilisateurs avec authentification et profils';
COMMENT ON TABLE merchants IS 'Informations des entreprises utilisant la plateforme Wakaa';
COMMENT ON TABLE customers IS 'Base de données clients pour chaque marchand (CRM)';
COMMENT ON TABLE orders IS 'Commandes passées par les clients via WhatsApp ou autres canaux';
COMMENT ON TABLE payments IS 'Transactions de paiement avec intégration CinetPay et mobile money';
COMMENT ON TABLE products IS 'Catalogue de produits pour chaque marchand';
COMMENT ON TABLE notifications IS 'Système de notifications multi-canal (WhatsApp, SMS, Email)';
COMMENT ON TABLE subscription_plans IS 'Plans d''abonnement disponibles sur la plateforme';
COMMENT ON TABLE subscriptions IS 'Abonnements actifs des marchands';
COMMENT ON TABLE analytics_events IS 'Collecte d''événements pour business intelligence';
COMMENT ON TABLE webhooks_log IS 'Journalisation des webhooks pour debugging et audit';

-- =====================================================
-- FINALISATION
-- =====================================================

-- Analyser les tables pour optimiser les performances
ANALYZE;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration Wakaa terminée avec succès !';
  RAISE NOTICE 'Tables créées: %, Indexes: %, Triggers: %', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = current_schema()),
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = current_schema()),
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = current_schema());
END $$;
