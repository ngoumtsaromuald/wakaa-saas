// Script pour nettoyer le localStorage des tokens d'authentification
console.log('🧹 Nettoyage du localStorage...');

if (typeof window !== 'undefined') {
  // Afficher ce qui est actuellement stocké
  console.log('Tokens actuels:');
  console.log('- auth_token:', localStorage.getItem('auth_token'));
  console.log('- user_data:', localStorage.getItem('user_data'));
  console.log('- session token:', sessionStorage.getItem('auth_token'));

  // Nettoyer tous les tokens
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  sessionStorage.removeItem('auth_token');
  
  console.log('✅ localStorage nettoyé !');
} else {
  console.log('❌ Ce script doit être exécuté dans le navigateur');
}

// Instructions pour l'utilisateur
console.log(`
📋 Pour nettoyer manuellement:
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet Application/Storage
3. Cliquez sur Local Storage > http://localhost:3000
4. Supprimez les clés: auth_token, user_data
5. Rechargez la page
`);