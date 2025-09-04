
import { CrudOperations } from '@/lib/api-utils';

// Fonction pour initialiser la base de données avec des données de test réelles
export async function initializeDatabase() {
  try {
    const profilesCrud = new CrudOperations('profiles');
    const merchantsCrud = new CrudOperations('merchants');
    const subscriptionPlansCrud = new CrudOperations('subscription_plans');
    const subscriptionsCrud = new CrudOperations('subscriptions');
    const customersCrud = new CrudOperations('customers');
    const productsCrud = new CrudOperations('products');
    const ordersCrud = new CrudOperations('orders');
    const paymentsCrud = new CrudOperations('payments');

    console.log('🚀 Initialisation de la base de données...');

    // 1. Créer les plans d'abonnement
    const plans = [
      {
        name: 'free',
        display_name: 'Gratuit',
        description: 'Plan gratuit pour débuter',
        price: 0,
        currency: 'FCFA',
        billing_cycle: 'monthly',
        orders_limit: 10,
        features: {
          whatsapp_integration: true,
          basic_analytics: true,
          customer_management: true,
          email_support: false
        },
        is_active: true,
        sort_order: 1
      },
      {
        name: 'standard',
        display_name: 'Standard',
        description: 'Plan standard pour entreprises en croissance',
        price: 5000,
        currency: 'FCFA',
        billing_cycle: 'monthly',
        orders_limit: 500,
        features: {
          whatsapp_integration: true,
          basic_analytics: true,
          customer_management: true,
          email_support: true,
          payment_integration: true,
          advanced_analytics: true
        },
        is_active: true,
        sort_order: 2
      },
      {
        name: 'premium',
        display_name: 'Premium',
        description: 'Plan premium pour entreprises établies',
        price: 10000,
        currency: 'FCFA',
        billing_cycle: 'monthly',
        orders_limit: null,
        features: {
          whatsapp_integration: true,
          advanced_analytics: true,
          api_access: true,
          priority_support: true,
          custom_integrations: true
        },
        is_active: true,
        sort_order: 3
      }
    ];

    for (const plan of plans) {
      try {
        await subscriptionPlansCrud.create(plan);
        console.log(`✅ Plan créé: ${plan.name}`);
      } catch (error) {
        console.log(`ℹ️ Plan ${plan.name} existe déjà`);
      }
    }

    // 2. Créer un profil utilisateur de test
    const testProfile = {
      id: 'user_test_merchant_001',
      email: 'marie@boutique.com',
      password_hash: 'hashed_password123_1234567890',
      full_name: 'Marie Ngono',
      role: 'merchant',
      phone_number: '+237612345678',
      city: 'Yaoundé',
      country: 'Cameroon',
      timezone: 'Africa/Douala',
      language: 'fr',
      is_active: true,
      email_verified: true,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        theme: 'system',
        language: 'fr'
      }
    };

    try {
      await profilesCrud.create(testProfile);
      console.log('✅ Profil utilisateur créé');
    } catch (error) {
      console.log('ℹ️ Profil utilisateur existe déjà');
    }

    // 3. Créer un marchand de test
    const testMerchant = {
      id: 1,
      business_name: 'Boutique Mode Marie',
      whatsapp_number: '+237612345678',
      email: 'marie@boutique.com',
      slug: 'boutique-mode-marie-001',
      subscription_plan: 'premium',
      status: 'active',
      city: 'Yaoundé',
      country: 'Cameroon',
      currency: 'FCFA',
      timezone: 'Africa/Douala',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      settings: {
        notifications: {
          email: true,
          whatsapp: true,
          sms: false
        },
        business: {
          auto_confirm_orders: false,
          require_payment_confirmation: true
        }
      }
    };

    try {
      await merchantsCrud.create(testMerchant);
      console.log('✅ Marchand créé');
    } catch (error) {
      console.log('ℹ️ Marchand existe déjà');
    }

    // 4. Créer l'abonnement
    try {
      await subscriptionsCrud.create({
        merchant_id: 1,
        plan_type: 'premium',
        status: 'active',
        start_date: new Date().toISOString(),
        price: 10000,
        currency: 'FCFA',
        billing_cycle: 'monthly',
        auto_renew: true
      });
      console.log('✅ Abonnement créé');
    } catch (error) {
      console.log('ℹ️ Abonnement existe déjà');
    }

    // 5. Créer des clients de test
    const testCustomers = [
      {
        id: 1,
        merchant_id: 1,
        phone_number: '+237698765432',
        name: 'Jean Mbarga',
        email: 'jean@email.com',
        city: 'Douala',
        total_orders: 3,
        total_spent: 75000,
        last_order_at: new Date().toISOString()
      },
      {
        id: 2,
        merchant_id: 1,
        phone_number: '+237677889900',
        name: 'Grace Bello',
        email: 'grace@email.com',
        city: 'Yaoundé',
        total_orders: 1,
        total_spent: 25000,
        last_order_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        merchant_id: 1,
        phone_number: '+237655443322',
        name: 'Paul Nkomo',
        total_orders: 2,
        total_spent: 45000,
        last_order_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const customer of testCustomers) {
      try {
        await customersCrud.create(customer);
        console.log(`✅ Client créé: ${customer.name}`);
      } catch (error) {
        console.log(`ℹ️ Client ${customer.name} existe déjà`);
      }
    }

    // 6. Créer des produits de test
    const testProducts = [
      {
        id: 1,
        merchant_id: 1,
        name: 'Robe Africaine Premium',
        description: 'Belle robe traditionnelle africaine en tissu wax de qualité',
        price: 25000,
        image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
        category: 'Mode & Vêtements',
        stock_quantity: 15,
        is_active: true,
        sku: 'RAF-001'
      },
      {
        id: 2,
        merchant_id: 1,
        name: 'Ensemble Traditionnel',
        description: 'Ensemble complet avec boubou et pantalon assorti',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=400&fit=crop',
        category: 'Mode & Vêtements',
        stock_quantity: 8,
        is_active: true,
        sku: 'ENS-001'
      },
      {
        id: 3,
        merchant_id: 1,
        name: 'Accessoires Mode',
        description: 'Colliers et bracelets artisanaux',
        price: 15000,
        image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
        category: 'Accessoires',
        stock_quantity: 25,
        is_active: true,
        sku: 'ACC-001'
      }
    ];

    for (const product of testProducts) {
      try {
        await productsCrud.create(product);
        console.log(`✅ Produit créé: ${product.name}`);
      } catch (error) {
        console.log(`ℹ️ Produit ${product.name} existe déjà`);
      }
    }

    // 7. Créer des commandes de test
    const testOrders = [
      {
        id: 1,
        merchant_id: 1,
        customer_id: 1,
        order_number: 'CMD-001-2024',
        items: JSON.stringify([
          { name: 'Robe Africaine Premium', quantity: 1, price: 25000, total: 25000 }
        ]),
        subtotal_amount: 25000,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: 25000,
        currency: 'FCFA',
        status: 'delivered',
        payment_status: 'paid',
        source: 'whatsapp',
        create_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        merchant_id: 1,
        customer_id: 2,
        order_number: 'CMD-002-2024',
        items: JSON.stringify([
          { name: 'Ensemble Traditionnel', quantity: 1, price: 35000, total: 35000 }
        ]),
        subtotal_amount: 35000,
        tax_amount: 0,
        shipping_amount: 2000,
        total_amount: 37000,
        currency: 'FCFA',
        status: 'pending',
        payment_status: 'pending',
        source: 'whatsapp',
        create_time: new Date().toISOString()
      }
    ];

    for (const order of testOrders) {
      try {
        await ordersCrud.create(order);
        console.log(`✅ Commande créée: ${order.order_number}`);
      } catch (error) {
        console.log(`ℹ️ Commande ${order.order_number} existe déjà`);
      }
    }

    // 8. Créer des paiements de test
    const testPayments = [
      {
        id: 1,
        order_id: 1,
        merchant_id: 1,
        amount: 25000,
        currency: 'FCFA',
        provider: 'cinetpay',
        transaction_id: 'TXN-001-2024',
        status: 'completed',
        payment_method: 'mtn_momo',
        customer_phone: '+237698765432',
        processed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const payment of testPayments) {
      try {
        await paymentsCrud.create(payment);
        console.log(`✅ Paiement créé: ${payment.transaction_id}`);
      } catch (error) {
        console.log(`ℹ️ Paiement ${payment.transaction_id} existe déjà`);
      }
    }

    console.log('🎉 Base de données initialisée avec succès !');
    
    return {
      success: true,
      message: 'Base de données initialisée avec des données de test',
      data: {
        profiles: 1,
        merchants: 1,
        customers: testCustomers.length,
        products: testProducts.length,
        orders: testOrders.length,
        payments: testPayments.length
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}
