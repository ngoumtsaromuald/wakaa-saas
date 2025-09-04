# =====================================================
# WAKAA - Script de Configuration Base de Données
# =====================================================

param(
    [string]$Action = "setup",
    [string]$Password = "Romuald12"
)

$PostgreSQLPath = "C:\Program Files\PostgreSQL\17\bin"
$DatabaseName = "wakaa"
$Username = "postgres"

Write-Host "🚀 Configuration de la base de données Wakaa..." -ForegroundColor Green

# Fonction pour exécuter une commande psql
function Invoke-PSQL {
    param(
        [string]$Command,
        [string]$Database = "postgres"
    )
    
    $env:PGPASSWORD = $Password
    & "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d $Database -c $Command
}

# Fonction pour exécuter un fichier SQL
function Invoke-PSQLFile {
    param(
        [string]$FilePath,
        [string]$Database = $DatabaseName
    )
    
    $env:PGPASSWORD = $Password
    & "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d $Database -f $FilePath
}

switch ($Action.ToLower()) {
    "setup" {
        Write-Host "📋 Étape 1: Vérification du service PostgreSQL..." -ForegroundColor Yellow
        
        # Vérifier si le service est en cours d'exécution
        $service = Get-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
        if ($service -and $service.Status -ne "Running") {
            Write-Host "⚠️  Le service PostgreSQL n'est pas démarré. Veuillez le démarrer manuellement." -ForegroundColor Red
            Write-Host "   Commande: Start-Service postgresql-x64-17 (en tant qu'administrateur)" -ForegroundColor Yellow
            return
        }

        Write-Host "📋 Étape 2: Création de la base de données..." -ForegroundColor Yellow
        
        # Supprimer la base de données si elle existe
        Invoke-PSQL "DROP DATABASE IF EXISTS $DatabaseName;"
        
        # Créer la nouvelle base de données
        Invoke-PSQL "CREATE DATABASE $DatabaseName WITH ENCODING='UTF8' LC_COLLATE='French_France.1252' LC_CTYPE='French_France.1252';"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Base de données '$DatabaseName' créée avec succès!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erreur lors de la création de la base de données" -ForegroundColor Red
            return
        }

        Write-Host "📋 Étape 3: Exécution des migrations..." -ForegroundColor Yellow
        
        # Exécuter le fichier de migration
        if (Test-Path "database/migration.sql") {
            Invoke-PSQLFile "database/migration.sql"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Migrations exécutées avec succès!" -ForegroundColor Green
            } else {
                Write-Host "❌ Erreur lors de l'exécution des migrations" -ForegroundColor Red
                return
            }
        } else {
            Write-Host "❌ Fichier de migration non trouvé: database/migration.sql" -ForegroundColor Red
            return
        }

        Write-Host "📋 Étape 4: Insertion des données de test..." -ForegroundColor Yellow
        
        # Exécuter le fichier de données de test
        if (Test-Path "database/seed.sql") {
            Invoke-PSQLFile "database/seed.sql"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Données de test insérées avec succès!" -ForegroundColor Green
            } else {
                Write-Host "❌ Erreur lors de l'insertion des données de test" -ForegroundColor Red
                return
            }
        } else {
            Write-Host "❌ Fichier de données de test non trouvé: database/seed.sql" -ForegroundColor Red
            return
        }

        Write-Host "🎉 Configuration terminée avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Informations de connexion:" -ForegroundColor Cyan
        Write-Host "   Host: localhost" -ForegroundColor White
        Write-Host "   Port: 5432" -ForegroundColor White
        Write-Host "   Database: $DatabaseName" -ForegroundColor White
        Write-Host "   Username: $Username" -ForegroundColor White
        Write-Host "   Password: $Password" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 URL de connexion:" -ForegroundColor Cyan
        Write-Host "   postgresql://$Username`:$Password@localhost:5432/$DatabaseName" -ForegroundColor White
    }
    
    "reset" {
        Write-Host "🔄 Réinitialisation de la base de données..." -ForegroundColor Yellow
        
        # Supprimer et recréer la base de données
        Invoke-PSQL "DROP DATABASE IF EXISTS $DatabaseName;"
        Invoke-PSQL "CREATE DATABASE $DatabaseName WITH ENCODING='UTF8';"
        
        Write-Host "✅ Base de données réinitialisée!" -ForegroundColor Green
    }
    
    "migrate" {
        Write-Host "📋 Exécution des migrations uniquement..." -ForegroundColor Yellow
        
        if (Test-Path "database/migration.sql") {
            Invoke-PSQLFile "database/migration.sql"
            Write-Host "✅ Migrations exécutées!" -ForegroundColor Green
        } else {
            Write-Host "❌ Fichier de migration non trouvé" -ForegroundColor Red
        }
    }
    
    "seed" {
        Write-Host "📋 Insertion des données de test uniquement..." -ForegroundColor Yellow
        
        if (Test-Path "database/seed.sql") {
            Invoke-PSQLFile "database/seed.sql"
            Write-Host "✅ Données de test insérées!" -ForegroundColor Green
        } else {
            Write-Host "❌ Fichier de données de test non trouvé" -ForegroundColor Red
        }
    }
    
    "status" {
        Write-Host "📊 Vérification du statut de la base de données..." -ForegroundColor Yellow
        
        # Vérifier la connexion
        $env:PGPASSWORD = $Password
        $result = & "$PostgreSQLPath\psql.exe" -h localhost -U $Username -d $DatabaseName -c "\dt" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connexion à la base de données réussie!" -ForegroundColor Green
            Write-Host "📋 Tables disponibles:" -ForegroundColor Cyan
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "❌ Impossible de se connecter à la base de données" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ Action non reconnue: $Action" -ForegroundColor Red
        Write-Host ""
        Write-Host "Actions disponibles:" -ForegroundColor Cyan
        Write-Host "  setup   - Configuration complète (défaut)" -ForegroundColor White
        Write-Host "  reset   - Réinitialiser la base de données" -ForegroundColor White
        Write-Host "  migrate - Exécuter les migrations uniquement" -ForegroundColor White
        Write-Host "  seed    - Insérer les données de test uniquement" -ForegroundColor White
        Write-Host "  status  - Vérifier le statut de la base de données" -ForegroundColor White
        Write-Host ""
        Write-Host "Exemple: .\scripts\setup-database.ps1 -Action setup -Password monmotdepasse" -ForegroundColor Yellow
    }
}