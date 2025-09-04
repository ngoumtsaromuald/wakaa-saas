
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
const paymentsCrud = new CrudOperations('payments');
const ordersCrud = new CrudOperations('orders');

// Interface pour les liens de paiement CinetPay
interface CinetPayPaymentLink {
  amount: number;
  currency: string;
  transaction_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  description: string;
  return_url?: string;
  notify_url?: string;
  custom_data?: any;
}

// POST - Créer un lien de paiement CinetPay
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['order_id', 'amount', 'customer_phone'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du montant
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return errorResponse('Le montant doit être un nombre positif', 400);
  }

  // Validation du numéro de téléphone
  const phoneRegex = /^\+237[0-9]{9}$/;
  if (!phoneRegex.test(body.customer_phone)) {
    return errorResponse('Format de numéro de téléphone invalide', 400);
  }

  try {
    // Vérifier que la commande existe
    const order = await ordersCrud.findById(body.order_id);
    if (!order) {
      return errorResponse('Commande non trouvée', 404);
    }

    // Générer un ID de transaction unique
    const transaction_id = `WAKAA_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Préparer les données pour CinetPay
    const paymentData: CinetPayPaymentLink = {
      amount: body.amount,
      currency: body.currency || 'XAF', // Franc CFA
      transaction_id,
      customer_name: body.customer_name || 'Client Wakaa',
      customer_email: body.customer_email || null,
      customer_phone: body.customer_phone,
      description: body.description || `Paiement commande ${order.order_number}`,
      return_url: body.return_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/next_api/webhooks/cinetpay`,
      custom_data: {
        order_id: body.order_id,
        merchant_id: order.merchant_id,
        wakaa_payment: true
      }
    };

    // Simuler l'appel à l'API CinetPay
    // Dans un vrai système, on ferait un appel HTTP à l'API CinetPay
    const cinetpayResponse = {
      code: '201',
      message: 'CREATED',
      data: {
        payment_token: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`,
        payment_url: `https://checkout.cinetpay.com/payment/${transaction_id}`,
        transaction_id: transaction_id
      },
      api_response_id: Date.now()
    };

    // Créer l'enregistrement de paiement
    const payment = await paymentsCrud.create({
      order_id: body.order_id,
      merchant_id: order.merchant_id,
      amount: body.amount,
      currency: paymentData.currency,
      provider: 'cinetpay',
      transaction_id: transaction_id,
      status: 'pending',
      payment_method: body.payment_method || 'mobile_money',
      customer_phone: body.customer_phone,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      webhook_data: JSON.stringify({
        cinetpay_token: cinetpayResponse.data.payment_token,
        custom_data: paymentData.custom_data
      })
    });

    // Mettre à jour la commande avec l'ID de paiement
    await ordersCrud.update(body.order_id, {
      payment_id: payment.id,
      modify_time: new Date().toISOString()
    });

    console.log(`Lien de paiement CinetPay créé: ${transaction_id}`);
    
    return successResponse({
      payment_id: payment.id,
      transaction_id: transaction_id,
      payment_url: cinetpayResponse.data.payment_url,
      payment_token: cinetpayResponse.data.payment_token,
      amount: body.amount,
      currency: paymentData.currency,
      expires_at: payment.expires_at,
      status: 'pending',
      created_at: payment.create_time
    }, 201);
    
  } catch (error: any) {
    console.error('Erreur lors de la création du lien de paiement CinetPay:', error);
    throw error;
  }
});

// GET - Vérifier le statut d'un paiement
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const transaction_id = searchParams.get('transaction_id');
  const payment_id = searchParams.get('payment_id');
  
  logApiRequest(request, { transaction_id, payment_id });

  if (!transaction_id && !payment_id) {
    return errorResponse('transaction_id ou payment_id requis', 400);
  }

  try {
    let payment;
    
    if (payment_id) {
      payment = await paymentsCrud.findById(payment_id);
    } else if (transaction_id) {
      const payments = await paymentsCrud.findMany({ transaction_id });
      payment = payments && payments.length > 0 ? payments[0] : null;
    }

    if (!payment) {
      return errorResponse('Paiement non trouvé', 404);
    }

    // Simuler la vérification du statut via l'API CinetPay
    // Dans un vrai système, on ferait un appel à l'API CinetPay pour vérifier le statut
    const statusCheckResponse = {
      code: '00',
      message: 'SUCCES',
      data: {
        cpm_site_id: process.env.CINETPAY_SITE_ID,
        cpm_trans_id: payment.transaction_id,
        cpm_trans_date: payment.create_time,
        cpm_amount: payment.amount,
        cpm_currency: payment.currency,
        cpm_payid: payment.external_transaction_id || null,
        cpm_payment_config: 'SINGLE_PAYEMENT',
        cpm_language: 'fr',
        cpm_version: 'v2',
        cpm_payment_method: payment.payment_method,
        cpm_phone_prefixe: '+237',
        cel_phone_num: payment.customer_phone,
        cpm_ipn_ack: 'Oui',
        created_at: payment.create_time,
        updated_at: payment.modify_time,
        cpm_result: payment.status === 'completed' ? '00' : '01',
        cpm_trans_status: payment.status === 'completed' ? 'ACCEPTED' : 
                         payment.status === 'failed' ? 'REFUSED' : 'PENDING'
      }
    };

    return successResponse({
      payment_id: payment.id,
      transaction_id: payment.transaction_id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      customer_phone: payment.customer_phone,
      created_at: payment.create_time,
      processed_at: payment.processed_at,
      cinetpay_status: statusCheckResponse.data.cpm_trans_status,
      cinetpay_result: statusCheckResponse.data.cpm_result
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la vérification du statut de paiement:', error);
    throw error;
  }
});

// PUT - Annuler un paiement
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  const searchParams = request.nextUrl.searchParams;
  const payment_id = searchParams.get('payment_id');
  
  if (!payment_id) {
    return errorResponse('payment_id requis', 400);
  }

  try {
    // Vérifier que le paiement existe
    const payment = await paymentsCrud.findById(payment_id);
    if (!payment) {
      return errorResponse('Paiement non trouvé', 404);
    }

    // Vérifier que le paiement peut être annulé
    if (['completed', 'refunded', 'cancelled'].includes(payment.status)) {
      return errorResponse('Ce paiement ne peut pas être annulé', 400);
    }

    // Mettre à jour le statut du paiement
    const updatedPayment = await paymentsCrud.update(payment_id, {
      status: 'cancelled',
      modify_time: new Date().toISOString()
    });

    // Mettre à jour la commande associée
    if (payment.order_id) {
      await ordersCrud.update(payment.order_id, {
        payment_status: 'cancelled',
        modify_time: new Date().toISOString()
      });
    }

    console.log(`Paiement CinetPay annulé: ${payment.transaction_id}`);
    
    return successResponse({
      payment_id: updatedPayment.id,
      transaction_id: updatedPayment.transaction_id,
      status: updatedPayment.status,
      cancelled_at: updatedPayment.modify_time
    });
    
  } catch (error: any) {
    console.error('Erreur lors de l\'annulation du paiement:', error);
    throw error;
  }
});
