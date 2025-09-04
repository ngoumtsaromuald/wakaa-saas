
import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { CrudOperations } from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Instances CRUD pour les tables nécessaires
const webhooksLogCrud = new CrudOperations('webhooks_log');
const ordersCrud = new CrudOperations('orders');
const customersCrud = new CrudOperations('customers');
const merchantsCrud = new CrudOperations('merchants');

// Interface pour les messages WhatsApp
interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Fonction pour parser les commandes depuis un message WhatsApp
function parseOrderFromMessage(message: string, customerPhone: string): any {
  // Parser intelligent basique - dans un vrai système, on utiliserait du NLP
  const lines = message.toLowerCase().split('\n').map(line => line.trim());
  
  const items: any[] = [];
  let customerInfo: any = {};
  let deliveryAddress = '';
  
  // Rechercher des patterns de commande
  for (const line of lines) {
    // Pattern pour les articles: "2x robe africaine" ou "robe africaine x2"
    const itemMatch = line.match(/(\d+)\s*x?\s*(.+)|(.+)\s*x\s*(\d+)/i);
    if (itemMatch) {
      const quantity = parseInt(itemMatch[1] || itemMatch[4]);
      const itemName = (itemMatch[2] || itemMatch[3]).trim();
      
      if (quantity && itemName) {
        items.push({
          name: itemName,
          quantity: quantity,
          price: 15000, // Prix par défaut - dans un vrai système, on rechercherait dans le catalogue
          total: quantity * 15000
        });
      }
    }
    
    // Pattern pour l'adresse
    if (line.includes('adresse') || line.includes('livraison') || line.includes('quartier')) {
      deliveryAddress = line.replace(/adresse|livraison|quartier/gi, '').replace(':', '').trim();
    }
    
    // Pattern pour le nom
    if (line.includes('nom') || line.includes('je suis')) {
      customerInfo.name = line.replace(/nom|je suis/gi, '').replace(':', '').trim();
    }
  }
  
  // Si aucun article trouvé, essayer de parser le message entier comme une commande simple
  if (items.length === 0) {
    // Rechercher des mots-clés de produits
    const productKeywords = ['robe', 'ensemble', 'chaussure', 'sac', 'bijou', 'accessoire'];
    const foundProduct = productKeywords.find(keyword => message.toLowerCase().includes(keyword));
    
    if (foundProduct) {
      items.push({
        name: `${foundProduct} (à préciser)`,
        quantity: 1,
        price: 15000,
        total: 15000
      });
    }
  }
  
  return {
    items,
    customerInfo: {
      ...customerInfo,
      phone: customerPhone
    },
    deliveryAddress,
    totalAmount: items.reduce((sum, item) => sum + item.total, 0)
  };
}

// GET - Vérification du webhook (pour la configuration WhatsApp)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  // Token de vérification WhatsApp (devrait être en variable d'environnement)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'wakaa_webhook_token';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook WhatsApp vérifié avec succès');
    return new Response(challenge, { status: 200 });
  }
  
  return errorResponse('Token de vérification invalide', 403);
});

// POST - Traitement des webhooks WhatsApp
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Enregistrer le webhook dans les logs
  const webhookLog = await webhooksLogCrud.create({
    source: 'whatsapp',
    event_type: 'message_received',
    payload: JSON.stringify(body),
    headers: JSON.stringify(Object.fromEntries(request.headers.entries())),
    status: 'received',
    signature_verified: true // Dans un vrai système, on vérifierait la signature
  });
  
  try {
    const webhookData: WhatsAppWebhook = body;
    
    // Vérifier que c'est un webhook WhatsApp valide
    if (webhookData.object !== 'whatsapp_business_account') {
      throw new Error('Type de webhook non supporté');
    }
    
    // Traiter chaque entrée
    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value.messages) {
          // Traiter les messages reçus
          for (const message of change.value.messages) {
            await processIncomingMessage(message, change.value.metadata);
          }
        }
        
        if (change.field === 'messages' && change.value.statuses) {
          // Traiter les statuts de messages (livré, lu, etc.)
          for (const status of change.value.statuses) {
            await processMessageStatus(status);
          }
        }
      }
    }
    
    // Mettre à jour le log comme traité
    await webhooksLogCrud.update(webhookLog.id, {
      status: 'processed',
      processed_at: new Date().toISOString()
    });
    
    return successResponse({ message: 'Webhook traité avec succès' });
    
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook WhatsApp:', error);
    
    // Mettre à jour le log avec l'erreur
    await webhooksLogCrud.update(webhookLog.id, {
      status: 'failed',
      error_message: error.message,
      processed_at: new Date().toISOString()
    });
    
    throw error;
  }
});

