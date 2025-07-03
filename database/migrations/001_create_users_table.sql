-- ===================================
-- MIGRATION 001: Création de la table users
-- Date: 2025-06-29
-- Description: Table des utilisateurs avec rôles et authentification
-- ===================================

-- Supprimer la table si elle existe (pour les tests)
DROP TABLE IF EXISTS users;

-- Créer la table users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    student_id VARCHAR(20) UNIQUE,
    department VARCHAR(100),
    role ENUM('admin', 'librarian', 'student') DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    profile_image VARCHAR(255),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour optimiser les recherches
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Commentaires sur les colonnes
ALTER TABLE users 
COMMENT = 'Table des utilisateurs du système de bibliothèque';
