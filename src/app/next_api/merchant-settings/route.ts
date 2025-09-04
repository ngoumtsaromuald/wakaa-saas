
import { NextRequest } from 'next/server';
import { 
  CrudOperations, 
  withErrorHandling, 
  parseQueryParams, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Créer une instance CRUD pour la table merchant_settings
const merchantSettingsCrud = new CrudOperations('merchant_settings');

// GET - Récupérer les paramètres d'un marchand
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { merchant_id } = parseQueryParams(request);
  logApiRequest(request, { merchant_id });

  if (!merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  // Récupérer les paramètres du marchand
  const settings = await merchantSettingsCrud.findMany({ merchant_id });
  
  if (!settings || settings.length === 0) {
    // Créer des paramètres par défaut si aucun n'existe
    const defaultSettings = {
      merchant_id: parseInt(merchant_id),
      notification_preferences: {
        email: true,
        whatsapp: true,
        sms: false
      },
      business_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '18:00', closed: false },
        sunday: { open: '08:00', close: '18:00', closed: true }
      },
      auto_reply_enabled: true,
      auto_reply_message: 'Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.',
      order_confirmation_template: 'Votre commande #{order_number} a été confirmée. Montant: {total_amount} FCFA',
      payment_reminder_template: 'Rappel: Votre commande #{order_number} est en attente de paiement.',
      delivery_notification_template: 'Votre commande #{order_number} a été expédiée !',
      tax_rate: 0,
      shipping_fee: 0,
      minimum_order_amount: 0
    };
    
    const newSettings = await merchantSettingsCrud.create(defaultSettings);
    return successResponse(newSettings);
  }

  return successResponse(settings[0]);
});

// POST - Créer des paramètres pour un marchand
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  if (!body.merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  // Vérifier si des paramètres existent déjà
  const existingSettings = await merchantSettingsCrud.findMany({ 
    merchant_id: body.merchant_id 
  });
  
  if (existingSettings && existingSettings.length > 0) {
    return errorResponse('Des paramètres existent déjà pour ce marchand', 409);
  }

  const data = await merchantSettingsCrud.create(body);
  return successResponse(data, 201);
});

// PUT - Mettre à jour les paramètres d'un marchand
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { merchant_id } = parseQueryParams(request);
  
  if (!merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  const body = await validateRequestBody(request);
  
  // Vérifier que les paramètres existent
  const existingSettings = await merchantSettingsCrud.findMany({ 
    merchant_id: parseInt(merchant_id) 
  });
  
  if (!existingSettings || existingSettings.length === 0) {
    return errorResponse('Paramètres non trouvés', 404);
  }

  // Mettre à jour modify_time
  const updateData = {
    ...body,
    modify_time: new Date().toISOString()
  };

  const data = await merchantSettingsCrud.update(existingSettings[0].id, updateData);
  return successResponse(data);
});

// DELETE - Réinitialiser les paramètres aux valeurs par défaut
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { merchant_id } = parseQueryParams(request);

  if (!merchant_id) {
    return errorResponse('ID du marchand requis', 400);
  }

  // Vérifier que les paramètres existent
  const existingSettings = await merchantSettingsCrud.findMany({ 
    merchant_id: parseInt(merchant_id) 
  });
  
  if (!existingSettings || existingSettings.length === 0) {
    return errorResponse('Paramètres non trouvés', 404);
  }

  // Réinitialiser aux valeurs par défaut
  const defaultSettings = {
    notification_preferences: {
      email: true,
      whatsapp: true,
      sms: false
    },
    business_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: true }
    },
    auto_reply_enabled: true,
    auto_reply_message: 'Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.',
    order_confirmation_template: 'Votre commande #{order_number} a été confirmée. Montant: {total_amount} FCFA',
    payment_reminder_template: 'Rappel: Votre commande #{order_number} est en attente de paiement.',
    delivery_notification_template: 'Votre commande #{order_number} a été expédiée !',
    tax_rate: 0,
    shipping_fee: 0,
    minimum_order_amount: 0,
    modify_time: new Date().toISOString()
  };

  const data = await merchantSettingsCrud.update(existingSettings[0].id, defaultSettings);
  return successResponse(data);
});
