# Script d'installation et configuration de PostgREST pour Wakaa

param(
    [string]$Password = "Romuald12"
)

Write-Host "🚀 Installation et configuration de PostgREST..." -ForegroundColor Green

# Créer le dossier postgrest s'il n'existe pas
$PostgRESTDir = "postgrest"
if (!(Test-Path $PostgRESTDir)) {
    New-Item -ItemType Directory -Path $PostgRESTDir -Force
    Write-Host "📁 Dossier PostgREST créé" -ForegroundColor Yellow
}

# URL de téléchargement PostgREST pour Windows
$PostgRESTVersion = "v12.2.3"
$DownloadUrl = "https://github.com/PostgREST/postgrest/releases/download/$PostgRESTVersion/postgrest-$PostgRESTVersion-windows-x64.zip"
$ZipFile = "$PostgRESTDir\postgrest.zip"
$ExeFile = "$PostgRESTDir\postgrest.exe"

# Télécharger PostgREST si pas déjà présent
if (!(Test-Path $ExeFile)) {
    Write-Host "📥 Téléchargement de PostgREST $PostgRESTVersion..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipFile -UseBasicParsing
        Write-Host "✅ Téléchargement terminé" -ForegroundColor Green
        
        # Extraire le fichier ZIP
        Write-Host "📦 Extraction..." -ForegroundColor Yellow
        Expand-Archive -Path $ZipFile -DestinationPath $PostgRESTDir -Force
        
        # Supprimer le fichier ZIP
        Remove-Item $ZipFile -Force
        
        Write-Host "✅ PostgREST installé avec succès!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors du téléchargement: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ℹ️  PostgREST déjà installé" -ForegroundColor Cyan
}

# Créer le fichier de configuration PostgREST
$ConfigFile = "$PostgRESTDir\wakaa.conf"
$ConfigContent = @"
# Configuration PostgREST pour Wakaa
db-uri = "postgresql://postgres:$Password@localhost:5432/wakaa"
db-schemas = "public"
db-anon-role = "postgres"
db-pool = 10
db-pool-acquisition-timeout = 10

server-host = "localhost"
server-port = 3001

# JWT (optionnel pour le développement)
# jwt-secret = "wakaa-jwt-secret-key"
# jwt-aud = "wakaa"

# CORS
server-cors-allowed-origins = "*"

# Logging
log-level = "info"

# OpenAPI
openapi-mode = "follow-privileges"
openapi-server-proxy-uri = "http://localhost:3001"
"@

Write-Host "📝 Création du fichier de configuration..." -ForegroundColor Yellow
$ConfigContent | Out-File -FilePath $ConfigFile -Encoding UTF8

# Créer un script de démarrage
$StartScript = "$PostgRESTDir\start-postgrest.ps1"
$StartContent = @"
# Script de démarrage PostgREST pour Wakaa
Write-Host "🚀 Démarrage de PostgREST..." -ForegroundColor Green
Write-Host "📊 Configuration: wakaa.conf" -ForegroundColor Cyan
Write-Host "🔗 URL API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📖 Documentation: http://localhost:3001/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

& ".\postgrest.exe" wakaa.conf
"@

$StartContent | Out-File -FilePath $StartScript -Encoding UTF8

# Créer un script de test
$TestScript = "$PostgRESTDir\test-postgrest.ps1"
$TestContent = @"
# Test de PostgREST
Write-Host "🧪 Test de PostgREST..." -ForegroundColor Green

try {
    `$response = Invoke-RestMethod -Uri "http://localhost:3001/" -Method GET
    Write-Host "✅ PostgREST est accessible!" -ForegroundColor Green
    Write-Host "📊 Version: `$(`$response.version)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ PostgREST n'est pas accessible" -ForegroundColor Red
    Write-Host "   Assurez-vous qu'il est démarré avec: .\start-postgrest.ps1" -ForegroundColor Yellow
}

# Test des tables
try {
    `$tables = Invoke-RestMethod -Uri "http://localhost:3001/merchants?limit=1" -Method GET
    Write-Host "✅ Connexion à la base de données OK!" -ForegroundColor Green
    Write-Host "📋 Tables accessibles via l'API" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Problème de connexion à la base de données" -ForegroundColor Red
    Write-Host "   Vérifiez que PostgreSQL est démarré et que la base 'wakaa' existe" -ForegroundColor Yellow
}
"@

$TestContent | Out-File -FilePath $TestScript -Encoding UTF8

Write-Host ""
Write-Host "✅ PostgREST configuré avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Démarrer PostgREST:" -ForegroundColor White
Write-Host "   cd postgrest && .\start-postgrest.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Tester PostgREST:" -ForegroundColor White
Write-Host "   cd postgrest && .\test-postgrest.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Démarrer l'application Next.js:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 URLs importantes:" -ForegroundColor Cyan
Write-Host "   • API PostgREST: http://localhost:3001" -ForegroundColor White
Write-Host "   • Documentation API: http://localhost:3001/" -ForegroundColor White
Write-Host "   • Application Wakaa: http://localhost:3000" -ForegroundColor White