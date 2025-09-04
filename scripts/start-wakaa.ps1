# Script de démarrage complet de l'application Wakaa

Write-Host "🚀 Démarrage de l'application Wakaa..." -ForegroundColor Green
Write-Host ""

# Vérifications préliminaires
Write-Host "📋 Vérifications préliminaires..." -ForegroundColor Yellow

# 1. PostgreSQL
$env:PGPASSWORD = "Romuald12"
$pgTest = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d wakaa -c "SELECT 1;" -t 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PostgreSQL n'est pas accessible" -ForegroundColor Red
    Write-Host "💡 Démarrez PostgreSQL: Start-Service postgresql-x64-17" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PostgreSQL: OK" -ForegroundColor Green

# 2. PostgREST
try {
    $postgrestTest = Invoke-RestMethod -Uri "http://localhost:3001/" -Method GET -TimeoutSec 3
    Write-Host "✅ PostgREST: OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgREST n'est pas démarré" -ForegroundColor Yellow
    Write-Host "🔄 Démarrage de PostgREST..." -ForegroundColor Cyan
    
    # Démarrer PostgREST en arrière-plan
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\postgrest'; .\start-postgrest.ps1" -WindowStyle Normal
    
    # Attendre que PostgREST démarre
    $attempts = 0
    $maxAttempts = 10
    do {
        Start-Sleep -Seconds 2
        $attempts++
        try {
            $postgrestTest = Invoke-RestMethod -Uri "http://localhost:3001/" -Method GET -TimeoutSec 3
            Write-Host "✅ PostgREST: Démarré" -ForegroundColor Green
            break
        } catch {
            Write-Host "⏳ Attente du démarrage de PostgREST... ($attempts/$maxAttempts)" -ForegroundColor Yellow
        }
    } while ($attempts -lt $maxAttempts)
    
    if ($attempts -eq $maxAttempts) {
        Write-Host "❌ Impossible de démarrer PostgREST" -ForegroundColor Red
        exit 1
    }
}

# 3. Dépendances Node.js
if (!(Test-Path "node_modules")) {
    Write-Host "⚠️  Dépendances Node.js manquantes" -ForegroundColor Yellow
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Dépendances Node.js: OK" -ForegroundColor Green

# 4. Variables d'environnement
if (!(Test-Path ".env.local")) {
    Write-Host "❌ Fichier .env.local manquant" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Variables d'environnement: OK" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Toutes les vérifications sont passées!" -ForegroundColor Green
Write-Host ""

# Afficher les informations importantes
Write-Host "📊 Configuration actuelle:" -ForegroundColor Cyan
Write-Host "   • PostgreSQL: localhost:5432/wakaa" -ForegroundColor White
Write-Host "   • PostgREST API: http://localhost:3001" -ForegroundColor White
Write-Host "   • Application: http://localhost:3000" -ForegroundColor White
Write-Host ""

# Démarrer l'application Next.js
Write-Host "🚀 Démarrage de l'application Next.js..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 L'application sera accessible sur: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📖 Documentation API: http://localhost:3001/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter l'application" -ForegroundColor Yellow
Write-Host ""

# Démarrer Next.js
npm run dev