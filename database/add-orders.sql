-- Insérer quelques commandes simples
INSERT INTO orders (merchant_id, customer_id, order_number, items, subtotal_amount, total_amount, status, payment_status) VALUES
(3, 1, 'WK-2025-001', '{"items": [{"name": "T-shirt", "price": 15000, "qty": 1}]}', 15000, 15000, 'delivered', 'paid'),
(3, 2, 'WK-2025-002', '{"items": [{"name": "Jean", "price": 25000, "qty": 1}]}', 25000, 25000, 'pending', 'pending'),
(4, 3, 'WK-2025-003', '{"items": [{"name": "Robe", "price": 35000, "qty": 1}]}', 35000, 35000, 'shipped', 'paid'),
(4, 4, 'WK-2025-004', '{"items": [{"name": "Sac", "price": 28000, "qty": 1}]}', 28000, 28000, 'processing', 'paid');

SELECT 'Commandes ajoutées: ' || COUNT(*) as result FROM orders;