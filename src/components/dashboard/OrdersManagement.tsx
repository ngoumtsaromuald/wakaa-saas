
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";

const statusConfig = {
  pending: { 
    label: "En attente", 
    variant: "secondary" as const, 
    color: "text-yellow-600",
    icon: Clock
  },
  confirmed: { 
    label: "Confirmée", 
    variant: "outline" as const, 
    color: "text-blue-600",
    icon: CheckCircle
  },
  paid: { 
    label: "Payée", 
    variant: "default" as const, 
    color: "text-green-600",
    icon: CheckCircle
  },
  processing: { 
    label: "En traitement", 
    variant: "secondary" as const, 
    color: "text-purple-600",
    icon: Package
  },
  shipped: { 
    label: "Expédiée", 
    variant: "outline" as const, 
    color: "text-blue-600",
    icon: Truck
  },
  delivered: { 
    label: "Livrée", 
    variant: "default" as const, 
    color: "text-green-600",
    icon: CheckCircle
  },
  cancelled: { 
    label: "Annulée", 
    variant: "destructive" as const, 
    color: "text-red-600",
    icon: XCircle
  },
  refunded: { 
    label: "Remboursée", 
    variant: "secondary" as const, 
    color: "text-gray-600",
    icon: AlertCircle
  }
};

const paymentStatusConfig = {
  pending: { label: "En attente", color: "text-yellow-600" },
  paid: { label: "Payé", color: "text-green-600" },
  failed: { label: "Échoué", color: "text-red-600" },
  refunded: { label: "Remboursé", color: "text-gray-600" }
};

export function OrdersManagement() {
  const [merchantId] = useState(1); // TODO: Récupérer l'ID du marchand connecté
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Utiliser les hooks réels
  const { 
    orders, 
    loading: ordersLoading, 
    updateOrder, 
    deleteOrder,
    getOrdersByStatus,
    getOrdersByPaymentStatus,
    refresh: refreshOrders
  } = useOrders({ 
    merchantId,
    autoRefresh: true,
    refreshInterval: 30000 
  });

  const { customers, getCustomerById } = useCustomers({ merchantId });

  // Filtrer les commandes selon les critères
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesPaymentStatus = paymentStatusFilter === 'all' || 
      order.payment_status === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  // Mettre à jour le statut d'une commande
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await updateOrder(orderId, { status: newStatus });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Supprimer une commande
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      await deleteOrder(orderId);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Fonction pour actualiser les commandes (corrigée)
  const handleRefreshOrders = () => {
    refreshOrders();
  };

  // Formater les articles de la commande
  const formatOrderItems = (items: any[]) => {
    if (!Array.isArray(items)) {
      try {
        items = JSON.parse(items);
      } catch {
        return 'Articles non disponibles';
      }
    }
    
    return items.map(item => `${item.quantity}x ${item.name}`).join(', ');
  };

  // Calculer les statistiques réelles
  const stats = {
    pending: getOrdersByStatus('pending').length,
    processing: getOrdersByStatus('confirmed').length + 
                getOrdersByStatus('paid').length + 
                getOrdersByStatus('processing').length,
    shipped: getOrdersByStatus('shipped').length,
    delivered: getOrdersByStatus('delivered').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos commandes WhatsApp en temps réel
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshOrders} disabled={ordersLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Commande
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut de commande" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les paiements</SelectItem>
                {Object.entries(paymentStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Plus de filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides - Données Réelles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">En traitement</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Expédiées</p>
                <p className="text-2xl font-bold">{stats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des commandes - Données Réelles */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Liste de toutes vos commandes avec leurs statuts en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Chargement des commandes...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0 ? 'Aucune commande trouvée' : 'Aucune commande ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const customer = getCustomerById(order.customer_id);
                  const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                  const paymentInfo = paymentStatusConfig[order.payment_status as keyof typeof paymentStatusConfig];
                  const StatusIcon = statusInfo?.icon || Clock;
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer?.name || 'Client inconnu'}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer?.phone_number || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {formatOrderItems(order.items)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.total_amount.toLocaleString()} {order.currency}
                          </p>
                          {order.tax_amount > 0 && (
                            <p className="text-sm text-muted-foreground">
                              +{order.tax_amount} taxe
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-4 h-4 ${statusInfo?.color}`} />
                          <Badge variant={statusInfo?.variant}>
                            {statusInfo?.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={paymentInfo?.color}>
                          {paymentInfo?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(order.create_time).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <Edit className="w-4 h-4" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog des détails de commande - Données Réelles */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Commande</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Informations client - Données Réelles */}
              <div>
                <h4 className="font-semibold mb-2">Informations Client</h4>
                <div className="bg-muted p-3 rounded-lg">
                  {(() => {
                    const customer = getCustomerById(selectedOrder.customer_id);
                    return (
                      <>
                        <p><strong>Nom:</strong> {customer?.name || 'Non renseigné'}</p>
                        <p><strong>Téléphone:</strong> {customer?.phone_number || 'N/A'}</p>
                        <p><strong>Email:</strong> {customer?.email || 'Non renseigné'}</p>
                        <p><strong>Ville:</strong> {customer?.city || 'Non renseigné'}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Articles - Données Réelles */}
              <div>
                <h4 className="font-semibold mb-2">Articles Commandés</h4>
                <div className="space-y-2">
                  {(() => {
                    let items = selectedOrder.items;
                    if (typeof items === 'string') {
                      try {
                        items = JSON.parse(items);
                      } catch {
                        return <p>Erreur lors du chargement des articles</p>;
                      }
                    }
                    
                    return Array.isArray(items) ? items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity} × {item.price?.toLocaleString()} FCFA
                          </p>
                        </div>
                        <p className="font-semibold">
                          {(item.total || item.quantity * item.price)?.toLocaleString()} FCFA
                        </p>
                      </div>
                    )) : <p>Aucun article trouvé</p>;
                  })()}
                </div>
              </div>

              {/* Résumé financier - Données Réelles */}
              <div>
                <h4 className="font-semibold mb-2">Résumé Financier</h4>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span>{selectedOrder.subtotal_amount.toLocaleString()} FCFA</span>
                  </div>
                  {selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Taxes:</span>
                      <span>{selectedOrder.tax_amount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {selectedOrder.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Livraison:</span>
                      <span>{selectedOrder.shipping_amount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{selectedOrder.total_amount.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Adresse de livraison - Données Réelles */}
              {selectedOrder.shipping_address && (
                <div>
                  <h4 className="font-semibold mb-2">Adresse de Livraison</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    {(() => {
                      let address = selectedOrder.shipping_address;
                      if (typeof address === 'string') {
                        try {
                          address = JSON.parse(address);
                        } catch {
                          return <p>{selectedOrder.shipping_address}</p>;
                        }
                      }
                      return (
                        <div>
                          <p>{address.address}</p>
                          {address.city && <p>{address.city}</p>}
                          {address.country && <p>{address.country}</p>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Notes - Données Réelles */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <p>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Informations système - Données Réelles */}
              <div>
                <h4 className="font-semibold mb-2">Informations Système</h4>
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <p><strong>Source:</strong> {selectedOrder.source}</p>
                  <p><strong>Créée le:</strong> {new Date(selectedOrder.create_time).toLocaleString('fr-FR')}</p>
                  <p><strong>Modifiée le:</strong> {new Date(selectedOrder.modify_time).toLocaleString('fr-FR')}</p>
                  {selectedOrder.whatsapp_message_id && (
                    <p><strong>Message WhatsApp:</strong> {selectedOrder.whatsapp_message_id}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
