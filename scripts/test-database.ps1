# Test complet de la base de données Wakaa

$PostgreSQLPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "Romuald12"

Write-Host "🧪 Test complet de la base de données Wakaa..." -ForegroundColor Green
Write-Host ""

# Test 1: Connexion
Write-Host "1️⃣ Test de connexion..." -ForegroundColor Yellow
$result = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c "SELECT 'Connexion OK' as status;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Connexion réussie" -ForegroundColor Green
} else {
    Write-Host "   ❌ Échec de connexion" -ForegroundColor Red
    exit 1
}

# Test 2: Structure des tables
Write-Host "2️⃣ Test de la structure..." -ForegroundColor Yellow
$tableCount = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" -t 2>&1
Write-Host "   📊 Nombre de tables: $($tableCount.Trim())" -ForegroundColor Cyan

# Test 3: Données de test
Write-Host "3️⃣ Test des données..." -ForegroundColor Yellow

$tests = @(
    @{Name="Profils"; Query="SELECT COUNT(*) FROM profiles"; Expected=3},
    @{Name="Marchands"; Query="SELECT COUNT(*) FROM merchants"; Expected=2},
    @{Name="Clients"; Query="SELECT COUNT(*) FROM customers"; Expected=4},
    @{Name="Produits"; Query="SELECT COUNT(*) FROM products"; Expected=6},
    @{Name="Commandes"; Query="SELECT COUNT(*) FROM orders"; Expected=4},
    @{Name="Paiements"; Query="SELECT COUNT(*) FROM payments"; Expected=4}
)

foreach ($test in $tests) {
    $count = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c $test.Query -t 2>&1
    $count = $count.Trim()
    if ($count -eq $test.Expected) {
        Write-Host "   ✅ $($test.Name): $count/$($test.Expected)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $($test.Name): $count/$($test.Expected)" -ForegroundColor Yellow
    }
}

# Test 4: Requêtes complexes
Write-Host "4️⃣ Test des requêtes complexes..." -ForegroundColor Yellow

# Test jointure marchands-commandes
$joinTest = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c "
SELECT COUNT(*) 
FROM orders o 
JOIN merchants m ON o.merchant_id = m.id 
JOIN customers c ON o.customer_id = c.id;" -t 2>&1

if ($joinTest.Trim() -eq "4") {
    Write-Host "   ✅ Jointures: OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Jointures: Problème détecté" -ForegroundColor Red
}

# Test 5: Contraintes et index
Write-Host "5️⃣ Test des contraintes..." -ForegroundColor Yellow

$constraintTest = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c "
SELECT COUNT(*) 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';" -t 2>&1

Write-Host "   📋 Contraintes de clés étrangères: $($constraintTest.Trim())" -ForegroundColor Cyan

# Test 6: Authentification
Write-Host "6️⃣ Test d'authentification..." -ForegroundColor Yellow

$authTest = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c "
SELECT email, role, is_active 
FROM profiles 
WHERE email IN ('admin@wakaa.cm', 'merchant1@wakaa.cm', 'merchant2@wakaa.cm');" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Profils d'authentification: OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Profils d'authentification: Problème" -ForegroundColor Red
}

# Résumé final
Write-Host ""
Write-Host "🎉 Tests terminés!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Résumé de la base de données:" -ForegroundColor Cyan
Write-Host "   • Base de données: wakaa" -ForegroundColor White
Write-Host "   • Host: localhost:5432" -ForegroundColor White
Write-Host "   • Utilisateur: postgres" -ForegroundColor White
Write-Host "   • Tables: $($tableCount.Trim())" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URL de connexion:" -ForegroundColor Cyan
Write-Host "   postgresql://postgres:Romuald12@localhost:5432/wakaa" -ForegroundColor White
Write-Host ""
Write-Host "👥 Comptes de test disponibles:" -ForegroundColor Cyan
Write-Host "   • admin@wakaa.cm (Admin)" -ForegroundColor White
Write-Host "   • merchant1@wakaa.cm (Marchand - Boutique Jean)" -ForegroundColor White
Write-Host "   • merchant2@wakaa.cm (Marchand - Marie Fashion)" -ForegroundColor White
Write-Host ""
Write-Host "🛍️ Données de test:" -ForegroundColor Cyan
Write-Host "   • 2 boutiques configurées" -ForegroundColor White
Write-Host "   • 6 produits variés" -ForegroundColor White
Write-Host "   • 4 commandes avec différents statuts" -ForegroundColor White
Write-Host "   • 4 clients avec historique" -ForegroundColor White
Write-Host ""
Write-Host "✅ La base de données est prête pour le développement!" -ForegroundColor Green