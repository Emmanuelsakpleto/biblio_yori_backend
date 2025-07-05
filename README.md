# YORI - Système de Gestion de Bibliothèque

## Configuration et Installation

### Prérequis
- Node.js (v14 ou plus récent)
- MySQL/MariaDB
- npm ou yarn

### Installation
```bash
cd Backend
npm install
```

### Configuration de la base de données

#### Variables d'environnement
Créer un fichier `.env` dans le dossier Backend :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=yori_db
JWT_SECRET=votre_jwt_secret
PORT=5000
```

#### Initialisation de la base de données

**Option 1 : Première installation**
```bash
npm run db:init
```

**Option 2 : Reset complet (supprime tout et recrée)**
```bash
npm run db:reset
```

**Option 3 : Installation simple**
```bash
npm run db:setup
```

Ces commandes exécutent le fichier `database/yori_complete.sql` qui contient :
- Création de la base de données
- Toutes les tables avec leurs contraintes
- Données de démonstration (utilisateurs, livres, emprunts, etc.)

## Structure du Backend

### Architecture du projet
```
Backend/
├── 📁 src/                          # Code source principal
│   ├── 📁 controllers/              # Contrôleurs (logique métier)
│   │   ├── admin.controller.js      # Gestion admin/stats
│   │   ├── auth.controller.js       # Authentification
│   │   ├── book.controller.js       # Gestion des livres
│   │   ├── loan.controller.js       # Gestion des emprunts
│   │   ├── notification.controller.js # Notifications
│   │   └── user.controller.js       # Gestion utilisateurs
│   │
│   ├── 📁 middleware/               # Middlewares (sécurité, validation)
│   │   ├── auth.middleware.js       # Vérification JWT
│   │   ├── validation.middleware.js # Validation des données
│   │   └── upload.middleware.js     # Upload de fichiers
│   │
│   ├── 📁 models/                   # Modèles de données (ORM)
│   │   ├── User.js                  # Modèle utilisateur
│   │   ├── Book.js                  # Modèle livre
│   │   ├── Loan.js                  # Modèle emprunt
│   │   └── Notification.js          # Modèle notification
│   │
│   ├── 📁 routes/                   # Routes API
│   │   ├── admin.routes.js          # /api/admin/*
│   │   ├── auth.routes.js           # /api/auth/*
│   │   ├── book.routes.js           # /api/books/*
│   │   ├── loan.routes.js           # /api/loans/*
│   │   └── user.routes.js           # /api/users/*
│   │
│   ├── 📁 services/                 # Services métier
│   │   ├── auth.service.js          # Logique d'authentification
│   │   ├── book.service.js          # Logique des livres
│   │   ├── loan.service.js          # Logique des emprunts
│   │   └── notification.service.js  # Logique des notifications
│   │
│   ├── 📁 utils/                    # Utilitaires
│   │   ├── logger.js                # Configuration des logs
│   │   ├── database.js              # Connexion base de données
│   │   └── helpers.js               # Fonctions utilitaires
│   │
│   ├── 📁 validators/               # Validation des données
│   │   ├── auth.validators.js       # Validation auth
│   │   ├── book.validators.js       # Validation livres
│   │   └── user.validators.js       # Validation utilisateurs
│   │
│   ├── 📄 app.js                    # Configuration Express
│   └── 📄 server.js                 # Point d'entrée du serveur
│
├── 📁 database/                     # Base de données
│   ├── 📄 yori_complete.sql         # Script SQL complet
│   └── 📄 init-simple.js            # Script d'initialisation
│
├── 📁 public/                       # Fichiers statiques
│   └── 📁 images/                   # Images par défaut
│
├── 📁 uploads/                      # Fichiers uploadés
│   ├── 📁 books/                    # Couvertures de livres
│   └── 📁 users/                    # Photos de profil
│
├── 📁 logs/                         # Fichiers de logs
│   ├── 📄 combined.log              # Tous les logs
│   └── 📄 error.log                 # Erreurs uniquement
│
├── 📄 package.json                  # Dépendances et scripts
├── 📄 .env.example                  # Configuration exemple
└── 📄 README.md                # Cette documentation
```

### Flux de données
```
Client (Frontend) 
    ↕ HTTP/HTTPS
🔐 Middleware d'authentification
    ↕
📋 Contrôleurs (logique métier)
    ↕
⚙️ Services (business logic)
    ↕ 
