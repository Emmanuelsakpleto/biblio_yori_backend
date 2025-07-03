# 🗄️ Base de Données - Migrations et Seeders

## 📖 Vue d'ensemble

Ce système utilise des **migrations** pour créer la structure de la base de données et des **seeders** pour l'alimenter avec des données de test.

## 🚀 Commandes disponibles

### Initialisation complète
```bash
# Créer toutes les tables et insérer les données de test
npm run db:init
```

### Réinitialisation
```bash
# Supprimer toutes les tables
npm run db:reset

# Supprimer et recréer tout (reset + init)
npm run db:fresh
```

### Commandes alternatives
```bash
# Alias pour db:init
npm run db:migrate
npm run db:seed
```

## 📊 Structure de la base de données

### Tables créées

1. **`users`** - Utilisateurs du système
   - Rôles: `admin`, `librarian`, `student`
   - Authentification par email/mot de passe

2. **`books`** - Catalogue des livres
   - Gestion des stocks (copies totales/disponibles)
   - Statuts: `available`, `borrowed`, `reserved`, `maintenance`, `lost`

3. **`loans`** - Emprunts de livres
   - Suivi des dates d'emprunt et retour
   - Statuts: `active`, `returned`, `overdue`, `extended`

4. **`reviews`** - Avis sur les livres
   - Notes de 1 à 5 étoiles
   - Modération par les administrateurs

5. **`notifications`** - Notifications utilisateurs
   - Types: rappels, alertes, confirmations

## 👥 Comptes par défaut créés

### 🔑 Administrateur
- **Email:** `admin@lectura.com`
- **Rôle:** `admin`
- **Accès:** Gestion complète du système

### 📚 Bibliothécaire
- **Email:** `librarian@lectura.com`
- **Rôle:** `librarian`
- **Accès:** Gestion des livres et emprunts

### 🎓 Étudiant principal
- **Email:** `student@lectura.com`
- **Rôle:** `student`
- **Accès:** Emprunts et consultation

### 👨‍🎓 Étudiants de test
- `jean.dupont@student.univ.com`
- `marie.martin@student.univ.com`
- `pierre.durand@student.univ.com`
- `test@example.com`

> **🔒 Mot de passe pour tous les comptes:** `Password123!`

## 📚 Données de test incluses

### Livres (10 exemples)
- **Informatique:** Algorithmes, Clean Code, JavaScript
- **Mathématiques:** Analyse, Algèbre linéaire
- **Physique:** Mécanique, Électromagnétisme
- **Littérature:** Les Misérables, L'Étranger
- **Art:** Histoire de l'art

### Emprunts (5 exemples)
- Emprunts actifs, retournés et en retard
- Différents utilisateurs et livres
- Historique réaliste

## 🔧 Fichiers de migration

```
database/
├── migrations/           # Structure des tables
│   ├── 001_create_users_table.sql
│   ├── 002_create_books_table.sql
│   ├── 003_create_loans_table.sql
│   ├── 004_create_reviews_table.sql
│   └── 005_create_notifications_table.sql
├── seeders/             # Données de test
│   ├── 001_users_seeder.sql
│   ├── 002_books_seeder.sql
│   └── 003_loans_seeder.sql
├── init-database.js     # Script principal
└── reset-database.js    # Script de réinitialisation
```

## ⚙️ Configuration

Assurez-vous que votre fichier `.env` contient :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=lectura_db
```

## 🚨 Dépannage

### Erreur "Table doesn't exist"
```bash
npm run db:reset
npm run db:init
```

### Erreur de permissions MySQL
```bash
# Vérifiez les droits utilisateur dans MySQL
GRANT ALL PRIVILEGES ON lectura_db.* TO 'votre_user'@'localhost';
FLUSH PRIVILEGES;
```

### Données corrompues
```bash
# Réinitialisation complète
npm run db:fresh
```

## 📝 Personnalisation

Pour ajouter vos propres données :

1. **Nouvelle migration :**
   ```sql
   -- database/migrations/006_votre_migration.sql
   CREATE TABLE votre_table (...);
   ```

2. **Nouveau seeder :**
   ```sql
   -- database/seeders/004_votre_seeder.sql
   INSERT INTO votre_table VALUES (...);
   ```

3. **Mettre à jour le script d'init :**
   ```javascript
   // Ajouter dans database/init-database.js
   const migrations = [..., {
     file: 'database/migrations/006_votre_migration.sql',
     description: 'Votre description'
   }];
   ```

---

✨ **Prêt à utiliser !** Votre base de données est maintenant configurée avec tous les comptes et données nécessaires pour tester l'API LECTURA.
