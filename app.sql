
-- Table des marchands (micro-entrepreneurs)
CREATE TABLE merchants (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'standard', 'premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    settings JSONB DEFAULT '{}',
    profile_image_url TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Cameroon',
    currency VARCHAR(10) DEFAULT 'FCFA',
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients
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
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id, phone_number)
);

-- Table des produits/catalogue
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sku VARCHAR(100),
    weight DECIMAL(8,2),
    dimensions JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    items JSONB NOT NULL,
    subtotal_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'FCFA',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id BIGINT,
    shipping_address JSONB,
    notes TEXT,
    whatsapp_message_id VARCHAR(255),
    source VARCHAR(50) DEFAULT 'whatsapp',
    delivery_date DATE,
    tracking_number VARCHAR(100),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
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
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des abonnements
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'standard', 'premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'FCFA',
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    orders_limit INTEGER,
    orders_used INTEGER DEFAULT 0,
    features JSONB DEFAULT '{}',
    payment_method VARCHAR(50),
    auto_renew BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs de webhooks
CREATE TABLE webhooks_log (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL CHECK (source IN ('whatsapp', 'cinetpay', 'mtn_momo', 'orange_money', 'internal')),
    event_type VARCHAR(100) NOT NULL,
    merchant_id BIGINT,
    order_id BIGINT,
    payment_id BIGINT,
    payload JSONB NOT NULL,
    headers JSONB,
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'retrying')),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    signature_verified BOOLEAN DEFAULT false,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT,
    customer_id BIGINT,
    order_id BIGINT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_created', 'payment_received', 'order_shipped', 'order_delivered', 'subscription_expiring', 'system_alert')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'push', 'in_app')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions utilisateur
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des métriques et analytics
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
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX idx_merchants_whatsapp ON merchants(whatsapp_number);
CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_merchants_subscription ON merchants(subscription_plan, status);

CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_merchant_phone ON customers(merchant_id, phone_number);

CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_active ON products(merchant_id, is_active);
CREATE INDEX idx_products_category ON products(merchant_id, category);

CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_date ON orders(create_time);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_merchant ON payments(merchant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

CREATE INDEX idx_subscriptions_merchant ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_billing ON subscriptions(next_billing_date);

CREATE INDEX idx_webhooks_source ON webhooks_log(source);
CREATE INDEX idx_webhooks_status ON webhooks_log(status);
CREATE INDEX idx_webhooks_merchant ON webhooks_log(merchant_id);
CREATE INDEX idx_webhooks_retry ON webhooks_log(next_retry_at) WHERE status = 'retrying';

CREATE INDEX idx_notifications_merchant ON notifications(merchant_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_sessions_merchant ON user_sessions(merchant_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);

CREATE INDEX idx_analytics_merchant ON analytics_events(merchant_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_date ON analytics_events(create_time);

-- Données de test pour les marchands
INSERT INTO merchants (business_name, whatsapp_number, email, slug, subscription_plan, profile_image_url, address, city) VALUES
('Boutique Mama Grace', '+237670123456', 'grace@wakaa.io', 'mama-grace', 'premium', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', '123 Rue de la Paix', 'Douala'),
('Tech Store Cameroun', '+237680234567', 'tech@wakaa.io', 'tech-store', 'standard', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400', '456 Avenue Kennedy', 'Yaoundé'),
('Fashion Bella', '+237690345678', 'bella@wakaa.io', 'fashion-bella', 'free', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', '789 Marché Central', 'Douala'),
('Épicerie du Coin', '+237650456789', 'epicerie@wakaa.io', 'epicerie-coin', 'standard', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', '321 Quartier Bonanjo', 'Douala'),
('Électronique Plus', '+237660567890', 'elec@wakaa.io', 'electronique-plus', 'premium', 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400', '654 Rue Joss', 'Douala'),
('Cosmétiques Afrique', '+237670678901', 'cosmet@wakaa.io', 'cosmetiques-afrique', 'free', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', '987 Marché Mokolo', 'Yaoundé'),
('Restaurant Saveurs', '+237680789012', 'saveurs@wakaa.io', 'restaurant-saveurs', 'standard', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', '147 Bastos', 'Yaoundé'),
('Librairie Moderne', '+237690890123', 'librairie@wakaa.io', 'librairie-moderne', 'premium', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', '258 Centre-ville', 'Bafoussam');

-- Données de test pour les clients
INSERT INTO customers (merchant_id, phone_number, name, email, address, city, total_orders, total_spent) VALUES
(1, '+237671111111', 'Jean Dupont', 'jean@email.com', '123 Rue A', 'Douala', 5, 125000),
(1, '+237672222222', 'Marie Kamga', 'marie@email.com', '456 Rue B', 'Douala', 3, 75000),
(2, '+237673333333', 'Paul Mbarga', 'paul@email.com', '789 Rue C', 'Yaoundé', 8, 200000),
(2, '+237674444444', 'Sophie Nkomo', 'sophie@email.com', '321 Rue D', 'Yaoundé', 2, 50000),
(3, '+237675555555', 'André Fouda', 'andre@email.com', '654 Rue E', 'Douala', 4, 80000),
(3, '+237676666666', 'Claudine Biya', 'claudine@email.com', '987 Rue F', 'Douala', 6, 150000),
(4, '+237677777777', 'Michel Onana', 'michel@email.com', '147 Rue G', 'Douala', 7, 175000),
(4, '+237678888888', 'Françoise Muna', 'francoise@email.com', '258 Rue H', 'Douala', 1, 25000);

-- Données de test pour les produits
INSERT INTO products (merchant_id, name, description, price, image_url, category, stock_quantity, sku) VALUES
(1, 'Robe Africaine Premium', 'Belle robe traditionnelle en wax', 25000, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400', 'Vêtements', 15, 'RAP001'),
(1, 'Sac à Main Cuir', 'Sac élégant en cuir véritable', 35000, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Accessoires', 8, 'SAC001'),
(2, 'Smartphone Samsung A54', 'Téléphone dernière génération', 180000, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 'Électronique', 12, 'TEL001'),
(2, 'Écouteurs Bluetooth', 'Écouteurs sans fil haute qualité', 15000, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'Électronique', 25, 'ECO001'),
(3, 'Ensemble Crop Top', 'Ensemble moderne pour femme', 18000, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', 'Mode', 20, 'ENS001'),
(4, 'Riz Parfumé 5kg', 'Riz de qualité supérieure', 3500, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Alimentation', 50, 'RIZ001'),
(5, 'Ordinateur Portable HP', 'PC portable pour bureau', 350000, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 'Informatique', 5, 'PC001'),
(6, 'Crème Hydratante Bio', 'Soin visage naturel', 8000, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', 'Cosmétiques', 30, 'CRE001');

-- Données de test pour les commandes
INSERT INTO orders (merchant_id, customer_id, order_number, items, subtotal_amount, total_amount, status, payment_status, shipping_address) VALUES
(1, 1, 'WK-001-001', '[{"product_id": 1, "name": "Robe Africaine Premium", "price": 25000, "quantity": 2}]', 50000, 52000, 'delivered', 'paid', '{"address": "123 Rue A", "city": "Douala", "phone": "+237671111111"}'),
(1, 2, 'WK-001-002', '[{"product_id": 2, "name": "Sac à Main Cuir", "price": 35000, "quantity": 1}]', 35000, 37000, 'shipped', 'paid', '{"address": "456 Rue B", "city": "Douala", "phone": "+237672222222"}'),
(2, 3, 'WK-002-001', '[{"product_id": 3, "name": "Smartphone Samsung A54", "price": 180000, "quantity": 1}]', 180000, 182000, 'processing', 'paid', '{"address": "789 Rue C", "city": "Yaoundé", "phone": "+237673333333"}'),
(2, 4, 'WK-002-002', '[{"product_id": 4, "name": "Écouteurs Bluetooth", "price": 15000, "quantity": 2}]', 30000, 32000, 'confirmed', 'paid', '{"address": "321 Rue D", "city": "Yaoundé", "phone": "+237674444444"}'),
(3, 5, 'WK-003-001', '[{"product_id": 5, "name": "Ensemble Crop Top", "price": 18000, "quantity": 1}]', 18000, 20000, 'pending', 'pending', '{"address": "654 Rue E", "city": "Douala", "phone": "+237675555555"}'),
(4, 7, 'WK-004-001', '[{"product_id": 6, "name": "Riz Parfumé 5kg", "price": 3500, "quantity": 10}]', 35000, 37000, 'delivered', 'paid', '{"address": "147 Rue G", "city": "Douala", "phone": "+237677777777"}'),
(5, 1, 'WK-005-001', '[{"product_id": 7, "name": "Ordinateur Portable HP", "price": 350000, "quantity": 1}]', 350000, 352000, 'cancelled', 'refunded', '{"address": "123 Rue A", "city": "Douala", "phone": "+237671111111"}'),
(6, 2, 'WK-006-001', '[{"product_id": 8, "name": "Crème Hydratante Bio", "price": 8000, "quantity": 3}]', 24000, 26000, 'shipped', 'paid', '{"address": "456 Rue B", "city": "Douala", "phone": "+237672222222"}');

-- Données de test pour les paiements
INSERT INTO payments (order_id, merchant_id, amount, provider, transaction_id, status, payment_method, customer_phone, processed_at) VALUES
(1, 1, 52000, 'cinetpay', 'CP_TXN_001', 'completed', 'mtn_momo', '+237671111111', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 1, 37000, 'cinetpay', 'CP_TXN_002', 'completed', 'orange_money', '+237672222222', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 2, 182000, 'cinetpay', 'CP_TXN_003', 'completed', 'mtn_momo', '+237673333333', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(4, 2, 32000, 'cinetpay', 'CP_TXN_004', 'completed', 'mtn_momo', '+237674444444', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(5, 3, 20000, 'cinetpay', 'CP_TXN_005', 'pending', 'orange_money', '+237675555555', NULL),
(6, 4, 37000, 'cinetpay', 'CP_TXN_006', 'completed', 'mtn_momo', '+237677777777', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 5, 352000, 'cinetpay', 'CP_TXN_007', 'refunded', 'mtn_momo', '+237671111111', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(8, 6, 26000, 'cinetpay', 'CP_TXN_008', 'completed', 'orange_money', '+237672222222', CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Données de test pour les abonnements
INSERT INTO subscriptions (merchant_id, plan_type, status, start_date, end_date, next_billing_date, price, orders_limit, orders_used) VALUES
(1, 'premium', 'active', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 10000, -1, 25),
(2, 'standard', 'active', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '20 days', 5000, 500, 45),
(3, 'free', 'active', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '25 days', NULL, 0, 10, 3),
(4, 'standard', 'active', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '10 days', 5000, 500, 78),
(5, 'premium', 'active', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP + INTERVAL '22 days', CURRENT_TIMESTAMP + INTERVAL '22 days', 10000, -1, 12),
(6, 'free', 'active', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '27 days', NULL, 0, 10, 1),
(7, 'standard', 'active', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP + INTERVAL '18 days', CURRENT_TIMESTAMP + INTERVAL '18 days', 5000, 500, 23),
(8, 'premium', 'active', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days', 10000, -1, 67);

-- Données de test pour les logs de webhooks
INSERT INTO webhooks_log (source, event_type, merchant_id, order_id, payload, status, processed_at, signature_verified) VALUES
('whatsapp', 'message_received', 1, NULL, '{"from": "+237671111111", "message": "Je veux commander 2 robes", "timestamp": "2024-01-15T10:30:00Z"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '2 hours', true),
('cinetpay', 'payment_completed', 1, 1, '{"transaction_id": "CP_TXN_001", "amount": 52000, "status": "completed"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '2 days', true),
('whatsapp', 'message_received', 2, NULL, '{"from": "+237673333333", "message": "Disponibilité Samsung A54?", "timestamp": "2024-01-15T14:15:00Z"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '4 hours', true),
('cinetpay', 'payment_pending', 3, 5, '{"transaction_id": "CP_TXN_005", "amount": 20000, "status": "pending"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '30 minutes', true),
('mtn_momo', 'payment_notification', 2, 3, '{"reference": "MTN_001", "amount": 182000, "status": "success"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '3 hours', true),
('orange_money', 'payment_callback', 1, 2, '{"txn_id": "OM_002", "amount": 37000, "status": "completed"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '1 day', true),
('whatsapp', 'delivery_status', 4, 6, '{"message_id": "wamid_001", "status": "delivered", "timestamp": "2024-01-15T16:45:00Z"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '1 hour', true),
('internal', 'order_status_update', 5, 7, '{"order_id": 7, "old_status": "processing", "new_status": "cancelled", "reason": "customer_request"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '1 day', true);

-- Données de test pour les notifications
INSERT INTO notifications (merchant_id, customer_id, order_id, type, channel, recipient, subject, message, status, sent_at) VALUES
(1, 1, 1, 'order_created', 'whatsapp', '+237671111111', 'Commande confirmée', 'Votre commande WK-001-001 a été confirmée. Montant: 52000 FCFA', 'delivered', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, NULL, 1, 'payment_received', 'whatsapp', '+237670123456', 'Paiement reçu', 'Paiement de 52000 FCFA reçu pour la commande WK-001-001', 'delivered', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 3, 3, 'order_shipped', 'sms', '+237673333333', 'Commande expédiée', 'Votre commande WK-002-001 a été expédiée. Suivi: TRK123456', 'sent', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(3, 5, 5, 'payment_pending', 'whatsapp', '+237675555555', 'Paiement en attente', 'Votre paiement pour la commande WK-003-001 est en cours de traitement', 'delivered', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
(4, 7, 6, 'order_delivered', 'whatsapp', '+237677777777', 'Commande livrée', 'Votre commande WK-004-001 a été livrée avec succès', 'delivered', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, NULL, NULL, 'subscription_expiring', 'email', 'grace@wakaa.io', 'Abonnement expire bientôt', 'Votre abonnement Premium expire dans 15 jours', 'sent', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(5, 1, 7, 'order_cancelled', 'whatsapp', '+237671111111', 'Commande annulée', 'Votre commande WK-005-001 a été annulée. Remboursement en cours', 'delivered', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(6, 2, 8, 'order_shipped', 'whatsapp', '+237672222222', 'Expédition confirmée', 'Vos produits cosmétiques ont été expédiés', 'delivered', CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Table pour les articles détaillés de chaque commande
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    product_image_url TEXT,
    product_sku VARCHAR(100),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Table pour les paramètres spécifiques de chaque marchand
CREATE TABLE merchant_settings (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL UNIQUE,
    whatsapp_webhook_url TEXT,
    whatsapp_verify_token VARCHAR(255),
    whatsapp_access_token TEXT,
    cinetpay_api_key TEXT,
    cinetpay_site_id VARCHAR(100),
    notification_preferences JSONB DEFAULT '{}',
    business_hours JSONB DEFAULT '{}',
    auto_reply_enabled BOOLEAN DEFAULT true,
    auto_reply_message TEXT,
    order_confirmation_template TEXT,
    payment_reminder_template TEXT,
    delivery_notification_template TEXT,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    minimum_order_amount NUMERIC(15,2) DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchant_settings_merchant ON merchant_settings(merchant_id);

-- Table pour les méthodes de paiement disponibles
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    fees JSONB DEFAULT '{}',
    supported_currencies JSONB DEFAULT '["FCFA"]',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_methods_provider_check CHECK (provider IN ('cinetpay', 'mtn_momo', 'orange_money', 'bank_transfer', 'cash'))
);

CREATE INDEX idx_payment_methods_merchant ON payment_methods(merchant_id);
CREATE INDEX idx_payment_methods_active ON payment_methods(merchant_id, is_active);

-- Table pour définir les plans d'abonnement
CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'FCFA',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    orders_limit INTEGER,
    products_limit INTEGER,
    customers_limit INTEGER,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscription_plans_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active, sort_order);

-- Table pour les administrateurs de la plateforme
CREATE TABLE admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_users_role_check CHECK (role IN ('super_admin', 'admin', 'support', 'analyst'))
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Table pour l'audit et la traçabilité
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_user_type_check CHECK (user_type IN ('merchant', 'admin', 'system'))
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_type, user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(create_time);

-- Table pour la gestion des clés API
CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_merchant ON api_keys(merchant_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active, expires_at);

-- Table pour le système de support
CREATE TABLE support_tickets (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50),
    assigned_to BIGINT,
    attachments JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    resolved_at TIMESTAMP WITH TIME ZONE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
    CONSTRAINT support_tickets_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX idx_support_tickets_merchant ON support_tickets(merchant_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority, status);

-- Données d'exemple pour order_items
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, product_sku) VALUES
(1, 1, 'Smartphone Samsung Galaxy A54', 1, 250000, 250000, 'SAMSUNG-A54'),
(1, 2, 'Écouteurs Bluetooth', 1, 15000, 15000, 'BT-EARBUDS'),
(2, 3, 'Robe Africaine Wax', 2, 25000, 50000, 'ROBE-WAX-001'),
(3, 4, 'Sac à Main Cuir', 1, 35000, 35000, 'SAC-CUIR-001'),
(4, 5, 'Chaussures Sport Nike', 1, 45000, 45000, 'NIKE-SPORT-001'),
(5, 1, 'Smartphone Samsung Galaxy A54', 1, 250000, 250000, 'SAMSUNG-A54'),
(6, 6, 'Montre Connectée', 1, 85000, 85000, 'WATCH-SMART-001'),
(7, 7, 'Parfum Homme', 1, 28000, 28000, 'PARFUM-H-001'),
(8, 8, 'Bijoux Fantaisie', 3, 8000, 24000, 'BIJOUX-001');

-- Données d'exemple pour merchant_settings
INSERT INTO merchant_settings (merchant_id, auto_reply_enabled, auto_reply_message, tax_rate, shipping_fee, minimum_order_amount) VALUES
(1, true, 'Merci pour votre message! Nous vous répondrons dans les plus brefs délais.', 19.25, 2000, 5000),
(2, true, 'Bonjour! Bienvenue chez Bella Mode. Comment puis-je vous aider?', 19.25, 1500, 10000),
(3, false, '', 19.25, 3000, 15000),
(4, true, 'Salut! Merci de nous contacter. Votre commande sera traitée rapidement.', 19.25, 2500, 8000),
(5, true, 'Bienvenue chez TechCameroun! Nous sommes là pour vous aider.', 19.25, 5000, 20000);

-- Données d'exemple pour payment_methods
INSERT INTO payment_methods (merchant_id, provider, method_name, is_active, configuration) VALUES
(1, 'cinetpay', 'CinetPay Mobile Money', true, '{"site_id": "12345", "api_key": "test_key"}'),
(1, 'mtn_momo', 'MTN Mobile Money', true, '{"merchant_code": "MTN001"}'),
(1, 'orange_money', 'Orange Money', true, '{"merchant_id": "OM001"}'),
(2, 'cinetpay', 'CinetPay Mobile Money', true, '{"site_id": "12346", "api_key": "test_key2"}'),
(2, 'mtn_momo', 'MTN Mobile Money', true, '{"merchant_code": "MTN002"}'),
(3, 'cinetpay', 'CinetPay Mobile Money', true, '{"site_id": "12347", "api_key": "test_key3"}'),
(4, 'cinetpay', 'CinetPay Mobile Money', true, '{"site_id": "12348", "api_key": "test_key4"}'),
(5, 'cinetpay', 'CinetPay Mobile Money', true, '{"site_id": "12349", "api_key": "test_key5"}');

-- Données d'exemple pour subscription_plans
INSERT INTO subscription_plans (name, display_name, description, price, orders_limit, products_limit, customers_limit, features, sort_order) VALUES
('free', 'Plan Gratuit', 'Parfait pour débuter avec les fonctionnalités de base', 0, 10, 5, 50, '{"whatsapp_integration": true, "basic_analytics": true, "email_support": true}', 1),
('standard', 'Plan Standard', 'Idéal pour les petites entreprises en croissance', 5000, 500, 50, 1000, '{"whatsapp_integration": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "custom_templates": true}', 2),
('premium', 'Plan Premium', 'Solution complète pour les entreprises établies', 10000, -1, -1, -1, '{"whatsapp_integration": true, "advanced_analytics": true, "priority_support": true, "api_access": true, "custom_branding": true, "multi_user": true}', 3);

-- Données d'exemple pour admin_users
INSERT INTO admin_users (email, password_hash, name, role, permissions) VALUES
('admin@wakaa.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Administrateur Principal', 'super_admin', '{"all": true}'),
('support@wakaa.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Équipe Support', 'support', '{"tickets": true, "users": "read"}'),
('analyst@wakaa.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Analyste Business', 'analyst', '{"analytics": true, "reports": true}');

-- Données d'exemple pour audit_logs
INSERT INTO audit_logs (user_type, user_id, user_email, action, resource_type, resource_id, new_values, ip_address) VALUES
('merchant', 1, 'jean@techcameroun.com', 'CREATE_ORDER', 'order', 1, '{"total_amount": 265000, "status": "pending"}', '192.168.1.100'),
('merchant', 2, 'marie@bellamode.cm', 'UPDATE_PRODUCT', 'product', 3, '{"price": 25000, "stock_quantity": 15}', '192.168.1.101'),
('admin', 1, 'admin@wakaa.io', 'SUSPEND_MERCHANT', 'merchant', 3, '{"status": "suspended", "reason": "payment_overdue"}', '10.0.0.1'),
('merchant', 1, 'jean@techcameroun.com', 'PAYMENT_RECEIVED', 'payment', 1, '{"status": "completed", "amount": 265000}', '192.168.1.100'),
('system', 0, 'system@wakaa.io', 'SUBSCRIPTION_EXPIRED', 'subscription', 2, '{"status": "expired", "end_date": "2024-01-15"}', '127.0.0.1');

-- Données d'exemple pour api_keys
INSERT INTO api_keys (merchant_id, name, key_hash, key_prefix, permissions, rate_limit) VALUES
(1, 'Production API', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'wk_live_', '{"orders": "read_write", "products": "read_write", "customers": "read"}', 5000),
(2, 'Webhook Integration', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'wk_live_', '{"webhooks": "write", "orders": "read"}', 2000),
(5, 'Analytics API', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'wk_live_', '{"analytics": "read", "reports": "read"}', 1000);

-- Données d'exemple pour support_tickets
INSERT INTO support_tickets (merchant_id, subject, description, status, priority, category, assigned_to) VALUES
(1, 'Problème de synchronisation WhatsApp', 'Les messages WhatsApp ne sont plus reçus depuis hier soir. Pouvez-vous vérifier la configuration?', 'open', 'high', 'technical', 2),
(2, 'Question sur la facturation', 'Je souhaite comprendre comment fonctionne la facturation pour le plan Premium.', 'in_progress', 'medium', 'billing', 2),
(3, 'Demande de fonctionnalité', 'Serait-il possible d\'ajouter un système de codes promo pour mes clients?', 'open', 'low', 'feature_request', NULL),
(4, 'Erreur lors du paiement', 'Un client n\'arrive pas à finaliser son paiement via MTN Mobile Money.', 'waiting_customer', 'high', 'payment', 2),
(5, 'Formation sur l\'utilisation', 'J\'aimerais avoir une formation sur l\'utilisation avancée du tableau de bord.', 'resolved', 'medium', 'training', 3),
(1, 'Mise à jour du profil', 'Comment puis-je changer l\'adresse de mon entreprise dans mon profil?', 'closed', 'low', 'account', 3);

-- Table profiles pour l'authentification Supabase avec gestion des rôles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'merchant' NOT NULL,
    merchant_id BIGINT,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profiles_role_check CHECK (role IN ('merchant', 'customer', 'admin', 'support'))
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_merchant ON profiles(merchant_id);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- Table ticket_messages pour le système de support
CREATE TABLE ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_id UUID,
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal BOOLEAN DEFAULT false,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ticket_messages_sender_type_check CHECK (sender_type IN ('merchant', 'admin', 'system'))
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender ON ticket_messages(sender_type, sender_id);
CREATE INDEX idx_ticket_messages_date ON ticket_messages(create_time);

-- Table merchant_analytics pour les métriques agrégées
CREATE TABLE merchant_analytics (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue NUMERIC(15,2) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    average_order_value NUMERIC(15,2) DEFAULT 0,
    whatsapp_messages INTEGER DEFAULT 0,
    payment_success_rate NUMERIC(5,2) DEFAULT 0,
    metrics JSONB DEFAULT '{}',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id, date)
);

CREATE INDEX idx_merchant_analytics_merchant ON merchant_analytics(merchant_id);
CREATE INDEX idx_merchant_analytics_date ON merchant_analytics(date);
CREATE INDEX idx_merchant_analytics_merchant_date ON merchant_analytics(merchant_id, date);

-- Table qr_codes pour la génération de QR codes personnalisés
CREATE TABLE qr_codes (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) DEFAULT 'order_link',
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
    CONSTRAINT qr_codes_type_check CHECK (type IN ('order_link', 'product', 'catalog', 'contact', 'payment'))
);

CREATE INDEX idx_qr_codes_merchant ON qr_codes(merchant_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_active ON qr_codes(merchant_id, is_active);

-- Table affiliate_programs pour le programme d'affiliation
CREATE TABLE affiliate_programs (
    id BIGSERIAL PRIMARY KEY,
    affiliate_id UUID NOT NULL,
    affiliate_name VARCHAR(255) NOT NULL,
    affiliate_email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    total_referrals INTEGER DEFAULT 0,
    total_earnings NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    payment_method JSONB DEFAULT '{}',
    last_payout_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT affiliate_programs_status_check CHECK (status IN ('active', 'suspended', 'inactive'))
);

CREATE INDEX idx_affiliate_programs_code ON affiliate_programs(referral_code);
CREATE INDEX idx_affiliate_programs_status ON affiliate_programs(status);
CREATE INDEX idx_affiliate_programs_email ON affiliate_programs(affiliate_email);

-- Table affiliate_referrals pour suivre les références
CREATE TABLE affiliate_referrals (
    id BIGSERIAL PRIMARY KEY,
    affiliate_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    referral_code VARCHAR(50) NOT NULL,
    commission_amount NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT affiliate_referrals_status_check CHECK (status IN ('pending', 'approved', 'paid', 'cancelled'))
);

CREATE INDEX idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_merchant ON affiliate_referrals(merchant_id);
CREATE INDEX idx_affiliate_referrals_status ON affiliate_referrals(status);

-- Table system_settings pour la configuration globale
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_public ON system_settings(is_public);

-- Données de test pour profiles
INSERT INTO profiles (id, email, full_name, role, phone_number, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@wakaa.io', 'Admin Wakaa', 'admin', '+237670000001', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'jean.kamdem@gmail.com', 'Jean Kamdem', 'merchant', '+237670000002', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'marie.ngono@gmail.com', 'Marie Ngono', 'merchant', '+237670000003', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'paul.biya@gmail.com', 'Paul Biya', 'merchant', '+237670000004', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'support@wakaa.io', 'Support Wakaa', 'support', '+237670000005', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'client1@gmail.com', 'Client Test 1', 'customer', '+237670000006', true, true),
('550e8400-e29b-41d4-a716-446655440007', 'client2@gmail.com', 'Client Test 2', 'customer', '+237670000007', true, true);

-- Données de test pour ticket_messages
INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, sender_name, message) VALUES
(1, 'merchant', '550e8400-e29b-41d4-a716-446655440002', 'Jean Kamdem', 'Bonjour, j''ai un problème avec l''intégration WhatsApp. Les messages ne sont pas reçus.'),
(1, 'admin', '550e8400-e29b-41d4-a716-446655440001', 'Admin Wakaa', 'Bonjour Jean, pouvez-vous vérifier votre token WhatsApp dans les paramètres ?'),
(1, 'merchant', '550e8400-e29b-41d4-a716-446655440002', 'Jean Kamdem', 'J''ai vérifié et le token semble correct. Le problème persiste.'),
(2, 'merchant', '550e8400-e29b-41d4-a716-446655440003', 'Marie Ngono', 'Comment puis-je configurer les paiements CinetPay ?'),
(2, 'support', '550e8400-e29b-41d4-a716-446655440005', 'Support Wakaa', 'Vous devez aller dans Paramètres > Paiements et saisir vos clés API CinetPay.');

-- Données de test pour merchant_analytics
INSERT INTO merchant_analytics (merchant_id, date, total_orders, total_revenue, total_customers, new_customers, conversion_rate, average_order_value) VALUES
(1, '2024-01-01', 15, 450000, 12, 3, 25.50, 30000),
(1, '2024-01-02', 22, 660000, 18, 6, 28.75, 30000),
(1, '2024-01-03', 18, 540000, 15, 2, 30.00, 30000),
(2, '2024-01-01', 8, 200000, 6, 2, 33.33, 25000),
(2, '2024-01-02', 12, 300000, 9, 3, 35.00, 25000),
(3, '2024-01-01', 25, 1250000, 20, 5, 40.00, 50000),
(3, '2024-01-02', 30, 1500000, 25, 8, 42.50, 50000);

-- Données de test pour qr_codes
INSERT INTO qr_codes (merchant_id, code, type, url, title, description, scan_count) VALUES
(1, 'QR001JEAN', 'order_link', 'https://wakaa.io/order/jean-boutique', 'Commande Jean Boutique', 'Scannez pour commander chez Jean Boutique', 45),
(1, 'QR002JEAN', 'catalog', 'https://wakaa.io/catalog/jean-boutique', 'Catalogue Jean Boutique', 'Voir tous nos produits', 23),
(2, 'QR001MARIE', 'order_link', 'https://wakaa.io/order/marie-cosmetiques', 'Commande Marie Cosmétiques', 'Scannez pour commander vos cosmétiques', 67),
(3, 'QR001PAUL', 'order_link', 'https://wakaa.io/order/paul-electronique', 'Commande Paul Électronique', 'Commandez vos appareils électroniques', 89),
(1, 'QR003JEAN', 'product', 'https://wakaa.io/product/smartphone-samsung', 'Smartphone Samsung', 'QR code pour ce produit spécifique', 12);

-- Données de test pour affiliate_programs
INSERT INTO affiliate_programs (affiliate_id, affiliate_name, affiliate_email, referral_code, commission_rate, total_referrals, total_earnings) VALUES
('550e8400-e29b-41d4-a716-446655440008', 'Influenceur Tech', 'tech.influencer@gmail.com', 'TECH2024', 15.00, 25, 375000),
('550e8400-e29b-41d4-a716-446655440009', 'Blog Business', 'contact@blogbusiness.cm', 'BLOG2024', 12.50, 18, 225000),
('550e8400-e29b-41d4-a716-446655440010', 'Partenaire Digital', 'digital@partner.cm', 'DIGITAL24', 10.00, 32, 320000),
('550e8400-e29b-41d4-a716-446655440011', 'Réseau Entrepreneurs', 'reseau@entrepreneurs.cm', 'RESEAU24', 20.00, 12, 240000);

-- Données de test pour affiliate_referrals
INSERT INTO affiliate_referrals (affiliate_id, merchant_id, referral_code, commission_amount, status) VALUES
(1, 1, 'TECH2024', 15000, 'paid'),
(1, 2, 'TECH2024', 12500, 'approved'),
(2, 3, 'BLOG2024', 10000, 'pending'),
(3, 1, 'DIGITAL24', 8000, 'paid'),
(4, 2, 'RESEAU24', 20000, 'approved');

-- Données de test pour system_settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app_name', '"Wakaa"', 'Nom de l''application', 'general', true),
('app_version', '"1.0.0"', 'Version de l''application', 'general', true),
('maintenance_mode', 'false', 'Mode maintenance activé', 'system', false),
('max_file_size', '10485760', 'Taille maximale des fichiers en bytes (10MB)', 'uploads', false),
('supported_currencies', '["FCFA", "EUR", "USD"]', 'Devises supportées', 'payments', true),
('whatsapp_api_version', '"v17.0"', 'Version de l''API WhatsApp', 'integrations', false),
('default_timezone', '"Africa/Douala"', 'Fuseau horaire par défaut', 'general', true),
('trial_period_days', '14', 'Durée de la période d''essai en jours', 'subscriptions', true),
('max_orders_free_plan', '10', 'Nombre maximum de commandes pour le plan gratuit', 'subscriptions', true),
('support_email', '"support@wakaa.io"', 'Email de support', 'contact', true);

-- Table profiles pour l'authentification Supabase
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'merchant' CHECK (role IN ('merchant', 'admin', 'customer')),
    merchant_id BIGINT REFERENCES merchants(id) ON DELETE SET NULL,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_profiles_email ON profiles USING btree (email);
CREATE INDEX idx_profiles_merchant ON profiles USING btree (merchant_id);
CREATE INDEX idx_profiles_role ON profiles USING btree (role);
CREATE INDEX idx_profiles_active ON profiles USING btree (is_active);

-- Fonction pour mettre à jour modify_time automatiquement
CREATE OR REPLACE FUNCTION update_modify_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modify_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour profiles
CREATE TRIGGER update_profiles_modify_time
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modify_time();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Activer RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politique RLS : Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Données de test pour les profils
INSERT INTO profiles (id, email, full_name, role, phone_number, onboarding_completed) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'merchant1@wakaa.com', 'Jean Dupont', 'merchant', '+237670123456', true),
('550e8400-e29b-41d4-a716-446655440002', 'merchant2@wakaa.com', 'Marie Kamga', 'merchant', '+237680234567', true),
('550e8400-e29b-41d4-a716-446655440003', 'admin@wakaa.com', 'Admin Wakaa', 'admin', '+237690345678', true),
('550e8400-e29b-41d4-a716-446655440004', 'customer1@wakaa.com', 'Paul Mballa', 'customer', '+237670456789', false),
('550e8400-e29b-41d4-a716-446655440005', 'merchant3@wakaa.com', 'Fatima Nkomo', 'merchant', '+237680567890', true),
('550e8400-e29b-41d4-a716-446655440006', 'support@wakaa.com', 'Support Wakaa', 'admin', '+237690678901', true),
('550e8400-e29b-41d4-a716-446655440007', 'customer2@wakaa.com', 'Grace Fouda', 'customer', '+237670789012', false),
('550e8400-e29b-41d4-a716-446655440008', 'merchant4@wakaa.com', 'Ibrahim Sali', 'merchant', '+237680890123', false);

-- Table profiles pour l'authentification Supabase
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'customer' NOT NULL,
    merchant_id BIGINT,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'merchant', 'admin', 'super_admin'))
);

-- Index pour la table profiles
CREATE INDEX idx_profiles_email ON profiles USING btree (email);
CREATE INDEX idx_profiles_role ON profiles USING btree (role);
CREATE INDEX idx_profiles_merchant ON profiles USING btree (merchant_id);
CREATE INDEX idx_profiles_phone ON profiles USING btree (phone_number);

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques RLS pour merchants
CREATE POLICY "Merchants can view own data" ON merchants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.merchant_id = merchants.id OR profiles.role IN ('admin', 'super_admin'))
        )
    );

CREATE POLICY "Merchants can update own data" ON merchants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.merchant_id = merchants.id
        )
    );

-- Politiques RLS pour products
CREATE POLICY "Merchants can manage own products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.merchant_id = products.merchant_id OR profiles.role IN ('admin', 'super_admin'))
        )
    );

-- Politiques RLS pour orders
CREATE POLICY "Merchants can view own orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.merchant_id = orders.merchant_id OR profiles.role IN ('admin', 'super_admin'))
        )
    );

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'customer')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fonction pour mettre à jour modify_time automatiquement
CREATE OR REPLACE FUNCTION update_modify_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modify_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour update modify_time sur toutes les tables
CREATE TRIGGER update_profiles_modify_time
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_modify_time();

CREATE TRIGGER update_merchants_modify_time
    BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_modify_time();

CREATE TRIGGER update_products_modify_time
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_modify_time();

CREATE TRIGGER update_orders_modify_time
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_modify_time();

-- Données de test pour profiles
INSERT INTO profiles (id, email, full_name, role, phone_number) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@wakaa.cm', 'Admin Wakaa', 'super_admin', '+237670000001'),
('550e8400-e29b-41d4-a716-446655440002', 'merchant1@wakaa.cm', 'Jean Boutique', 'merchant', '+237670000002'),
('550e8400-e29b-41d4-a716-446655440003', 'merchant2@wakaa.cm', 'Marie Shop', 'merchant', '+237670000003'),
('550e8400-e29b-41d4-a716-446655440004', 'customer1@wakaa.cm', 'Paul Client', 'customer', '+237670000004'),
('550e8400-e29b-41d4-a716-446655440005', 'customer2@wakaa.cm', 'Sophie Acheteuse', 'customer', '+237670000005');

-- Données de test pour subscription_plans
INSERT INTO subscription_plans (name, display_name, description, price, orders_limit, products_limit, customers_limit, features) VALUES
('free', 'Plan Gratuit', 'Plan de base pour débuter', 0, 50, 10, 100, '{"whatsapp_integration": true, "basic_analytics": true}'),
('standard', 'Plan Standard', 'Plan pour petites entreprises', 15000, 200, 50, 500, '{"whatsapp_integration": true, "advanced_analytics": true, "custom_branding": true}'),
('premium', 'Plan Premium', 'Plan pour grandes entreprises', 35000, 1000, 200, 2000, '{"whatsapp_integration": true, "advanced_analytics": true, "custom_branding": true, "api_access": true, "priority_support": true}');

-- Données de test pour system_settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app_name', '"Wakaa"', 'Nom de l''application', 'general', true),
('app_version', '"1.0.0"', 'Version de l''application', 'general', true),
('maintenance_mode', 'false', 'Mode maintenance', 'general', false),
('whatsapp_webhook_verify_token', '"wakaa_webhook_2024"', 'Token de vérification WhatsApp', 'integrations', false),
('cinetpay_api_url', '"https://api-checkout.cinetpay.com/v2/"', 'URL API CinetPay', 'payments', false),
('default_currency', '"FCFA"', 'Devise par défaut', 'general', true),
('max_file_upload_size', '10485760', 'Taille max upload (10MB)', 'general', false),
('email_notifications_enabled', 'true', 'Notifications email activées', 'notifications', false);

-- =====================================================
-- WAKAA - Migration Base de Données Complète
-- =====================================================
-- Version: 1.0
-- Date: 2025-01-03
-- Description: Migration complète pour l'application Wakaa
-- Inclut: Tables, RLS, Triggers, Indexes, Données de test

-- =====================================================
-- 1. SUPPRESSION DES TABLES EXISTANTES (si nécessaire)
-- =====================================================
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS webhooks_log CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS merchant_settings CASCADE;
DROP TABLE IF EXISTS merchant_analytics CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- =====================================================
-- 2. CRÉATION DES EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 3. TABLE PROFILES (Authentification Supabase)
-- =====================================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'merchant' CHECK (role IN ('merchant', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABLE MERCHANTS
-- =====================================================
CREATE TABLE merchants (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'standard', 'premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    profile_image_url TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Cameroon',
    currency VARCHAR(10) DEFAULT 'FCFA',
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. TABLE CUSTOMERS
-- =====================================================
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(15,2) DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id, phone_number)
);

-- =====================================================
-- 6. TABLE PRODUCTS
-- =====================================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABLE ORDERS
-- =====================================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal_amount NUMERIC(15,2) NOT NULL,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    shipping_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'FCFA',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    shipping_address JSONB,
    notes TEXT,
    whatsapp_message_id VARCHAR(255),
    source VARCHAR(50) DEFAULT 'whatsapp',
    delivery_date DATE,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. TABLE ORDER_ITEMS
-- =====================================================
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    product_image_url TEXT,
    product_sku VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TABLE PAYMENTS
-- =====================================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. TABLE NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_created', 'payment_received', 'order_shipped', 'order_delivered', 'subscription_expiring', 'system_alert')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'push', 'in_app')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. TABLE WEBHOOKS_LOG
-- =====================================================
CREATE TABLE webhooks_log (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL CHECK (source IN ('whatsapp', 'cinetpay', 'mtn_momo', 'orange_money', 'internal')),
    event_type VARCHAR(100) NOT NULL,
    merchant_id BIGINT REFERENCES merchants(id) ON DELETE SET NULL,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'retrying')),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    signature_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. TABLE QR_CODES
-- =====================================================
CREATE TABLE qr_codes (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) DEFAULT 'order_link' CHECK (type IN ('order_link', 'product', 'catalog', 'contact', 'payment')),
    url TEXT NOT NULL,
    qr_image_url TEXT,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. TABLE MERCHANT_SETTINGS
-- =====================================================
CREATE TABLE merchant_settings (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE UNIQUE,
    whatsapp_webhook_url TEXT,
    whatsapp_verify_token VARCHAR(255),
    whatsapp_access_token TEXT,
    cinetpay_api_key TEXT,
    cinetpay_site_id VARCHAR(100),
    notification_preferences JSONB DEFAULT '{}',
    business_hours JSONB DEFAULT '{}',
    auto_reply_enabled BOOLEAN DEFAULT true,
    auto_reply_message TEXT,
    order_confirmation_template TEXT,
    payment_reminder_template TEXT,
    delivery_notification_template TEXT,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    minimum_order_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 14. CRÉATION DES INDEX
-- =====================================================
-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Merchants
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_whatsapp ON merchants(whatsapp_number);
CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_merchants_subscription ON merchants(subscription_plan, status);

-- Customers
CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_merchant_phone ON customers(merchant_id, phone_number);

-- Products
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_active ON products(merchant_id, is_active);
CREATE INDEX idx_products_category ON products(merchant_id, category);

-- Orders
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Payments
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_merchant ON payments(merchant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- Notifications
CREATE INDEX idx_notifications_merchant ON notifications(merchant_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Webhooks
CREATE INDEX idx_webhooks_source ON webhooks_log(source);
CREATE INDEX idx_webhooks_status ON webhooks_log(status);
CREATE INDEX idx_webhooks_merchant ON webhooks_log(merchant_id);

-- QR Codes
CREATE INDEX idx_qr_codes_merchant ON qr_codes(merchant_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_active ON qr_codes(merchant_id, is_active);

-- =====================================================
-- 15. TRIGGERS POUR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_log_updated_at BEFORE UPDATE ON webhooks_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchant_settings_updated_at BEFORE UPDATE ON merchant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 16. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Activation RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Politiques RLS pour merchants
CREATE POLICY "Users can view own merchant" ON merchants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own merchant" ON merchants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own merchant" ON merchants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour customers
CREATE POLICY "Merchants can manage own customers" ON customers FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Politiques RLS pour products
CREATE POLICY "Merchants can manage own products" ON products FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Politiques RLS pour orders
CREATE POLICY "Merchants can manage own orders" ON orders FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Politiques RLS pour order_items
CREATE POLICY "Merchants can manage own order items" ON order_items FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
);

-- Politiques RLS pour payments
CREATE POLICY "Merchants can manage own payments" ON payments FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Politiques RLS pour notifications
CREATE POLICY "Merchants can manage own notifications" ON notifications FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Politiques RLS pour qr_codes
CREATE POLICY "Merchants can manage own qr codes" ON qr_codes FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Politiques RLS pour merchant_settings
CREATE POLICY "Merchants can manage own settings" ON merchant_settings FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- =====================================================
-- 17. DONNÉES DE TEST
-- =====================================================

-- Insertion de profils de test (à adapter avec de vrais UUIDs Supabase)
INSERT INTO profiles (id, email, full_name, phone, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'merchant1@wakaa.com', 'Jean Dupont', '+237670123456', 'merchant'),
('550e8400-e29b-41d4-a716-446655440002', 'merchant2@wakaa.com', 'Marie Kouam', '+237680234567', 'merchant'),
('550e8400-e29b-41d4-a716-446655440003', 'admin@wakaa.com', 'Admin Wakaa', '+237690345678', 'admin');

-- Insertion de marchands de test
INSERT INTO merchants (user_id, business_name, whatsapp_number, email, slug, subscription_plan) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Boutique Jean', '+237670123456', 'merchant1@wakaa.com', 'boutique-jean', 'standard'),
('550e8400-e29b-41d4-a716-446655440002', 'Marie Fashion', '+237680234567', 'merchant2@wakaa.com', 'marie-fashion', 'premium');

-- Insertion de clients de test
INSERT INTO customers (merchant_id, phone_number, name, email, city) VALUES
(1, '+237671111111', 'Client Test 1', 'client1@test.com', 'Douala'),
(1, '+237672222222', 'Client Test 2', 'client2@test.com', 'Yaoundé'),
(2, '+237673333333', 'Client Test 3', 'client3@test.com', 'Bafoussam'),
(2, '+237674444444', 'Client Test 4', 'client4@test.com', 'Bamenda');

-- Insertion de produits de test
INSERT INTO products (merchant_id, name, description, price, category, stock_quantity, image_url) VALUES
(1, 'T-shirt Coton', 'T-shirt en coton de qualité supérieure', 15000, 'Vêtements', 50, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
(1, 'Jean Slim', 'Jean slim fit moderne', 25000, 'Vêtements', 30, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'),
(1, 'Sneakers Sport', 'Chaussures de sport confortables', 45000, 'Chaussures', 20, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'),
(2, 'Robe Élégante', 'Robe élégante pour soirée', 35000, 'Vêtements', 15, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'),
(2, 'Sac à Main', 'Sac à main en cuir véritable', 28000, 'Accessoires', 25, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400');

-- Insertion de commandes de test
INSERT INTO orders (merchant_id, customer_id, order_number, subtotal_amount, total_amount, status) VALUES
(1, 1, 'ORD-2025-001', 40000, 40000, 'confirmed'),
(1, 2, 'ORD-2025-002', 15000, 15000, 'pending'),
(2, 3, 'ORD-2025-003', 63000, 63000, 'paid'),
(2, 4, 'ORD-2025-004', 28000, 28000, 'processing');

-- Insertion d'articles de commande de test
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
(1, 1, 'T-shirt Coton', 1, 15000, 15000),
(1, 2, 'Jean Slim', 1, 25000, 25000),
(2, 1, 'T-shirt Coton', 1, 15000, 15000),
(3, 4, 'Robe Élégante', 1, 35000, 35000),
(3, 5, 'Sac à Main', 1, 28000, 28000),
(4, 5, 'Sac à Main', 1, 28000, 28000);

-- Insertion de paiements de test
INSERT INTO payments (order_id, merchant_id, amount, provider, status, payment_method) VALUES
(1, 1, 40000, 'cinetpay', 'completed', 'mtn_momo'),
(3, 2, 63000, 'cinetpay', 'completed', 'orange_money'),
(2, 1, 15000, 'cinetpay', 'pending', 'mtn_momo'),
(4, 2, 28000, 'manual', 'pending', 'cash');

-- Insertion de paramètres marchands de test
INSERT INTO merchant_settings (merchant_id, auto_reply_enabled, auto_reply_message, tax_rate, shipping_fee) VALUES
(1, true, 'Merci pour votre message ! Nous vous répondrons rapidement.', 0, 2000),
(2, true, 'Bienvenue chez Marie Fashion ! Comment puis-je vous aider ?', 0, 1500);

-- Insertion de codes QR de test
INSERT INTO qr_codes (merchant_id, code, type, url, title, description) VALUES
(1, 'QR-BOUTIQUE-JEAN-001', 'catalog', 'https://wakaa.com/boutique-jean', 'Catalogue Boutique Jean', 'Découvrez tous nos produits'),
(2, 'QR-MARIE-FASHION-001', 'catalog', 'https://wakaa.com/marie-fashion', 'Catalogue Marie Fashion', 'Mode féminine tendance');

-- Insertion de notifications de test
INSERT INTO notifications (merchant_id, customer_id, order_id, type, channel, recipient, subject, message, status) VALUES
(1, 1, 1, 'order_created', 'whatsapp', '+237671111111', 'Commande confirmée', 'Votre commande ORD-2025-001 a été confirmée', 'sent'),
(2, 3, 3, 'payment_received', 'whatsapp', '+237673333333', 'Paiement reçu', 'Nous avons reçu votre paiement pour la commande ORD-2025-003', 'delivered');
