# Script pour générer des secrets sécurisés pour Wakaa
# Usage: .\scripts\generate-secrets.ps1

Write-Host "🔐 Génération de secrets sécurisés pour Wakaa" -ForegroundColor Green
Write-Host "=" * 50

# Fonction pour générer un secret aléatoire
function Generate-SecureSecret {
    param(
        [int]$Length = 32,
        [string]$Name = "Secret"
    )
    
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    $secret = -join ((1..$Length) | ForEach { $chars[(Get-Random -Maximum $chars.Length)] })
    
    Write-Host "$Name :" -ForegroundColor Yellow
    Write-Host "$secret" -ForegroundColor White
    Write-Host ""
    
    return $secret
}

# Fonction pour générer un secret hexadécimal
function Generate-HexSecret {
    param(
        [int]$Bytes = 32,
        [string]$Name = "Hex Secret"
    )
    
    $randomBytes = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($randomBytes)
    $secret = [System.BitConverter]::ToString($randomBytes) -replace '-', ''
    $rng.Dispose()
    
    Write-Host "$Name :" -ForegroundColor Yellow
    Write-Host $secret.ToLower() -ForegroundColor White
    Write-Host ""
    
    return $secret.ToLower()
}

# Génération des différents secrets
Write-Host "🔑 Secrets pour votre fichier .env.local :" -ForegroundColor Cyan
Write-Host ""

$jwtSecret = Generate-SecureSecret -Length 64 -Name "JWT_SECRET / NEXTAUTH_SECRET"
$encryptionKey = Generate-HexSecret -Bytes 32 -Name "ENCRYPTION_KEY (32 bytes hex)"
$passwordSalt = Generate-SecureSecret -Length 32 -Name "PASSWORD_SALT"
$webhookToken = Generate-SecureSecret -Length 32 -Name "WHATSAPP_VERIFY_TOKEN"

Write-Host "💡 Conseils de sécurité :" -ForegroundColor Magenta
Write-Host "- Utilisez des secrets différents pour chaque environnement"
Write-Host "- Ne commitez JAMAIS ces secrets dans Git"
Write-Host "- Changez-les régulièrement en production"
Write-Host "- Stockez-les dans un gestionnaire de secrets en production"
Write-Host ""

Write-Host "📋 Exemple de configuration pour .env.local :" -ForegroundColor Green
Write-Host "NEXTAUTH_SECRET=$jwtSecret"
Write-Host "POSTGREST_JWT_SECRET=$jwtSecret"
Write-Host "ENCRYPTION_KEY=$encryptionKey"
Write-Host "PASSWORD_SALT=$passwordSalt"
Write-Host "WHATSAPP_VERIFY_TOKEN=$webhookToken"