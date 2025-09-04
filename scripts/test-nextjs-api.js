// Test de l'API Next.js pour les profils
const fetch = require('node-fetch');

async function testNextjsApi() {
  try {
    console.log('🔍 Test de l\'API Next.js /next_api/profiles...');
    
    const response = await fetch('http://localhost:3000/next_api/profiles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ API Next.js fonctionne !');
      console.log(`📊 ${data.data?.length || 0} profils trouvés`);
    } else {
      console.log('❌ Erreur API:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

testNextjsApi();