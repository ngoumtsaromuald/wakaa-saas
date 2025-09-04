-- =====================================================
-- WAKAA - DONNÉES DE TEST FINALES
-- =====================================================

-- Récupérer les IDs des marchands existants
DO $$
DECLARE
    merchant1_id INTEGER;
    merchant2_id INTEGER;
BEGIN
    -- Récupérer les IDs des marchands
    SELECT id INTO merchant1_id FROM merchants WHERE email = 'merchant1@wakaa.cm';
    SELECT id INTO merchant2_id FROM merchants WHERE email = 'merchant2@wakaa.cm';
    
    -- Insérer les clients
    INSERT INTO customers (merchant_id, phone_number, name, email, city, total_orders, total_spent) VALUES
    (merchant1_id, '+237671111111', 'Client Test 1', 'client1@test.com', 'Douala', 3, 75000),
    (merchant1_id, '+237672222222', 'Client Test 2', 'client2@test.com', 'Douala', 2, 50000),
    (merchant2_id, '+237673333333', 'Client Test 3', 'client3@test.com', 'Yaoundé', 5, 125000),
    (merchant2_id, '+237674444444', 'Client Test 4', 'client4@test.com', 'Yaoundé', 1, 25000);
    
    -- Insérer les produits
    INSERT INTO products (merchant_id, name, description, price, image_url, category, stock_quantity, sku) VALUES
    (merchant1_id, 'T-shirt Coton Premium', 'T-shirt en coton de qualité supérieure', 15000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Vêtements', 50, 'TSH001'),
    (merchant1_id, 'Jean Slim Fit', 'Jean slim fit moderne et confortable', 25000, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 'Vêtements', 30, 'JEA001'),
    (merchant1_id, 'Sneakers Sport', 'Chaussures de sport confortables', 45000, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 'Chaussures', 20, 'SNE001'),
    (merchant2_id, 'Robe Élégante', 'Robe élégante pour soirée', 35000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 'Vêtements', 15, 'ROB001'),
    (merchant2_id, 'Sac à Main Cuir', 'Sac à main en cuir véritable', 28000, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Accessoires', 25, 'SAC001'),
    (merchant2_id, 'Bijoux Fantaisie', 'Collection de bijoux tendance', 12000, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'Accessoires', 40, 'BIJ001');
    
    -- Insérer les paramètres marchands
    INSERT INTO merchant_settings (merchant_id, auto_reply_enabled, auto_reply_message, tax_rate, shipping_fee, minimum_order_amount) VALUES
    (merchant1_id, true, 'Merci pour votre message ! Nous vous répondrons rapidement.', 0, 2000, 5000),
    (merchant2_id, true, 'Bienvenue chez Marie Fashion ! Comment puis-je vous aider ?', 0, 1500, 10000);
    
    -- Insérer les abonnements
    INSERT INTO subscriptions (merchant_id, plan_type, status, start_date, end_date, next_billing_date, price, orders_limit, orders_used) VALUES
    (merchant1_id, 'standard', 'active', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 5000, 500, 25),
    (merchant2_id, 'premium', 'active', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '20 days', 10000, -1, 12);
    
    RAISE NOTICE 'Données de test insérées avec succès!';
END $$;

-- Insérer quelques commandes simples (après avoir les clients et produits)
DO $$
DECLARE
    merchant1_id INTEGER;
    merchant2_id INTEGER;
    customer1_id INTEGER;
    customer2_id INTEGER;
    customer3_id INTEGER;
    customer4_id INTEGER;
    product1_id INTEGER;
    product2_id INTEGER;
    product4_id INTEGER;
    product5_id INTEGER;
    order1_id INTEGER;
    order2_id INTEGER;
    order3_id INTEGER;
    order4_id INTEGER;
BEGIN
    -- Récupérer les IDs
    SELECT id INTO merchant1_id FROM merchants WHERE email = 'merchant1@wakaa.cm';
    SELECT id INTO merchant2_id FROM merchants WHERE email = 'merchant2@wakaa.cm';
    
    SELECT id INTO customer1_id FROM customers WHERE phone_number = '+237671111111';
    SELECT id INTO customer2_id FROM customers WHERE phone_number = '+237672222222';
    SELECT id INTO customer3_id FROM customers WHERE phone_number = '+237673333333';
    SELECT id INTO customer4_id FROM customers WHERE phone_number = '+237674444444';
    
    SELECT id INTO product1_id FROM products WHERE sku = 'TSH001';
    SELECT id INTO product2_id FROM products WHERE sku = 'JEA001';
    SELECT id INTO product4_id FROM products WHERE sku = 'ROB001';
    SELECT id INTO product5_id FROM products WHERE sku = 'SAC001';
    
    -- Insérer les commandes
    INSERT INTO orders (merchant_id, customer_id, order_number, items, subtotal_amount, total_amount, status, payment_status, shipping_address) VALUES
    (merchant1_id, customer1_id, 'WK-2025-001', '[{"product_id": ' || product1_id || ', "name": "T-shirt Coton Premium", "price": 15000, "quantity": 1}, {"product_id": ' || product2_id || ', "name": "Jean Slim Fit", "price": 25000, "quantity": 1}]', 40000, 42000, 'delivered', 'paid', '{"address": "123 Rue A", "city": "Douala", "phone": "+237671111111"}'),
    (merchant1_id, customer2_id, 'WK-2025-002', '[{"product_id": ' || product1_id || ', "name": "T-shirt Coton Premium", "price": 15000, "quantity": 1}]', 15000, 17000, 'pending', 'pending', '{"address": "456 Rue B", "city": "Douala", "phone": "+237672222222"}'),
    (merchant2_id, customer3_id, 'WK-2025-003', '[{"product_id": ' || product4_id || ', "name": "Robe Élégante", "price": 35000, "quantity": 1}, {"product_id": ' || product5_id || ', "name": "Sac à Main Cuir", "price": 28000, "quantity": 1}]', 63000, 65000, 'shipped', 'paid', '{"address": "789 Rue C", "city": "Yaoundé", "phone": "+237673333333"}'),
    (merchant2_id, customer4_id, 'WK-2025-004', '[{"product_id": ' || product5_id || ', "name": "Sac à Main Cuir", "price": 28000, "quantity": 1}]', 28000, 30000, 'processing', 'paid', '{"address": "321 Rue D", "city": "Yaoundé", "phone": "+237674444444"}')
    RETURNING id INTO order1_id;
    
    -- Récupérer les IDs des commandes créées
    SELECT id INTO order1_id FROM orders WHERE order_number = 'WK-2025-001';
    SELECT id INTO order2_id FROM orders WHERE order_number = 'WK-2025-002';
    SELECT id INTO order3_id FROM orders WHERE order_number = 'WK-2025-003';
    SELECT id INTO order4_id FROM orders WHERE order_number = 'WK-2025-004';
    
    -- Insérer les articles de commande
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, product_sku) VALUES
    (order1_id, product1_id, 'T-shirt Coton Premium', 1, 15000, 15000, 'TSH001'),
    (order1_id, product2_id, 'Jean Slim Fit', 1, 25000, 25000, 'JEA001'),
    (order2_id, product1_id, 'T-shirt Coton Premium', 1, 15000, 15000, 'TSH001'),
    (order3_id, product4_id, 'Robe Élégante', 1, 35000, 35000, 'ROB001'),
    (order3_id, product5_id, 'Sac à Main Cuir', 1, 28000, 28000, 'SAC001'),
    (order4_id, product5_id, 'Sac à Main Cuir', 1, 28000, 28000, 'SAC001');
    
    -- Insérer les paiements
    INSERT INTO payments (order_id, merchant_id, amount, provider, transaction_id, status, payment_method, customer_phone, processed_at) VALUES
    (order1_id, merchant1_id, 42000, 'cinetpay', 'CP_TXN_001', 'completed', 'mtn_momo', '+237671111111', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (order3_id, merchant2_id, 65000, 'cinetpay', 'CP_TXN_002', 'completed', 'orange_money', '+237673333333', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (order4_id, merchant2_id, 30000, 'manual', 'MANUAL_001', 'completed', 'cash', '+237674444444', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (order2_id, merchant1_id, 17000, 'cinetpay', 'CP_TXN_003', 'pending', 'mtn_momo', '+237672222222', NULL);
    
    -- Insérer les notifications
    INSERT INTO notifications (merchant_id, customer_id, order_id, type, channel, recipient, subject, message, status, sent_at) VALUES
    (merchant1_id, customer1_id, order1_id, 'order_created', 'whatsapp', '+237671111111', 'Commande confirmée', 'Votre commande WK-2025-001 a été confirmée. Montant: 42000 FCFA', 'delivered', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (merchant2_id, customer3_id, order3_id, 'order_shipped', 'whatsapp', '+237673333333', 'Commande expédiée', 'Votre commande WK-2025-003 a été expédiée.', 'delivered', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (merchant2_id, customer4_id, order4_id, 'payment_received', 'whatsapp', '+237674444444', 'Paiement reçu', 'Nous avons reçu votre paiement pour la commande WK-2025-004', 'delivered', CURRENT_TIMESTAMP - INTERVAL '3 hours');
    
    RAISE NOTICE 'Commandes et données associées insérées avec succès!';
END $$;

-- Insérer les logs webhooks
INSERT INTO webhooks_log (source, event_type, payload, status, processed_at, signature_verified) VALUES
('whatsapp', 'message_received', '{"from": "+237671111111", "message": "Je veux commander", "timestamp": "2025-01-03T10:30:00Z"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '2 hours', true),
('cinetpay', 'payment_completed', '{"transaction_id": "CP_TXN_001", "amount": 42000, "status": "completed"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '2 days', true),
('cinetpay', 'payment_completed', '{"transaction_id": "CP_TXN_002", "amount": 65000, "status": "completed"}', 'processed', CURRENT_TIMESTAMP - INTERVAL '1 day', true);

-- Statistiques finales
SELECT 'Configuration terminée!' as message;
SELECT 'Profils: ' || COUNT(*) as count FROM profiles;
SELECT 'Marchands: ' || COUNT(*) as count FROM merchants;
SELECT 'Clients: ' || COUNT(*) as count FROM customers;
SELECT 'Produits: ' || COUNT(*) as count FROM products;
SELECT 'Commandes: ' || COUNT(*) as count FROM orders;
SELECT 'Articles: ' || COUNT(*) as count FROM order_items;
SELECT 'Paiements: ' || COUNT(*) as count FROM payments;
SELECT 'Notifications: ' || COUNT(*) as count FROM notifications;