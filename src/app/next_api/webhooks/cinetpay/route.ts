
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
const paymentsCrud = new CrudOperations('payments');
const ordersCrud = new CrudOperations('orders');

// Interface pour les webhooks CinetPay
interface CinetPayWebhook {
  cpm_trans_id: string;
  cpm_site_id: string;
  cpm_amount: string;
  cpm_currency: string;
  signature: string;
  payment_method: string;
  cel_phone_num?: string;
  cpm_phone_prefixe?: string;
  cpm_language: string;
  cpm_version: string;
  cpm_payment_config: string;
  cpm_page_action: string;
  cpm_custom: string;
  cpm_result: string;
  cpm_trans_status: string;
  cpm_designation: string;
  cpm_error_message?: string;
}

// Fonction pour vérifier la signature CinetPay
function verifyCinetPaySignature(data: CinetPayWebhook, apiKey: string): boolean {
  // Dans un vrai système, on implémenterait la vérification de signature CinetPay
  // La signature est généralement un hash des paramètres + clé API
  
  // Pour la démo, on accepte toutes les signatures
  // TODO: Implémenter la vraie vérification de signature
  return true;
}

// POST - Traitement des webhooks CinetPay
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Enregistrer le webhook dans les logs
  const webhookLog = await webhooksLogCrud.create({
    source: 'cinetpay',
    event_type: 'payment_notification',
    payload: JSON.stringify(body),
    headers: JSON.stringify(Object.fromEntries(request.headers.entries())),
    status: 'received',
    signature_verified: false
  });
  
  try {
    const webhookData: CinetPayWebhook = body;
    
    // Vérifier les champs obligatoires
    const requiredFields = ['cpm_trans_id', 'cpm_site_id', 'cpm_amount', 'cpm_result', 'cpm_trans_status'];
    for (const field of requiredFields) {
      if (!webhookData[field as keyof CinetPayWebhook]) {
        throw new Error(`Champ obligatoire manquant: ${field}`);
      }
    }
    
    // Vérifier la signature
    const apiKey = process.env.CINETPAY_API_KEY || '';
    const isSignatureValid = verifyCinetPaySignature(webhookData, apiKey);
    
    if (!isSignatureValid) {
      throw new Error('Signature invalide');
    }
    
    // Mettre à jour le log avec la vérification de signature
    await webhooksLogCrud.update(webhookLog.id, {
      signature_verified: true
    });
    
    // Traiter la notification de paiement
    await processPaymentNotification(webhookData, webhookLog.id);
    
    // Mettre à jour le log comme traité
    await webhooksLogCrud.update(webhookLog.id, {
      status: 'processed',
      processed_at: new Date().toISOString()
    });
    
    return successResponse({ message: 'Webhook CinetPay traité avec succès' });
    
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook CinetPay:', error);
    
    // Mettre à jour le log avec l'erreur
    await webhooksLogCrud.update(webhookLog.id, {
      status: 'failed',
      error_message: error.message,
      processed_at: new Date().toISOString()
    });
    
    throw error;
  }
});