// Fonction pour traiter un message entrant
async function processIncomingMessage(message: WhatsAppMessage, metadata: any) {
  try {
    // Ignorer les messages non textuels pour l'instant
    if (message.type !== 'text' || !message.text?.body) {
      return;
    }
    
    const customerPhone = message.from;
    const messageText = message.text.body;
    const businessPhone = metadata.display_phone_number;
    
    // Trouver le marchand correspondant au numéro WhatsApp Business
    const merchants = await merchantsCrud.findMany({ whatsapp_number: businessPhone });
    if (!merchants || merchants.length === 0) {
      console.warn(`Aucun marchand trouvé pour le numéro ${businessPhone}`);
      return;
    }
    
    const merchant = merchants[0];
    
    // Trouver ou créer le client
    let customers = await customersCrud.findMany({
      merchant_id: merchant.id,
      phone_number: customerPhone
    });
    
    let customer;
    if (!customers || customers.length === 0) {
      // Créer un nouveau client
      customer = await customersCrud.create({
        merchant_id: merchant.id,
        phone_number: customerPhone,
        name: `Client ${customerPhone.slice(-4)}`, // Nom temporaire
        total_orders: 0,
        total_spent: 0
      });
    } else {
      customer = customers[0];
    }
    
    // Parser le message pour extraire une commande potentielle
    const parsedOrder = parseOrderFromMessage(messageText, customerPhone);
    
    // Si des articles ont été détectés, créer une commande
    if (parsedOrder.items.length > 0) {
      const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const order = await ordersCrud.create({
        merchant_id: merchant.id,
        customer_id: customer.id,
        order_number: orderNumber,
        items: JSON.stringify(parsedOrder.items),
        subtotal_amount: parsedOrder.totalAmount,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: parsedOrder.totalAmount,
        currency: 'FCFA',
        status: 'pending',
        payment_status: 'pending',
        source: 'whatsapp',
        whatsapp_message_id: message.id,
        shipping_address: parsedOrder.deliveryAddress ? JSON.stringify({
          address: parsedOrder.deliveryAddress,
          city: '',
          country: 'Cameroon'
        }) : null,
        notes: `Commande automatique depuis WhatsApp: ${messageText}`
      });
      
      // Mettre à jour les statistiques du client
      await customersCrud.update(customer.id, {
        total_orders: (customer.total_orders || 0) + 1,
        last_order_at: new Date().toISOString(),
        name: parsedOrder.customerInfo.name || customer.name
      });
      
      console.log(`Commande créée automatiquement: ${orderNumber} pour ${customer.phone_number}`);
      
      // TODO: Envoyer une notification au marchand
      // TODO: Envoyer un message de confirmation au client
    } else {
      console.log(`Message reçu mais aucune commande détectée: ${messageText}`);
      // TODO: Enregistrer le message pour traitement manuel
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement du message:', error);
    throw error;
  }
}

// Fonction pour traiter les statuts de messages
async function processMessageStatus(status: any) {
  try {
    console.log(`Statut de message reçu: ${status.id} - ${status.status}`);
    // TODO: Mettre à jour le statut des notifications envoyées
  } catch (error) {
    console.error('Erreur lors du traitement du statut:', error);
  }
}
