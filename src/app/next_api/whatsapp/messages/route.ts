
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
const ordersCrud = new CrudOperations('orders');
const customersCrud = new CrudOperations('customers');
const merchantsCrud = new CrudOperations('merchants');
const notificationsCrud = new CrudOperations('notifications');

// Interface pour les messages WhatsApp sortants
interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: any[];
  };
  interactive?: {
    type: string;
    body: {
      text: string;
    };
    action: any;
  };
}

// POST - Envoyer un message WhatsApp
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['to', 'message'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Validation du numéro de téléphone
  const phoneRegex = /^\+237[0-9]{9}$/;
  if (!phoneRegex.test(body.to)) {
    return errorResponse('Format de numéro WhatsApp invalide (ex: +237612345678)', 400);
  }

  try {
    // Construire le message WhatsApp
    const whatsappMessage: WhatsAppMessage = {
      to: body.to,
      type: body.type || 'text'
    };

    if (body.type === 'text' || !body.type) {
      whatsappMessage.text = {
        body: body.message
      };
    } else if (body.type === 'template') {
      whatsappMessage.template = {
        name: body.template_name || 'order_confirmation',
        language: {
          code: body.language || 'fr'
        },
        components: body.components || []
      };
    } else if (body.type === 'interactive') {
      whatsappMessage.interactive = {
        type: body.interactive_type || 'button',
        body: {
          text: body.message
        },
        action: body.action || {}
      };
    }

    // Simuler l'envoi via WhatsApp Business API
    // Dans un vrai système, on utiliserait l'API WhatsApp Business
    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
    
    // Enregistrer la notification
    const notification = await notificationsCrud.create({
      merchant_id: body.merchant_id || null,
      customer_id: body.customer_id || null,
      order_id: body.order_id || null,
      type: body.notification_type || 'whatsapp_message',
      channel: 'whatsapp',
      recipient: body.to,
      subject: body.subject || null,
      message: body.message,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: JSON.stringify({
        whatsapp_message_id: messageId,
        message_type: body.type || 'text',
        template_name: body.template_name || null
      })
    });

    console.log(`Message WhatsApp envoyé: ${messageId} vers ${body.to}`);
    
    return successResponse({
      message_id: messageId,
      status: 'sent',
      to: body.to,
      notification_id: notification.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
    
    // Enregistrer l'échec de notification
    try {
      await notificationsCrud.create({
        merchant_id: body.merchant_id || null,
        customer_id: body.customer_id || null,
        order_id: body.order_id || null,
        type: body.notification_type || 'whatsapp_message',
        channel: 'whatsapp',
        recipient: body.to,
        subject: body.subject || null,
        message: body.message,
        status: 'failed',
        error_message: error.message,
        metadata: JSON.stringify({
          error_details: error.message,
          attempted_at: new Date().toISOString()
        })
      });
    } catch (notifError) {
      console.error('Erreur lors de l\'enregistrement de l\'échec:', notifError);
    }
    
    throw error;
  }
});

// GET - Récupérer l'historique des messages
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const merchant_id = searchParams.get('merchant_id');
  const customer_phone = searchParams.get('customer_phone');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  logApiRequest(request, { merchant_id, customer_phone, limit, offset });

  // Construire les filtres pour les notifications WhatsApp
  const filters: Record<string, any> = {
    channel: 'whatsapp'
  };
  
  if (merchant_id) {
    filters.merchant_id = merchant_id;
  }
  
  if (customer_phone) {
    filters.recipient = customer_phone;
  }

  const notifications = await notificationsCrud.findMany(filters, limit, offset);
  
  // Formater les données pour l'historique des messages
  const messages = notifications?.map((notif: any) => {
    let metadata = {};
    try {
      metadata = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata || {};
    } catch (e) {
      console.warn('Erreur lors du parsing des métadonnées:', e);
    }
    
    return {
      id: notif.id,
      message_id: (metadata as any).whatsapp_message_id || null,
      to: notif.recipient,
      message: notif.message,
      type: (metadata as any).message_type || 'text',
      status: notif.status,
      sent_at: notif.sent_at,
      delivered_at: notif.delivered_at,
      error_message: notif.error_message,
      merchant_id: notif.merchant_id,
      customer_id: notif.customer_id,
      order_id: notif.order_id
    };
  }) || [];

  return successResponse({
    messages,
    total: messages.length,
    limit,
    offset
  });
});
