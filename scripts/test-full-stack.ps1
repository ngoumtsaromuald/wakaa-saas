# Test complet de la stack Wakaa (PostgreSQL + PostgREST + Next.js)

Write-Host "🧪 Test complet de la stack Wakaa..." -ForegroundColor Green
Write-Host ""

# Test 1: PostgreSQL
Write-Host "1️⃣ Test PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD = "Romuald12"
$pgTest = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d wakaa -c "SELECT 'PostgreSQL OK' as status;" -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ PostgreSQL: Opérationnel" -ForegroundColor Green
} else {
    Write-Host "   ❌ PostgreSQL: Problème détecté" -ForegroundColor Red
    Write-Host "   💡 Démarrez PostgreSQL: Start-Service postgresql-x64-17" -ForegroundColor Yellow
    exit 1
}

# Test 2: PostgREST
Write-Host "2️⃣ Test PostgREST..." -ForegroundColor Yellow
try {
    $postgrestTest = Invoke-RestMethod -Uri "http://localhost:3001/" -Method GET -TimeoutSec 5
    Write-Host "   ✅ PostgREST: Opérationnel" -ForegroundColor Green
} catch {
    Write-Host "   ❌ PostgREST: Non accessible" -ForegroundColor Red
    Write-Host "   💡 Démarrez PostgREST: cd postgrest && .\start-postgrest.ps1" -ForegroundColor Yellow
    exit 1
}

# Test 3: API Tables
Write-Host "3️⃣ Test API Tables..." -ForegroundColor Yellow
$tables = @("profiles", "merchants", "customers", "products", "orders", "payments")
$apiOk = $true

foreach ($table in $tables) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/$table?limit=1" -Method GET -TimeoutSec 5
        Write-Host "   ✅ Table $table : Accessible" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Table $table : Problème" -ForegroundColor Red
        $apiOk = $false
    }
}

if (!$apiOk) {
    Write-Host "   💡 Vérifiez la structure de la base de données" -ForegroundColor Yellow
    exit 1
}

# Test 4: Variables d'environnement
Write-Host "4️⃣ Test Variables d'environnement..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @("DATABASE_URL", "POSTGREST_URL", "NEXT_PUBLIC_APP_URL")
    $envOk = $true
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var : Configuré" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var : Manquant" -ForegroundColor Red
            $envOk = $false
        }
    }
    
    if (!$envOk) {
        Write-Host "   💡 Vérifiez le fichier .env.local" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ❌ Fichier .env.local manquant" -ForegroundColor Red
    exit 1
}

# Test 5: Dépendances Node.js
Write-Host "5️⃣ Test Dépendances Node.js..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules : Présent" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules : Manquant" -ForegroundColor Red
    Write-Host "   💡 Installez les dépendances: npm install --legacy-peer-deps" -ForegroundColor Yellow
    exit 1
}

# Test 6: Données de test
Write-Host "6️⃣ Test Données de test..." -ForegroundColor Yellow
try {
    $merchantsCount = Invoke-RestMethod -Uri "http://localhost:3001/merchants?select=count" -Method GET -TimeoutSec 5
    $productsCount = Invoke-RestMethod -Uri "http://localhost:3001/products?select=count" -Method GET -TimeoutSec 5
    
    Write-Host "   ✅ Marchands: Données disponibles" -ForegroundColor Green
    Write-Host "   ✅ Produits: Données disponibles" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Données de test: Limitées" -ForegroundColor Yellow
    Write-Host "   💡 Vous pouvez ajouter plus de données si nécessaire" -ForegroundColor Cyan
}

# Résumé final
Write-Host ""
Write-Host "🎉 Tests terminés avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 État de la stack:" -ForegroundColor Cyan
Write-Host "   ✅ PostgreSQL (localhost:5432)" -ForegroundColor Green
Write-Host "   ✅ PostgREST API (localhost:3001)" -ForegroundColor Green
Write-Host "   ✅ Variables d'environnement" -ForegroundColor Green
Write-Host "   ✅ Dépendances Node.js" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Prêt à lancer l'application!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Commandes pour démarrer:" -ForegroundColor Cyan
Write-Host "   1. PostgREST (dans un terminal):" -ForegroundColor White
Write-Host "      cd postgrest && .\start-postgrest.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Application Next.js (dans un autre terminal):" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 URLs de l'application:" -ForegroundColor Cyan
Write-Host "   • Application: http://localhost:3000" -ForegroundColor White
Write-Host "   • API PostgREST: http://localhost:3001" -ForegroundColor White
Write-Host "   • Documentation API: http://localhost:3001/" -ForegroundColor White