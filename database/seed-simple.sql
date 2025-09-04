-- =====================================================
-- WAKAA - DONNÉES DE TEST SIMPLES
-- =====================================================

-- =====================================================
-- 1. INSERTION DE PROFILS DE TEST (avec UUID manuels)
-- =====================================================
INSERT INTO profiles (id, email, password_hash, full_name, phone_number, role, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@wakaa.cm', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Admin Wakaa', '+237670000001', 'admin', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'merchant1@wakaa.cm', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Jean Boutique', '+237670000002', 'merchant', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'merchant2@wakaa.cm', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Marie Fashion', '+237670000003', 'merchant', true, true);

-- =====================================================
-- 2. INSERTION DE MARCHANDS DE TEST
-- =====================================================
INSERT INTO merchants (business_name, whatsapp_number, email, slug, subscription_plan, city, country) VALUES
('Boutique Jean', '+237670123456', 'merchant1@wakaa.cm', 'boutique-jean', 'standard', 'Douala', 'Cameroon'),
('Marie Fashion', '+237680234567', 'merchant2@wakaa.cm', 'marie-fashion', 'premium', 'Yaoundé', 'Cameroon');

-- =====================================================
-- 3. INSERTION DE CLIENTS DE TEST
-- =====================================================
INSERT INTO customers (merchant_id, phone_number, name, email, city, total_orders, total_spent) VALUES
(1, '+237671111111', 'Client Test 1', 'client1@test.com', 'Douala', 3, 75000),
(1, '+237672222222', 'Client Test 2', 'client2@test.com', 'Douala', 2, 50000),
(2, '+237673333333', 'Client Test 3', 'client3@test.com', 'Yaoundé', 5, 125000),
(2, '+237674444444', 'Client Test 4', 'client4@test.com', 'Yaoundé', 1, 25000);

