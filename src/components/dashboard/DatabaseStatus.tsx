
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

interface DatabaseStatusProps {
  showInitButton?: boolean;
}

export function DatabaseStatus({ showInitButton = false }: DatabaseStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkDatabaseConnection = async () => {
    setStatus('checking');
    try {
      // Tester la connexion en récupérant quelques données
      await api.get('/profiles', { limit: '1' });
      setStatus('connected');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('error');
      console.error('Erreur de connexion à la base de données:', error);
    }
  };

  const initializeDatabase = async () => {
    setLoading(true);
    try {
      const result = await api.post('/database/init');
      toast.success('Base de données initialisée avec succès');
      console.log('Données de test créées:', result);
      checkDatabaseConnection();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Erreur d'initialisation: ${error.message}`);
      } else {
        toast.error('Erreur lors de l\'initialisation de la base de données');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseConnection();
    
    // Vérifier la connexion toutes les 5 minutes
    const interval = setInterval(checkDatabaseConnection, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          label: 'Connecté',
          variant: 'default' as const
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          label: 'Erreur',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: Activity,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          label: 'Vérification',
          variant: 'secondary' as const
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={statusConfig.bgColor}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Database className="w-4 h-4" />
          <span>Statut Base de Données</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${status === 'checking' ? 'animate-pulse' : ''}`} />
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={checkDatabaseConnection}
            disabled={status === 'checking'}
          >
            <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Dernière vérification: {lastCheck.toLocaleTimeString('fr-FR')}
        </div>

        {showInitButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={initializeDatabase}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                Initialisation...
              </>
            ) : (
              'Initialiser avec des Données de Test'
            )}
          </Button>
        )}

        {status === 'error' && (
          <div className="text-xs text-red-600">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Vérifiez la configuration de la base de données
          </div>
        )}
      </CardContent>
    </Card>
  );
}
