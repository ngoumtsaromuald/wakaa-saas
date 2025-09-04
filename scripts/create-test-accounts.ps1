# Script pour créer des comptes de test avec des mots de passe simples

$env:PGPASSWORD = "Romuald12"

Write-Host "🔑 Création de comptes de test avec mots de passe simples..." -ForegroundColor Green

# Mettre à jour les comptes existants avec des mots de passe simples
$accounts = @(
    @{email="admin@wakaa.cm"; password="admin123"; name="Admin Wakaa"; role="admin"},
    @{email="merchant1@wakaa.cm"; password="merchant123"; name="Jean Boutique"; role="merchant"},
    @{email="merchant2@wakaa.cm"; password="marie123"; name="Marie Fashion"; role="merchant"}
)

foreach ($account in $accounts) {
    $passwordHash = "hashed_$($account.password)_1234567890"
    
    Write-Host "🔄 Mise à jour du compte: $($account.email)" -ForegroundColor Yellow
    
    $updateQuery = "UPDATE profiles SET password_hash = '$passwordHash', password_changed_at = CURRENT_TIMESTAMP WHERE email = '$($account.email)';"
    
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d wakaa -c $updateQuery
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compte mis à jour: $($account.email)" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur pour: $($account.email)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Comptes de test créés avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "👥 Comptes disponibles pour les tests:" -ForegroundColor Cyan
Write-Host ""

foreach ($account in $accounts) {
    Write-Host "📧 Email: $($account.email)" -ForegroundColor White
    Write-Host "🔐 Mot de passe: $($account.password)" -ForegroundColor Yellow
    Write-Host "👤 Rôle: $($account.role)" -ForegroundColor Cyan
    Write-Host "📝 Nom: $($account.name)" -ForegroundColor White
    Write-Host ""
}

Write-Host "🚀 Tu peux maintenant te connecter avec ces comptes!" -ForegroundColor Green
Write-Host "🔗 Page de connexion: http://localhost:3000/auth/login" -ForegroundColor Cyan