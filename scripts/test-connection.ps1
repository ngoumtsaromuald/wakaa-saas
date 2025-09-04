# Test de connexion PostgreSQL pour Wakaa

$PostgreSQLPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "Romuald12"

Write-Host "🔍 Test de connexion à PostgreSQL..." -ForegroundColor Yellow

# Test de connexion
try {
    $result = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL est accessible!" -ForegroundColor Green
        Write-Host "Version: $($result | Select-String 'PostgreSQL')" -ForegroundColor Cyan
        
        # Vérifier si la base wakaa existe
        $dbCheck = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname='wakaa';" 2>&1
        
        if ($dbCheck -match "1") {
            Write-Host "✅ Base de données 'wakaa' trouvée!" -ForegroundColor Green
            
            # Compter les tables
            $tableCount = & "$PostgreSQLPath\psql.exe" -h localhost -U postgres -d wakaa -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1
            Write-Host "📊 Nombre de tables: $($tableCount | Select-String '\d+' | ForEach-Object { $_.Matches[0].Value })" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Base de données 'wakaa' non trouvée" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Impossible de se connecter à PostgreSQL" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur lors du test de connexion: $($_.Exception.Message)" -ForegroundColor Red
}