🗄️ Base de données MySQL
```

### Architecture technique

#### Pattern MVC (Model-View-Controller)
- **Models** (`src/models/`) : Définition des structures de données et interactions avec la base
- **Controllers** (`src/controllers/`) : Logique métier et traitement des requêtes
- **Routes** (`src/routes/`) : Définition des endpoints API et routage

#### Sécurité
- **JWT** : Authentification stateless avec tokens d'accès et de rafraîchissement
- **Bcrypt** : Hachage sécurisé des mots de passe
- **CORS** : Configuration des origines autorisées
- **Rate Limiting** : Protection contre les attaques par déni de service
- **Validation** : Vérification des données d'entrée avec Joi

#### Technologies utilisées
- **Node.js + Express** : Serveur web et API REST
- **MySQL2** : Driver de base de données avec support des promesses
- **Winston** : Système de logging structuré
- **Multer** : Upload de fichiers (images de profil, couvertures)
- **Node-cron** : Tâches programmées (nettoyage, notifications)

#### Middlewares principaux
1. **auth.middleware.js** : Vérification des tokens JWT
2. **validation.middleware.js** : Validation des données avec Joi
3. **upload.middleware.js** : Gestion de l'upload de fichiers
4. **error.middleware.js** : Gestion centralisée des erreurs
```

### Démarrage du serveur

**Mode développement (avec rechargement automatique) :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

Le serveur sera accessible sur `http://localhost:3001`

## Structure de la base de données

### Tables principales
- **users** : Utilisateurs (admin, librarian, student)
- **books** : Catalogue des livres
- **loans** : Emprunts et réservations
- **reviews** : Avis et évaluations des livres
- **notifications** : Système de notifications
- **user_book_likes** : Système de likes par utilisateur
- **user_sessions** : Sessions et tokens de sécurité

### Relations entre les tables
```
users (1) ←→ (N) loans ←→ (1) books
users (1) ←→ (N) reviews ←→ (1) books
users (1) ←→ (N) notifications
users (1) ←→ (N) user_book_likes ←→ (1) books
users (1) ←→ (N) user_sessions
```

### Contraintes et index
- **Clés étrangères** : Suppression en cascade pour maintenir l'intégrité
- **Index** : Optimisation des requêtes sur les champs fréquemment utilisés
- **Contraintes uniques** : Email utilisateur, ISBN livre, like par utilisateur/livre
```

### Comptes de démonstration

**Administrateur :**
- Email: `admin@yori.com`
- Mot de passe: `Password123!`

**Bibliothécaire :**
- Email: `librarian@yori.com`
- Mot de passe: `Password123!`

**Étudiants :**
- Email: `jean.dupont@student.univ.com` - Mot de passe: `Password123!`
- Email: `marie.martin@student.univ.com` - Mot de passe: `Password123!`
- Email: `pierre.durand@student.univ.com` - Mot de passe: `Password123!`

## Fonctionnalités principales

### Frontend (Next.js)
- Dashboard adaptatif selon le rôle utilisateur
- Gestion des emprunts et réservations
- Système de likes sur les livres
- Notifications en temps réel
- Interface d'administration complète

### Backend (Node.js/Express)
- API REST sécurisée avec JWT
- Gestion des rôles et permissions
- Upload d'images
- Système de notifications
- Logs et monitoring

### Sécurité
- Authentification JWT avec refresh tokens
- Hachage des mots de passe (bcrypt)
- Protection CORS
- Rate limiting
- Validation des données

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/refresh` - Renouvellement token
- `POST /api/auth/logout` - Déconnexion

### Livres
- `GET /api/books` - Liste des livres
- `GET /api/books/:id` - Détail d'un livre
- `POST /api/books/:id/like` - Liker un livre
- `GET /api/books/:id/reviews` - Avis sur un livre

### Emprunts
- `GET /api/loans` - Mes emprunts
- `POST /api/loans` - Nouveau emprunt
- `PUT /api/loans/:id` - Modifier un emprunt

### Administration
- `GET /api/admin/users` - Gestion des utilisateurs
- `GET /api/admin/stats` - Statistiques
- `PUT /api/admin/users/:id` - Modifier un utilisateur

## Tests

Le système inclut des données de test réalistes :
- 5 utilisateurs (admin, librarian, 3 étudiants)
- 12 livres dans différentes catégories
- Emprunts en cours et historique
- Notifications et avis
- Système de likes fonctionnel

## Support

Pour toute question ou problème :
1. Vérifier que MySQL est démarré
2. Vérifier les variables d'environnement
3. Exécuter `npm run db:reset` en cas de problème de base de données
4. Consulter les logs dans `logs/combined.log`
