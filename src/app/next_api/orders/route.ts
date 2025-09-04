
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
import { 
  withAuth,
  AuthUser 
} from '@/lib/auth-middleware';
import { withOrderLimitCheck } from '@/lib/subscription-middleware';

// Créer une instance CRUD pour la table orders
const ordersCrud = new CrudOperations('orders');

// GET - Récupérer les commandes
export const GET = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { limit, offset, search } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    
    // Paramètres de filtrage spécifiques aux commandes
    const merchant_id = searchParams.get('merchant_id');
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    
    logApiRequest(request, { limit, offset, search, merchant_id, status, payment_status, userRole: user.role });

    // Construire les filtres
    const filters: Record<string, any> = {};
    
    // Les marchands ne peuvent voir que leurs propres commandes
    if (user.role === 'merchant') {
      filters.merchant_id = user.id;
    } else if (merchant_id) {
      // Les admins peuvent filtrer par marchand
      filters.merchant_id = merchant_id;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (payment_status) {
      filters.payment_status = payment_status;
    }

    if (search) {
      // Recherche par numéro de commande
      filters.order_number = search;
    }

    const data = await ordersCrud.findMany(filters, limit, offset);
    return successResponse(data);
  },
  { requiredRoles: ['merchant', 'admin', 'super_admin', 'support'] }
);

// POST - Créer une nouvelle commande (avec vérification des limites d'abonnement)
export const POST = withAuth(
  withOrderLimitCheck(async (request: NextRequest, user: AuthUser) => {
    const body = await validateRequestBody(request);
    logApiRequest(request, { userRole: user.role, userId: user.id });
    
    // Validation des champs obligatoires
    const requiredFields = ['customer_id', 'items', 'total_amount'];
    
    // Pour les marchands, merchant_id est automatiquement défini
    if (user.role !== 'merchant') {
      requiredFields.push('merchant_id');
    }
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`Le champ ${field} est obligatoire`, 400);
      }
    }

    // Validation des items (doit être un array non vide)
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('La commande doit contenir au moins un article', 400);
    }

    // Validation des montants
    if (typeof body.total_amount !== 'number' || body.total_amount <= 0) {
      return errorResponse('Le montant total doit être un nombre positif', 400);
    }

    // Définir le merchant_id selon le rôle
    const merchantId = user.role === 'merchant' ? user.id : body.merchant_id;

    // Générer un numéro de commande unique
    const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Calculer les montants
    const subtotal_amount = body.subtotal_amount || body.total_amount;
    const tax_amount = body.tax_amount || 0;
    const shipping_amount = body.shipping_amount || 0;

    // Ajouter des valeurs par défaut
    const orderData = {
      ...body,
      merchant_id: merchantId,
      order_number: orderNumber,
      subtotal_amount,
      tax_amount,
      shipping_amount,
      currency: body.currency || 'FCFA',
      status: body.status || 'pending',
      payment_status: body.payment_status || 'pending',
      source: body.source || 'whatsapp',
      items: JSON.stringify(body.items), // S'assurer que les items sont sérialisés
      shipping_address: body.shipping_address ? JSON.stringify(body.shipping_address) : null
    };

    const data = await ordersCrud.create(orderData);
    
    console.log(`Nouvelle commande créée par ${user.role} ${user.id}: ${orderNumber}`);
    
    return successResponse(data, 201);
  }),
  { requiredRoles: ['merchant', 'admin', 'super_admin'] }
);

// PUT - Mettre à jour une commande
export const PUT = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return errorResponse('ID de la commande requis', 400);
    }

    const body = await validateRequestBody(request);
    
    // Vérifier que la commande existe
    const existing = await ordersCrud.findById(id);
    if (!existing) {
      return errorResponse('Commande non trouvée', 404);
    }

    // Vérifier les permissions
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isMerchantOwner = user.role === 'merchant' && user.id === existing.merchant_id;
    
    if (!isAdmin && !isMerchantOwner) {
      return errorResponse('Vous n\'avez pas l\'autorisation de modifier cette commande', 403);
    }

    // Validation des statuts
    const validStatuses = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (body.status && !validStatuses.includes(body.status)) {
      return errorResponse('Statut de commande invalide', 400);
    }

    if (body.payment_status && !validPaymentStatuses.includes(body.payment_status)) {
      return errorResponse('Statut de paiement invalide', 400);
    }

    // Sérialiser les objets JSON si nécessaire
    const updateData = { ...body };
    if (body.items && Array.isArray(body.items)) {
      updateData.items = JSON.stringify(body.items);
    }
    if (body.shipping_address && typeof body.shipping_address === 'object') {
      updateData.shipping_address = JSON.stringify(body.shipping_address);
    }

    // Mettre à jour modify_time
    updateData.modify_time = new Date().toISOString();

    const data = await ordersCrud.update(id, updateData);
    
    console.log(`Commande ${id} mise à jour par ${user.role} ${user.id}`);
    
    return successResponse(data);
  },
  { requiredRoles: ['merchant', 'admin', 'super_admin'] }
);

// DELETE - Supprimer une commande (changer le statut à 'cancelled')
export const DELETE = withAuth(
  async (request: NextRequest, user: AuthUser) => {
    const { id } = parseQueryParams(request);

    if (!id) {
      return errorResponse('ID de la commande requis', 400);
    }

    // Vérifier que la commande existe
    const existing = await ordersCrud.findById(id);
    if (!existing) {
      return errorResponse('Commande non trouvée', 404);
    }

    // Vérifier les permissions
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isMerchantOwner = user.role === 'merchant' && user.id === existing.merchant_id;
    
    if (!isAdmin && !isMerchantOwner) {
      return errorResponse('Vous n\'avez pas l\'autorisation d\'annuler cette commande', 403);
    }

    // Vérifier que la commande peut être annulée
    if (['delivered', 'cancelled', 'refunded'].includes(existing.status)) {
      return errorResponse('Cette commande ne peut pas être annulée', 400);
    }

    // Soft delete: changer le statut à 'cancelled'
    const data = await ordersCrud.update(id, {
      status: 'cancelled',
      modify_time: new Date().toISOString()
    });

    console.log(`Commande ${id} annulée par ${user.role} ${user.id}`);

    return successResponse(data);
  },
  { requiredRoles: ['merchant', 'admin', 'super_admin'] }
);
