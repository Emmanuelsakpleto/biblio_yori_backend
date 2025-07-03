-- ===================================
-- MIGRATION 002: Création de la table books
-- Date: 2025-06-29
-- Description: Table des livres avec gestion des stocks
-- ===================================

-- Supprimer la table si elle existe (pour les tests)
DROP TABLE IF EXISTS books;

-- Créer la table books
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(300) NOT NULL,
    isbn VARCHAR(17) UNIQUE NOT NULL,
    publisher VARCHAR(200),
    publication_year YEAR,
    category VARCHAR(100),
    description TEXT,
    language VARCHAR(10) DEFAULT 'fr',
    pages INT,
    location VARCHAR(100),
    cover_image VARCHAR(255),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    status ENUM('available', 'borrowed', 'reserved', 'maintenance', 'lost', 'deleted') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour optimiser les recherches
    INDEX idx_isbn (isbn),
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_publication_year (publication_year),
    
    -- Contraintes
    CONSTRAINT chk_copies CHECK (available_copies <= total_copies),
    CONSTRAINT chk_total_copies CHECK (total_copies >= 0),
    CONSTRAINT chk_available_copies CHECK (available_copies >= 0)
);

-- Commentaires sur les colonnes
ALTER TABLE books 
COMMENT = 'Table des livres disponibles dans la bibliothèque';
