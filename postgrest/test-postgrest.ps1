# Test de PostgREST
Write-Host "🧪 Test de PostgREST..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/" -Method GET
    Write-Host "✅ PostgREST est accessible!" -ForegroundColor Green
    Write-Host "📊 Version: $($response.version)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ PostgREST n'est pas accessible" -ForegroundColor Red
    Write-Host "   Assurez-vous qu'il est démarré avec: .\start-postgrest.ps1" -ForegroundColor Yellow
}

# Test des tables
try {
    $tables = Invoke-RestMethod -Uri "http://localhost:3001/merchants?limit=1" -Method GET
    Write-Host "✅ Connexion à la base de données OK!" -ForegroundColor Green
    Write-Host "📋 Tables accessibles via l'API" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Problème de connexion à la base de données" -ForegroundColor Red
    Write-Host "   Vérifiez que PostgreSQL est démarré et que la base 'wakaa' existe" -ForegroundColor Yellow
}
