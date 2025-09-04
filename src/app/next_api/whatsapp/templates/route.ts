
import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// Templates WhatsApp prédéfinis pour Wakaa
const whatsappTemplates = {
  order_confirmation: {
    name: 'order_confirmation',
    category: 'TRANSACTIONAL',
    language: 'fr',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Confirmation de Commande'
      },
      {
        type: 'BODY',
        text: 'Bonjour {{1}},\n\nVotre commande {{2}} a été confirmée !\n\nMontant: {{3}} FCFA\nStatut: En préparation\n\nMerci pour votre confiance !'
      },
      {
        type: 'FOOTER',
        text: 'Wakaa - Votre assistant business'
      }
    ]
  },
  payment_reminder: {
    name: 'payment_reminder',
    category: 'TRANSACTIONAL',
    language: 'fr',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Rappel de Paiement'
      },
      {
        type: 'BODY',
        text: 'Bonjour {{1}},\n\nVotre commande {{2}} est en attente de paiement.\n\nMontant: {{3}} FCFA\n\nCliquez sur le lien pour payer: {{4}}'
      },
      {
        type: 'FOOTER',
        text: 'Paiement sécurisé via CinetPay'
      }
    ]
  },
  order_shipped: {
    name: 'order_shipped',
    category: 'TRANSACTIONAL',
    language: 'fr',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Commande Expédiée'
      },
      {
        type: 'BODY',
        text: 'Excellente nouvelle {{1}} !\n\nVotre commande {{2}} a été expédiée.\n\nNuméro de suivi: {{3}}\nLivraison prévue: {{4}}\n\nVous recevrez une notification à la livraison.'
      },
      {
        type: 'FOOTER',
        text: 'Wakaa - Suivi en temps réel'
      }
    ]
  },
  order_delivered: {
    name: 'order_delivered',
    category: 'TRANSACTIONAL',
    language: 'fr',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '✅ Commande Livrée'
      },
      {
        type: 'BODY',
        text: 'Parfait {{1}} !\n\nVotre commande {{2}} a été livrée avec succès.\n\nNous espérons que vous êtes satisfait(e) de votre achat.\n\nN\'hésitez pas à nous laisser un avis !'
      },
      {
        type: 'FOOTER',
        text: 'Merci de votre confiance'
      }
    ]
  },
  welcome_message: {
    name: 'welcome_message',
    category: 'MARKETING',
    language: 'fr',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Bienvenue chez {{1}} !'
      },
      {
        type: 'BODY',
        text: 'Bonjour et bienvenue !\n\nMerci de nous avoir contactés. Nous sommes là pour vous aider.\n\nPour passer une commande, envoyez-nous simplement:\n- Le nom du produit\n- La quantité souhaitée\n- Votre adresse de livraison\n\nNous vous répondrons rapidement !'
      },
      {
        type: 'FOOTER',
        text: 'Service client disponible 7j/7'
      }
    ]
  },
  subscription_expiring: {
    name: 'subscription_expiring',
    category: 'TRANSACTIONAL',
    language: 'fr',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '⚠️ Abonnement Wakaa'
      },
      {
        type: 'BODY',
        text: 'Bonjour {{1}},\n\nVotre abonnement {{2}} expire dans {{3}} jours.\n\nPour continuer à profiter de tous nos services, renouvelez dès maintenant.\n\nLien de renouvellement: {{4}}'
      },
      {
        type: 'FOOTER',
        text: 'Wakaa - Ne perdez pas vos données'
      }
    ]
  }
};

// GET - Récupérer les templates disponibles
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const language = searchParams.get('language') || 'fr';
  
  logApiRequest(request, { category, language });

  let templates = Object.values(whatsappTemplates);

  // Filtrer par catégorie si spécifiée
  if (category) {
    templates = templates.filter(template => 
      template.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filtrer par langue
  templates = templates.filter(template => template.language === language);

  return successResponse({
    templates,
    total: templates.length,
    categories: ['TRANSACTIONAL', 'MARKETING', 'UTILITY'],
    languages: ['fr', 'en']
  });
});

// POST - Envoyer un message avec template
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // Validation des champs obligatoires
  const requiredFields = ['to', 'template_name', 'parameters'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return errorResponse(`Le champ ${field} est obligatoire`, 400);
    }
  }

  // Vérifier que le template existe
  const template = whatsappTemplates[body.template_name as keyof typeof whatsappTemplates];
  if (!template) {
    return errorResponse('Template non trouvé', 404);
  }

  // Validation du numéro de téléphone
  const phoneRegex = /^\+237[0-9]{9}$/;
  if (!phoneRegex.test(body.to)) {
    return errorResponse('Format de numéro WhatsApp invalide', 400);
  }

  // Validation des paramètres
  if (!Array.isArray(body.parameters)) {
    return errorResponse('Les paramètres doivent être un tableau', 400);
  }

  try {
    // Construire le message avec template
    const templateMessage = {
      messaging_product: 'whatsapp',
      to: body.to,
      type: 'template',
      template: {
        name: template.name,
        language: {
          code: template.language
        },
        components: [
          {
            type: 'body',
            parameters: body.parameters.map((param: any, index: number) => ({
              type: 'text',
              text: String(param)
            }))
          }
        ]
      }
    };

    // Simuler l'envoi via WhatsApp Business API
    const messageId = `wamid.template_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
    
    console.log(`Template WhatsApp envoyé: ${template.name} vers ${body.to}`);
    console.log('Paramètres:', body.parameters);
    
    return successResponse({
      message_id: messageId,
      status: 'sent',
      to: body.to,
      template_name: template.name,
      parameters: body.parameters,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du template WhatsApp:', error);
    throw error;
  }
});

// PUT - Personnaliser un template (pour les marchands)
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  const searchParams = request.nextUrl.searchParams;
  const template_name = searchParams.get('template_name');
  
  if (!template_name) {
    return errorResponse('Nom du template requis', 400);
  }

  // Vérifier que le template existe
  const template = whatsappTemplates[template_name as keyof typeof whatsappTemplates];
  if (!template) {
    return errorResponse('Template non trouvé', 404);
  }

  // Dans un vrai système, on sauvegarderait les personnalisations en base
  // Pour la démo, on retourne le template modifié
  const customizedTemplate = {
    ...template,
    customizations: {
      merchant_id: body.merchant_id,
      custom_header: body.custom_header || null,
      custom_footer: body.custom_footer || null,
      custom_variables: body.custom_variables || {},
      modified_at: new Date().toISOString()
    }
  };

  return successResponse({
    template: customizedTemplate,
    message: 'Template personnalisé avec succès'
  });
});
