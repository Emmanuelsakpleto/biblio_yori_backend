#!/bin/bash

# Script de démarrage Docker pour YORI
# Ce script facilite le lancement de l'application avec Docker

echo "🐳 Démarrage de YORI avec Docker..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
fi

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible."
    exit 1
fi

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p uploads/books uploads/users logs

# Fonction pour utiliser docker-compose ou docker compose
run_compose() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
run_compose down

# Construire et démarrer les services
echo "🔨 Construction et démarrage des services..."
run_compose up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier le statut des services
echo "📊 Statut des services:"
run_compose ps

# Afficher les logs si nécessaire
if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
    echo "📝 Affichage des logs en temps réel..."
    run_compose logs -f
else
    echo ""
    echo "✅ YORI est maintenant accessible sur:"
    echo "   🌐 Backend API: http://localhost:3001"
    echo "   🗄️  Base de données: localhost:3306"
    echo ""
    echo "📋 Commandes utiles:"
    echo "   docker-compose logs -f          # Voir les logs en temps réel"
    echo "   docker-compose down             # Arrêter les services"
    echo "   docker-compose up -d            # Redémarrer les services"
    echo "   docker-compose exec yori-backend bash  # Accéder au conteneur backend"
    echo "   docker-compose exec mysql mysql -u yori_user -p yori_db  # Accéder à la base"
    echo ""
    echo "🔑 Comptes de test disponibles:"
    echo "   Admin: admin@yori.com / Password123!"
    echo "   Étudiant: jean.dupont@student.univ.com / Password123!"
fi
