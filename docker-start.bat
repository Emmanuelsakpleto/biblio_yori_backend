@echo off
REM Script de démarrage Docker pour YORI (Windows)

echo 🐳 Démarrage de YORI avec Docker...

REM Vérifier que Docker est installé
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker n'est pas installé. Veuillez installer Docker Desktop.
    pause
    exit /b 1
)

REM Créer les dossiers nécessaires s'ils n'existent pas
if not exist "uploads\books" mkdir uploads\books
if not exist "uploads\users" mkdir uploads\users
if not exist "logs" mkdir logs

REM Arrêter les conteneurs existants
echo 🛑 Arrêt des conteneurs existants...
docker-compose down 2>nul

REM Construire et démarrer les services
echo 🔨 Construction et démarrage des services...
docker-compose up --build -d

if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors du démarrage des services
    pause
    exit /b 1
)

REM Attendre que les services soient prêts
echo ⏳ Attente du démarrage des services...
timeout /t 30 /nobreak >nul

REM Vérifier le statut des services
echo 📊 Statut des services:
docker-compose ps

echo.
echo ✅ YORI est maintenant accessible sur:
echo    🌐 Backend API: http://localhost:3001
echo    🗄️ Base de données: localhost:3306
echo.
echo 📋 Commandes utiles:
echo    docker-compose logs -f                           # Voir les logs en temps réel
echo    docker-compose down                              # Arrêter les services
echo    docker-compose up -d                             # Redémarrer les services
echo    docker-compose exec yori-backend bash            # Accéder au conteneur backend
echo    docker-compose exec mysql mysql -u yori_user -p yori_db  # Accéder à la base
echo.
echo 🔑 Comptes de test disponibles:
echo    Admin: admin@yori.com / Password123!
echo    Étudiant: jean.dupont@student.univ.com / Password123!
echo.
pause
