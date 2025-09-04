# Script de sauvegarde de la base de données Wakaa

param(
    [string]$BackupPath = "backups",
    [string]$Password = "Romuald12"
)

$PostgreSQLPath = "C:\Program Files\PostgreSQL\17\bin"
$DatabaseName = "wakaa"
$Username = "postgres"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = "$BackupPath\wakaa_backup_$Timestamp.sql"

Write-Host "💾 Sauvegarde de la base de données Wakaa..." -ForegroundColor Green

# Créer le dossier de sauvegarde s'il n'existe pas
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
    Write-Host "📁 Dossier de sauvegarde créé: $BackupPath" -ForegroundColor Yellow
}

# Effectuer la sauvegarde
Write-Host "📋 Sauvegarde en cours..." -ForegroundColor Yellow

$env:PGPASSWORD = $Password
& "$PostgreSQLPath\pg_dump.exe" -h localhost -U $Username -d $DatabaseName -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $BackupFile).Length / 1KB
    Write-Host "✅ Sauvegarde terminée avec succès!" -ForegroundColor Green
    Write-Host "📄 Fichier: $BackupFile" -ForegroundColor Cyan
    Write-Host "📊 Taille: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Cyan
    Write-Host "🕒 Date: $Timestamp" -ForegroundColor Cyan
    
    # Compter les sauvegardes existantes
    $backupCount = (Get-ChildItem $BackupPath -Filter "wakaa_backup_*.sql").Count
    Write-Host "📚 Total des sauvegardes: $backupCount" -ForegroundColor Cyan
    
    # Nettoyer les anciennes sauvegardes (garder les 10 plus récentes)
    if ($backupCount -gt 10) {
        $oldBackups = Get-ChildItem $BackupPath -Filter "wakaa_backup_*.sql" | Sort-Object CreationTime | Select-Object -First ($backupCount - 10)
        foreach ($oldBackup in $oldBackups) {
            Remove-Item $oldBackup.FullName -Force
            Write-Host "🗑️  Ancienne sauvegarde supprimée: $($oldBackup.Name)" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "❌ Erreur lors de la sauvegarde" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💡 Pour restaurer cette sauvegarde:" -ForegroundColor Cyan
Write-Host "   .\scripts\restore-database.ps1 -BackupFile `"$BackupFile`"" -ForegroundColor White