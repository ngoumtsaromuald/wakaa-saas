
"use client";

import { useState } from "react";
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
  Eye, 
  Download,
  RefreshCw,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { usePayments } from "@/hooks/usePayments";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";

const statusConfig = {
  pending: { 
    label: "En attente", 
    variant: "secondary" as const, 
    color: "text-yellow-600",
    icon: Clock
  },
  processing: { 
    label: "En traitement", 
    variant: "outline" as const, 
    color: "text-blue-600",
    icon: RefreshCw
  },
  completed: { 
    label: "Complété", 
    variant: "default" as const, 
    color: "text-green-600",
    icon: CheckCircle
  },
  failed: { 
    label: "Échoué", 
    variant: "destructive" as const, 
    color: "text-red-600",
    icon: XCircle
  },
  cancelled: { 
    label: "Annulé", 
    variant: "secondary" as const, 
    color: "text-gray-600",
    icon: XCircle
  },
  refunded: { 
    label: "Remboursé", 
    variant: "outline" as const, 
    color: "text-orange-600",
    icon: AlertCircle
  }
};

const providerConfig = {
  cinetpay: { label: "CinetPay", color: "bg-blue-100 text-blue-800" },
  mtn_momo: { label: "MTN MoMo", color: "bg-yellow-100 text-yellow-800" },
  orange_money: { label: "Orange Money", color: "bg-orange-100 text-orange-800" },
  manual: { label: "Manuel", color: "bg-gray-100 text-gray-800" }
};

export function PaymentsManagement() {
  const [merchantId] = useState(1); // TODO: Récupérer l'ID du marchand connecté
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Utiliser les hooks réels
  const { 
    payments, 
    loading: paymentsLoading, 
    getPaymentsByStatus,
    getPaymentsByProvider,
    getTotalAmount,
    refresh: refreshPayments
  } = usePayments({ 
    merchantId,
    autoRefresh: true,
    refreshInterval: 30000 
  });

  const { orders, getOrderById } = useOrders({ merchantId });
  const { customers, getCustomerById } = useCustomers({ merchantId });

  // Filtrer les paiements selon les critères
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.external_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    const matchesProvider = providerFilter === 'all' || payment.provider === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Obtenir les informations de la commande
  const getOrderInfo = (orderId: number) => {
    return getOrderById(orderId);
  };

  // Obtenir les informations du client
  const getCustomerInfo = (customerId: number) => {
    return getCustomerById(customerId);
  };

  // Fonction pour actualiser les paiements (corrigée)
  const handleRefreshPayments = () => {
    refreshPayments();
  };

  // Calculer les statistiques réelles
  const stats = {
    totalPayments: payments.length,
    completedPayments: getPaymentsByStatus('completed').length,
    pendingPayments: getPaymentsByStatus('pending').length,
    totalAmount: getTotalAmount('completed'),
    failedPayments: getPaymentsByStatus('failed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
          <p className="text-muted-foreground">
            Suivez tous vos paiements et transactions en temps réel
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshPayments} disabled={paymentsLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${paymentsLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques - Données Réelles */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Paiements</p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Complétés</p>
                <p className="text-2xl font-bold">{stats.completedPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Échoués</p>
                <p className="text-2xl font-bold">{stats.failedPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Montant Total</p>
                <p className="text-2xl font-bold">
                  {stats.totalAmount.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
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
            
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {Object.entries(providerConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des paiements - Données Réelles */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements ({filteredPayments.length})</CardTitle>
          <CardDescription>
            Liste de tous vos paiements et transactions en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Chargement des paiements...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {payments.length === 0 ? 'Aucun paiement trouvé' : 'Aucun paiement ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const order = getOrderInfo(payment.order_id);
                  const customer = order ? getCustomerInfo(order.customer_id) : null;
                  const statusInfo = statusConfig[payment.status as keyof typeof statusConfig];
                  const providerInfo = providerConfig[payment.provider as keyof typeof providerConfig];
                  const StatusIcon = statusInfo?.icon || Clock;
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.transaction_id || `PAY-${payment.id}`}
                          </p>
                          {payment.external_transaction_id && (
                            <p className="text-sm text-muted-foreground">
                              Ext: {payment.external_transaction_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order ? (
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.total_amount.toLocaleString()} FCFA
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Commande inconnue</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <div>
                            <p className="font-medium">{customer.name || 'Client'}</p>
                            <p className="text-sm text-muted-foreground">
                              {customer.phone_number}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Client inconnu</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.amount.toLocaleString()} {payment.currency}
                          </p>
                          {payment.payment_method && (
                            <p className="text-sm text-muted-foreground">
                              {payment.payment_method}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={providerInfo?.color}>
                          {providerInfo?.label}
                        </Badge>
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
                        <div>
                          <p className="text-sm">
                            {new Date(payment.create_time).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.create_time).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPaymentDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog des détails du paiement - Données Réelles */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Paiement</DialogTitle>
            <DialogDescription>
              {selectedPayment?.transaction_id || `PAY-${selectedPayment?.id}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informations Paiement</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {selectedPayment.id}</p>
                    <p><strong>Transaction:</strong> {selectedPayment.transaction_id || 'N/A'}</p>
                    <p><strong>Montant:</strong> {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
                    <p><strong>Fournisseur:</strong> {providerConfig[selectedPayment.provider as keyof typeof providerConfig]?.label}</p>
                    <p><strong>Méthode:</strong> {selectedPayment.payment_method || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Statut & Dates</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Statut:</strong> {statusConfig[selectedPayment.status as keyof typeof statusConfig]?.label}</p>
                    <p><strong>Créé le:</strong> {new Date(selectedPayment.create_time).toLocaleString('fr-FR')}</p>
                    {selectedPayment.processed_at && (
                      <p><strong>Traité le:</strong> {new Date(selectedPayment.processed_at).toLocaleString('fr-FR')}</p>
                    )}
                    {selectedPayment.expires_at && (
                      <p><strong>Expire le:</strong> {new Date(selectedPayment.expires_at).toLocaleString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations commande - Données Réelles */}
              {(() => {
                const order = getOrderInfo(selectedPayment.order_id);
                const customer = order ? getCustomerInfo(order.customer_id) : null;
                
                return order && (
                  <div>
                    <h4 className="font-semibold mb-2">Commande Associée</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <p><strong>Numéro:</strong> {order.order_number}</p>
                      <p><strong>Montant:</strong> {order.total_amount.toLocaleString()} FCFA</p>
                      {customer && (
                        <>
                          <p><strong>Client:</strong> {customer.name || 'N/A'}</p>
                          <p><strong>Téléphone:</strong> {customer.phone_number}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Raison d'échec - Données Réelles */}
              {selectedPayment.failure_reason && (
                <div>
                  <h4 className="font-semibold mb-2">Raison d'Échec</h4>
                  <div className="bg-red-50 p-3 rounded-lg text-red-800">
                    <p>{selectedPayment.failure_reason}</p>
                  </div>
                </div>
              )}

              {/* Données webhook - Données Réelles */}
              {selectedPayment.webhook_data && (
                <div>
                  <h4 className="font-semibold mb-2">Données Webhook</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(
                        typeof selectedPayment.webhook_data === 'string' 
                          ? JSON.parse(selectedPayment.webhook_data)
                          : selectedPayment.webhook_data, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