-- =====================================================
-- 4. INSERTION DE PRODUITS DE TEST
-- =====================================================
INSERT INTO products (merchant_id, name, description, price, image_url, category, stock_quantity, sku) VALUES
(1, 'T-shirt Coton Premium', 'T-shirt en coton de qualité supérieure', 15000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Vêtements', 50, 'TSH001'),
(1, 'Jean Slim Fit', 'Jean slim fit moderne et confortable', 25000, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 'Vêtements', 30, 'JEA001'),
(1, 'Sneakers Sport', 'Chaussures de sport confortables', 45000, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 'Chaussures', 20, 'SNE001'),
(2, 'Robe Élégante', 'Robe élégante pour soirée', 35000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 'Vêtements', 15, 'ROB001'),
(2, 'Sac à Main Cuir', 'Sac à main en cuir véritable', 28000, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Accessoires', 25, 'SAC001'),
(2, 'Bijoux Fantaisie', 'Collection de bijoux tendance', 12000, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'Accessoires', 40, 'BIJ001');

-- =====================================================
-- 5. INSERTION DE COMMANDES DE TEST
-- =====================================================
INSERT INTO orders (merchant_id, customer_id, order_number, items, subtotal_amount, total_amount, status, payment_status, shipping_address) VALUES
(1, 1, 'WK-2025-001', '[{"product_id": 1, "name": "T-shirt Coton Premium", "price": 15000, "quantity": 1}, {"product_id": 2, "name": "Jean Slim Fit", "price": 25000, "quantity": 1}]', 40000, 42000, 'delivered', 'paid', '{"address": "123 Rue A", "city": "Douala", "phone": "+237671111111"}'),
(1, 2, 'WK-2025-002', '[{"product_id": 1, "name": "T-shirt Coton Premium", "price": 15000, "quantity": 1}]', 15000, 17000, 'pending', 'pending', '{"address": "456 Rue B", "city": "Douala", "phone": "+237672222222"}'),
(2, 3, 'WK-2025-003', '[{"product_id": 4, "name": "Robe Élégante", "price": 35000, "quantity": 1}, {"product_id": 5, "name": "Sac à Main Cuir", "price": 28000, "quantity": 1}]', 63000, 65000, 'shipped', 'paid', '{"address": "789 Rue C", "city": "Yaoundé", "phone": "+237673333333"}'),
(2, 4, 'WK-2025-004', '[{"product_id": 5, "name": "Sac à Main Cuir", "price": 28000, "quantity": 1}]', 28000, 30000, 'processing', 'paid', '{"address": "321 Rue D", "city": "Yaoundé", "phone": "+237674444444"}');

-- =====================================================
-- 6. INSERTION D'ARTICLES DE COMMANDE DE TEST
-- =====================================================
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, product_sku) VALUES
(1, 1, 'T-shirt Coton Premium', 1, 15000, 15000, 'TSH001'),
(1, 2, 'Jean Slim Fit', 1, 25000, 25000, 'JEA001'),
(2, 1, 'T-shirt Coton Premium', 1, 15000, 15000, 'TSH001'),
(3, 4, 'Robe Élégante', 1, 35000, 35000, 'ROB001'),
(3, 5, 'Sac à Main Cuir', 1, 28000, 28000, 'SAC001'),
(4, 5, 'Sac à Main Cuir', 1, 28000, 28000, 'SAC001');

-- =====================================================
-- 7. INSERTION DE PAIEMENTS DE TEST
-- =====================================================
INSERT INTO payments (order_id, merchant_id, amount, provider, transaction_id, status, payment_method, customer_phone, processed_at) VALUES
(1, 1, 42000, 'cinetpay', 'CP_TXN_001', 'completed', 'mtn_momo', '+237671111111', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 2, 65000, 'cinetpay', 'CP_TXN_002', 'completed', 'orange_money', '+237673333333', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(4, 2, 30000, 'manual', 'MANUAL_001', 'completed', 'cash', '+237674444444', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(2, 1, 17000, 'cinetpay', 'CP_TXN_003', 'pending', 'mtn_momo', '+237672222222', NULL);

-- =====================================================
-- 8. INSERTION D'ABONNEMENTS DE TEST
-- =====================================================
INSERT INTO subscriptions (merchant_id, plan_type, status, start_date, end_date, next_billing_date, price, orders_limit, orders_used) VALUES
(1, 'standard', 'active', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 5000, 500, 25),
(2, 'premium', 'active', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '20 days', 10000, -1, 12);

-- =====================================================
-- 9. INSERTION DE PARAMÈTRES MARCHANDS DE TEST
-- =====================================================
INSERT INTO merchant_settings (merchant_id, auto_reply_enabled, auto_reply_message, tax_rate, shipping_fee, minimum_order_amount) VALUES
(1, true, 'Merci pour votre message ! Nous vous répondrons rapidement.', 0, 2000, 5000),
(2, true, 'Bienvenue chez Marie Fashion ! Comment puis-je vous aider ?', 0, 1500, 10000);

-- =====================================================
-- 10. INSERTION DE NOTIFICATIONS DE TEST
-- =====================================================
INSERT INTO notifications (merchant_id, customer_id, order_id, type, channel, recipient, subject, message, status, sent_at) VALUES
(1, 1, 1, 'order_created', 'whatsapp', '+237671111111', 'Commande confirmée', 'Votre commande WK-2025-001 a été confirmée. Montant: 42000 FCFA', 'delivered', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 3, 3, 'order_shipped', 'whatsapp', '+237673333333', 'Commande expédiée', 'Votre commande WK-2025-003 a été expédiée.', 'delivered', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 4, 4, 'payment_received', 'whatsapp', '+237674444444', 'Paiement reçu', 'Nous avons reçu votre paiement pour la commande WK-2025-004', 'delivered', CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- =====================================================
-- 11. INSERTION DE LOGS WEBHOOKS DE TEST
-- =====================================================
INSERT INTO webhooks_log (source, event_type, payload, status, processed_at, signature_verified) VALUES
('whatsapp', 'message_received', '{"from": "+237671111111", "message": "Je veux commander", "timestamp": "2025-01-03T10:30:00Z"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '2 hours', true),
('cinetpay', 'payment_completed', '{"transaction_id": "CP_TXN_001", "amount": 42000, "status": "completed"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '2 days', true),
('cinetpay', 'payment_completed', '{"transaction_id": "CP_TXN_002", "amount": 65000, "status": "completed"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '1 day', true);

-- Message de confirmation
SELECT 'Données de test insérées avec succès!' as message;
SELECT 'Profils: ' || COUNT(*) as profiles FROM profiles;
SELECT 'Marchands: ' || COUNT(*) as merchants FROM merchants;
SELECT 'Produits: ' || COUNT(*) as products FROM products;
SELECT 'Commandes: ' || COUNT(*) as orders FROM orders;