// Fonction pour traiter une notification de paiement
async function processPaymentNotification(data: CinetPayWebhook, webhookLogId: number) {
  try {
    const transactionId = data.cpm_trans_id;
    const amount = parseFloat(data.cpm_amount);
    const status = data.cpm_trans_status;
    const result = data.cpm_result;
    
    // Trouver le paiement correspondant
    const payments = await paymentsCrud.findMany({
      transaction_id: transactionId
    });
    
    if (!payments || payments.length === 0) {
      // Créer un nouveau paiement si non trouvé (cas de paiement direct)
      console.warn(`Paiement non trouvé pour la transaction ${transactionId}, création d'un nouveau paiement`);
      
      // Dans ce cas, on devrait avoir l'order_id dans cpm_custom
      const customData = data.cpm_custom ? JSON.parse(data.cpm_custom) : {};
      const orderId = customData.order_id;
      
      if (!orderId) {
        throw new Error('Impossible de déterminer la commande associée au paiement');
      }
      
      // Vérifier que la commande existe
      const order = await ordersCrud.findById(orderId);
      if (!order) {
        throw new Error(`Commande ${orderId} non trouvée`);
      }
      
      // Créer le paiement
      const payment = await paymentsCrud.create({
        order_id: orderId,
        merchant_id: order.merchant_id,
        amount: amount,
        currency: data.cpm_currency || 'FCFA',
        provider: 'cinetpay',
        transaction_id: transactionId,
        external_transaction_id: transactionId,
        status: mapCinetPayStatus(status, result),
        payment_method: data.payment_method,
        customer_phone: data.cel_phone_num,
        webhook_data: JSON.stringify(data),
        processed_at: new Date().toISOString()
      });
      
      // Mettre à jour le log avec l'ID du paiement
      await webhooksLogCrud.update(webhookLogId, {
        payment_id: payment.id
      });
      
      // Mettre à jour la commande
      await updateOrderPaymentStatus(order, payment, data);
      
    } else {
      // Mettre à jour le paiement existant
      const payment = payments[0];
      
      const updatedPayment = await paymentsCrud.update(payment.id, {
        status: mapCinetPayStatus(status, result),
        external_transaction_id: transactionId,
        payment_method: data.payment_method,
        customer_phone: data.cel_phone_num,
        webhook_data: JSON.stringify(data),
        processed_at: new Date().toISOString(),
        failure_reason: data.cpm_error_message || null
      });
      
      // Mettre à jour le log avec l'ID du paiement
      await webhooksLogCrud.update(webhookLogId, {
        payment_id: payment.id
      });
      
      // Récupérer la commande associée
      const order = await ordersCrud.findById(payment.order_id);
      if (order) {
        await updateOrderPaymentStatus(order, updatedPayment, data);
      }
    }
    
    console.log(`Paiement CinetPay traité: ${transactionId} - Statut: ${status}`);
    
  } catch (error) {
    console.error('Erreur lors du traitement de la notification de paiement:', error);
    throw error;
  }
}

// Fonction pour mapper les statuts CinetPay vers nos statuts internes
function mapCinetPayStatus(transStatus: string, result: string): string {
  // Mapping des statuts CinetPay
  if (result === '00' && transStatus === 'ACCEPTED') {
    return 'completed';
  } else if (transStatus === 'PENDING') {
    return 'processing';
  } else if (transStatus === 'REFUSED' || result !== '00') {
    return 'failed';
  } else {
    return 'pending';
  }
}

// Fonction pour mettre à jour le statut de paiement de la commande
async function updateOrderPaymentStatus(order: any, payment: any, webhookData: CinetPayWebhook) {
  try {
    let newOrderStatus = order.status;
    let newPaymentStatus = payment.status;
    
    // Logique de mise à jour du statut de la commande
    if (payment.status === 'completed') {
      newPaymentStatus = 'paid';
      if (order.status === 'pending') {
        newOrderStatus = 'paid';
      }
    } else if (payment.status === 'failed') {
      newPaymentStatus = 'failed';
      // La commande reste en pending pour permettre un nouveau paiement
    }
    
    // Mettre à jour la commande
    await ordersCrud.update(order.id, {
      status: newOrderStatus,
      payment_status: newPaymentStatus,
      payment_id: payment.id
    });
    
    console.log(`Commande ${order.order_number} mise à jour: ${newOrderStatus} / ${newPaymentStatus}`);
    
    // TODO: Envoyer des notifications
    // - Notification au marchand
    // - Notification au client (WhatsApp/SMS)
    // - Mise à jour des statistiques
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    throw error;
  }
}

// GET - Endpoint pour tester la connectivité (optionnel)
export const GET = withErrorHandling(async (request: NextRequest) => {
  return successResponse({ 
    message: 'Endpoint webhook CinetPay actif',
    timestamp: new Date().toISOString()
  });
});
