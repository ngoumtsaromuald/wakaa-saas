// Test simple de la connexion PostgREST depuis Node.js
const POSTGREST_URL = "http://localhost:3001";
const POSTGREST_API_KEY = "wakaa-dev-api-key";

console.log('🔍 Test de connexion PostgREST...');
console.log('URL:', POSTGREST_URL);
console.log('API Key:', POSTGREST_API_KEY ? '***définie***' : 'non définie');

async function testConnection() {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Ne pas ajouter Authorization pour les clés de dev
    if (POSTGREST_API_KEY && 
        POSTGREST_API_KEY.trim() !== '' && 
        POSTGREST_API_KEY !== 'wakaa-dev-api-key' &&
        !POSTGREST_API_KEY.startsWith('wakaa-dev-')) {
      headers['Authorization'] = `Bearer ${POSTGREST_API_KEY}`;
      console.log('🔐 Header Authorization ajouté');
    } else {
      console.log('🔓 Pas d\'header Authorization (mode dev)');
    }

    const response = await fetch(`${POSTGREST_URL}/profiles`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Connexion réussie !');
    console.log(`📊 ${data.length} profils trouvés`);
    console.log('Premier profil:', data[0]?.email || 'Aucun');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();