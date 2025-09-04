
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  RefreshCw,
  Users,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/useCustomers";

export function CustomersManagement() {
  const [merchantId] = useState(1); // TODO: Récupérer l'ID du marchand connecté
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    address: "",
    city: "",
    notes: ""
  });

  // Utiliser le hook réel pour les clients
  const { 
    customers, 
    loading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    searchCustomers,
    refresh: refreshCustomers
  } = useCustomers({ 
    merchantId,
    autoRefresh: true,
    refreshInterval: 60000 
  });

  // Filtrer les clients selon le terme de recherche
  const filteredCustomers = searchTerm 
    ? searchCustomers(searchTerm)
    : customers;

  // Ajouter un nouveau client
  const handleAddCustomer = async () => {
    if (!formData.phone_number || !formData.name) {
      toast.error('Le nom et le numéro de téléphone sont obligatoires');
      return;
    }

    try {
      await createCustomer({
        ...formData,
        merchant_id: merchantId
      });
      
      setShowAddCustomer(false);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Modifier un client
  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await updateCustomer(selectedCustomer.id, formData);
      setShowEditCustomer(false);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Supprimer un client
  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      await deleteCustomer(customerId);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: "",
      phone_number: "",
      email: "",
      address: "",
      city: "",
      notes: ""
    });
  };

  // Ouvrir le dialog d'édition
  const openEditDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone_number: customer.phone_number,
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      notes: customer.notes || ""
    });
    setShowEditCustomer(true);
  };

  // Fonction pour actualiser les données (corrigée)
  const handleRefresh = () => {
    refreshCustomers();
  };

  // Calculer les statistiques réelles
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.total_orders > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.reduce((sum, c) => sum + c.total_orders, 0) || 0
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Clients</h1>
          <p className="text-muted-foreground">
            Gérez votre base de clients et leurs informations en temps réel
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Client</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouveau client
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom du client"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemple.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Douala, Yaoundé..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes sur le client..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddCustomer}>
                  Ajouter le Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques - Données Réelles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Clients Actifs</p>
                <p className="text-2xl font-bold">{stats.activeCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Revenus Total</p>
                <p className="text-2xl font-bold">
                  {stats.totalRevenue.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Panier Moyen</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.averageOrderValue).toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table des clients - Données Réelles */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Liste de tous vos clients avec leurs informations en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Chargement des clients...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {customers.length === 0 ? 'Aucun client trouvé' : 'Aucun client ne correspond à la recherche'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total Dépensé</TableHead>
                  <TableHead>Dernière Commande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name || 'Nom non renseigné'}</p>
                        <p className="text-sm text-muted-foreground">
                          Client depuis {new Date(customer.create_time).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{customer.phone_number}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.city || customer.address ? (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {customer.city || customer.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Non renseigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.total_orders} commande{customer.total_orders > 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {customer.total_spent.toLocaleString()} FCFA
                      </p>
                    </TableCell>
                    <TableCell>
                      {customer.last_order_at ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(customer.last_order_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            window.open(`https://wa.me/${customer.phone_number.replace('+', '')}`, '_blank');
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog des détails du client - Données Réelles */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Client</DialogTitle>
            <DialogDescription>
              Informations complètes sur {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informations Personnelles</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom:</strong> {selectedCustomer.name || 'Non renseigné'}</p>
                    <p><strong>Téléphone:</strong> {selectedCustomer.phone_number}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email || 'Non renseigné'}</p>
                    <p><strong>Ville:</strong> {selectedCustomer.city || 'Non renseigné'}</p>
                    <p><strong>Adresse:</strong> {selectedCustomer.address || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total commandes:</strong> {selectedCustomer.total_orders}</p>
                    <p><strong>Total dépensé:</strong> {selectedCustomer.total_spent.toLocaleString()} FCFA</p>
                    <p><strong>Panier moyen:</strong> {
                      selectedCustomer.total_orders > 0 
                        ? Math.round(selectedCustomer.total_spent / selectedCustomer.total_orders).toLocaleString()
                        : 0
                    } FCFA</p>
                    <p><strong>Client depuis:</strong> {new Date(selectedCustomer.create_time).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Dernière commande:</strong> {
                      selectedCustomer.last_order_at 
                        ? new Date(selectedCustomer.last_order_at).toLocaleDateString('fr-FR')
                        : 'Jamais'
                    }</p>
                  </div>
                </div>
              </div>
              
              {selectedCustomer.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition du client */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nom *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du client"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Téléphone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemple.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city">Ville</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Douala, Yaoundé..."
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Adresse</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Adresse complète"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes sur le client..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCustomer(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateCustomer}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
