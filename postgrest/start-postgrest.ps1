# Script de démarrage PostgREST pour Wakaa
Write-Host "🚀 Démarrage de PostgREST..." -ForegroundColor Green
Write-Host "📊 Configuration: wakaa.conf" -ForegroundColor Cyan
Write-Host "🔗 URL API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📖 Documentation: http://localhost:3001/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

& ".\postgrest.exe" wakaa.conf
