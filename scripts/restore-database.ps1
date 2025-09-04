# Script de restauration de la base de données Wakaa

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$Password = "Romuald12"
)

$PostgreSQLPath = "C:\Program Files\PostgreSQL\17\bin"
$DatabaseName = "wakaa"
$Username = "postgres"

Write-Host "🔄 Restauration de la base de données Wakaa..." -ForegroundColor Green

# Vérifier que le fichier de sauvegarde existe
if (!(Test-Path $BackupFile)) {
    Write-Host "❌ Fichier de sauvegarde non trouvé: $BackupFile" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $BackupFile).Length / 1KB
Write-Host "📄 Fichier de sauvegarde: $BackupFile" -ForegroundColor Cyan
Write-Host "📊 Taille: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Cyan

# Demander confirmation
Write-Host ""
Write-Host "⚠️  ATTENTION: Cette opération va:" -ForegroundColor Yellow
Write-Host "   • Supprimer toutes les données actuelles" -ForegroundColor Red
Write-Host "   • Restaurer les données depuis la sauvegarde" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Êtes-vous sûr de vouloir continuer? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host "❌ Restauration annulée" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📋 Restauration en cours..." -ForegroundColor Yellow

# Supprimer et recréer la base de données
$env:PGPASSWORD = $Password

Write-Host "🗑️  Suppression de la base de données existante..." -ForegroundColor Yellow
& "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d postgres -c "DROP DATABASE IF EXISTS $DatabaseName;"

Write-Host "🆕 Création d'une nouvelle base de données..." -ForegroundColor Yellow
& "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d postgres -c "CREATE DATABASE $DatabaseName WITH ENCODING='UTF8';"

# Restaurer depuis la sauvegarde
Write-Host "📥 Restauration des données..." -ForegroundColor Yellow
& "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d $DatabaseName -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Restauration terminée avec succès!" -ForegroundColor Green
    
    # Vérifier les données restaurées
    Write-Host "📊 Vérification des données restaurées..." -ForegroundColor Yellow
    
    $tables = @("profiles", "merchants", "customers", "products", "orders", "payments")
    foreach ($table in $tables) {
        $count = & "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d $DatabaseName -c "SELECT COUNT(*) FROM $table;" -t 2>&1
        if ($count) {
            Write-Host "   ✅ $table : $($count.Trim()) enregistrements" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Base de données restaurée avec succès!" -ForegroundColor Green
    Write-Host "🔗 URL: postgresql://postgres:$Password@localhost:5432/$DatabaseName" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Erreur lors de la restauration" -ForegroundColor Red
    exit 1
}