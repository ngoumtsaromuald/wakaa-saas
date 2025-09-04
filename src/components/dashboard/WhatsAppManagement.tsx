
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  Settings, 
  Users,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Bot,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

// Types
interface WhatsAppMessage {
  id: number;
  message_id?: string;
  to: string;
  message: string;
  type: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  merchant_id?: number;
  customer_id?: number;
  order_id?: number;
}

interface WhatsAppTemplate {
  name: string;
  category: string;
  language: string;
  status: string;
  components: any[];
}

const statusConfig = {
  pending: { 
    label: "En attente", 
    variant: "secondary" as const, 
    color: "text-yellow-600",
    icon: Clock
  },
  sent: { 
    label: "Envoyé", 
    variant: "outline" as const, 
    color: "text-blue-600",
    icon: Send
  },
  delivered: { 
    label: "Livré", 
    variant: "default" as const, 
    color: "text-green-600",
    icon: CheckCircle
  },
  failed: { 
    label: "Échoué", 
    variant: "destructive" as const, 
    color: "text-red-600",
    icon: XCircle
  }
};

export function WhatsAppManagement() {
  const [merchantId] = useState(1); // TODO: Récupérer l'ID du marchand connecté
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showTemplateMessage, setShowTemplateMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({
    to: "",
    message: "",
    type: "text",
    template_name: "",
    parameters: [""]
  });

  // Charger les messages depuis l'API réelle
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ messages: WhatsAppMessage[] }>('/whatsapp/messages', {
        limit: '50',
        offset: '0',
        merchant_id: merchantId.toString()
      });
      setMessages(data.messages || []);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Erreur lors du chargement des messages: ${error.message}`);
      } else {
        toast.error('Erreur lors du chargement des messages');
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les templates depuis l'API réelle
  const fetchTemplates = async () => {
    try {
      const data = await api.get<{ templates: WhatsAppTemplate[] }>('/whatsapp/templates');
      setTemplates(data.templates || []);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Erreur lors du chargement des templates: ${error.message}`);
      } else {
        toast.error('Erreur lors du chargement des templates');
      }
    }
  };

  // Envoyer un message simple via l'API réelle
  const sendMessage = async () => {
    if (!messageForm.to || !messageForm.message) {
      toast.error('Le destinataire et le message sont obligatoires');
      return;
    }

    try {
      await api.post('/whatsapp/messages', {
        to: messageForm.to,
        message: messageForm.message,
        type: messageForm.type,
        merchant_id: merchantId,
        notification_type: 'whatsapp_message'
      });
      
      toast.success('Message envoyé avec succès');
      setShowSendMessage(false);
      resetMessageForm();
      fetchMessages(); // Recharger les messages
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.error('Erreur lors de l\'envoi du message');
      }
    }
  };

  // Envoyer un message avec template via l'API réelle
  const sendTemplateMessage = async () => {
    if (!messageForm.to || !messageForm.template_name) {
      toast.error('Le destinataire et le template sont obligatoires');
      return;
    }

    try {
      await api.post('/whatsapp/templates', {
        to: messageForm.to,
        template_name: messageForm.template_name,
        parameters: messageForm.parameters.filter(p => p.trim() !== '')
      });
      
      toast.success('Message template envoyé avec succès');
      setShowTemplateMessage(false);
      resetMessageForm();
      fetchMessages(); // Recharger les messages
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.error('Erreur lors de l\'envoi du template');
      }
    }
  };

  // Réinitialiser le formulaire
  const resetMessageForm = () => {
    setMessageForm({
      to: "",
      message: "",
      type: "text",
      template_name: "",
      parameters: [""]
    });
  };

  // Ajouter un paramètre pour les templates
  const addParameter = () => {
    setMessageForm(prev => ({
      ...prev,
      parameters: [...prev.parameters, ""]
    }));
  };

  // Supprimer un paramètre
  const removeParameter = (index: number) => {
    setMessageForm(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  // Mettre à jour un paramètre
  const updateParameter = (index: number, value: string) => {
    setMessageForm(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => i === index ? value : param)
    }));
  };

  // Calculer les statistiques réelles
  const stats = {
    totalMessages: messages.length,
    sentMessages: messages.filter(m => m.status === 'sent').length,
    deliveredMessages: messages.filter(m => m.status === 'delivered').length,
    failedMessages: messages.filter(m => m.status === 'failed').length,
    totalTemplates: templates.length
  };

  // Charger les données au montage
  useState(() => {
    fetchMessages();
    fetchTemplates();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Gestion WhatsApp</h1>
          <p className="text-muted-foreground">
            Gérez vos messages WhatsApp et automatisations en temps réel
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchMessages} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Envoyer Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envoyer un Message WhatsApp</DialogTitle>
                <DialogDescription>
                  Envoyez un message direct à un client
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="to">Numéro de Téléphone *</Label>
                  <Input
                    id="to"
                    value={messageForm.to}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={messageForm.message}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Votre message..."
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendMessage(false)}>
                  Annuler
                </Button>
                <Button onClick={sendMessage}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showTemplateMessage} onOpenChange={setShowTemplateMessage}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Envoyer un Message Template</DialogTitle>
                <DialogDescription>
                  Utilisez un template prédéfini avec des paramètres personnalisés
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-to">Numéro de Téléphone *</Label>
                    <Input
                      id="template-to"
                      value={messageForm.to}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-name">Template *</Label>
                    <Select 
                      value={messageForm.template_name} 
                      onValueChange={(value) => setMessageForm(prev => ({ ...prev, template_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.name} value={template.name}>
                            {template.name} ({template.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Paramètres du Template</Label>
                    <Button variant="outline" size="sm" onClick={addParameter}>
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {messageForm.parameters.map((param, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={param}
                          onChange={(e) => updateParameter(index, e.target.value)}
                          placeholder={`Paramètre ${index + 1}`}
                        />
                        {messageForm.parameters.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeParameter(index)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateMessage(false)}>
                  Annuler
                </Button>
                <Button onClick={sendTemplateMessage}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer Template
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
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Messages Envoyés</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrés</p>
                <p className="text-2xl font-bold">{stats.deliveredMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold">{stats.failedMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{stats.totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Onglet Messages - Données Réelles */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Messages</CardTitle>
              <CardDescription>
                Liste de tous vos messages WhatsApp envoyés (données réelles)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Chargement des messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun message trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Envoyé le</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => {
                      const statusInfo = statusConfig[message.status as keyof typeof statusConfig];
                      const StatusIcon = statusInfo?.icon || Clock;
                      
                      return (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">
                            {message.to}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {message.message}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {message.type}
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
                            {message.sent_at ? 
                              new Date(message.sent_at).toLocaleString('fr-FR') : 
                              'Non envoyé'
                            }
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
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
        </TabsContent>

        {/* Onglet Templates - Données Réelles */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates WhatsApp</CardTitle>
              <CardDescription>
                Templates prédéfinis pour vos messages automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.name} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge 
                        variant={template.status === 'APPROVED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {template.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Catégorie: {template.category}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Langue: {template.language}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setMessageForm(prev => ({ ...prev, template_name: template.name }));
                        setShowTemplateMessage(true);
                      }}
                    >
                      Utiliser ce Template
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Automatisation */}
        <TabsContent value="automation">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Réponses Automatiques</span>
                </CardTitle>
                <CardDescription>
                  Configurez les réponses automatiques aux messages entrants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Message de bienvenue</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Confirmation de commande</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rappel de paiement</span>
                  <Badge variant="secondary">Inactif</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Déclencheurs</span>
                </CardTitle>
                <CardDescription>
                  Actions automatiques basées sur les événements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Nouvelle commande → Confirmation</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Paiement reçu → Remerciement</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Commande expédiée → Notification</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Déclencheur
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration WhatsApp Business</CardTitle>
                <CardDescription>
                  Paramètres de connexion à l'API WhatsApp Business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone-number">Numéro WhatsApp Business</Label>
                  <Input
                    id="phone-number"
                    value="+237 6XX XXX XXX"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">URL Webhook</Label>
                  <Input
                    id="webhook-url"
                    value={`${process.env.NEXT_PUBLIC_APP_URL}/next_api/webhooks/whatsapp`}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="verify-token">Token de Vérification</Label>
                  <Input
                    id="verify-token"
                    value="wakaa_webhook_token"
                    disabled
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Connecté</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Préférences de Notification</CardTitle>
                <CardDescription>
                  Configurez quand et comment recevoir les notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Nouveau message reçu</span>
                  <Badge variant="default">Activé</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Échec d'envoi</span>
                  <Badge variant="default">Activé</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rapport quotidien</span>
                  <Badge variant="secondary">Désactivé</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier Préférences
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
