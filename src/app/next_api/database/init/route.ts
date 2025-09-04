
import { NextRequest } from 'next/server';
import { 
  withErrorHandling,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';
import { initializeDatabase } from '@/lib/database-init';

// POST - Initialiser la base de données avec des données de test
export const POST = withErrorHandling(async (request: NextRequest) => {
  logApiRequest(request);
  
  try {
    const result = await initializeDatabase();
    return successResponse(result);
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return errorResponse(error.message || 'Erreur lors de l\'initialisation');
  }
});

// GET - Vérifier le statut de la base de données
export const GET = withErrorHandling(async (request: NextRequest) => {
  logApiRequest(request);
  
  try {
    // Test de connectivité simple
    const { postgrestClient } = await import('@/lib/postgrest');
    const { data, error } = await postgrestClient
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Erreur de connexion: ${error.message}`);
    }
    
    return successResponse({
      status: 'connected',
      message: 'Base de données accessible',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Erreur de vérification de la base de données:', error);
    return errorResponse(error.message || 'Erreur de connexion à la base de données');
  }
});
