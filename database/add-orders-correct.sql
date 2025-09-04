-- Insérer quelques commandes avec les bons IDs
INSERT INTO orders (merchant_id, customer_id, order_number, items, subtotal_amount, total_amount, status, payment_status) VALUES
(3, 10, 'WK-2025-001', '{"items": [{"name": "T-shirt", "price": 15000, "qty": 1}]}', 15000, 15000, 'delivered', 'paid'),
(3, 11, 'WK-2025-002', '{"items": [{"name": "Jean", "price": 25000, "qty": 1}]}', 25000, 25000, 'pending', 'pending'),
(4, 12, 'WK-2025-003', '{"items": [{"name": "Robe", "price": 35000, "qty": 1}]}', 35000, 35000, 'shipped', 'paid'),
(4, 13, 'WK-2025-004', '{"items": [{"name": "Sac", "price": 28000, "qty": 1}]}', 28000, 28000, 'processing', 'paid');

-- Insérer quelques paiements
INSERT INTO payments (order_id, merchant_id, amount, provider, status, payment_method) VALUES
(1, 3, 15000, 'cinetpay', 'completed', 'mtn_momo'),
(3, 4, 35000, 'cinetpay', 'completed', 'orange_money'),
(4, 4, 28000, 'manual', 'completed', 'cash'),
(2, 3, 25000, 'cinetpay', 'pending', 'mtn_momo');

SELECT 'Configuration terminée avec succès!' as message;
SELECT 'Commandes: ' || COUNT(*) as count FROM orders;
SELECT 'Paiements: ' || COUNT(*) as count FROM payments;