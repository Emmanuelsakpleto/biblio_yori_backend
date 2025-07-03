-- ===================================
-- MIGRATION 004: Création de la table reviews
-- Date: 2025-06-29
-- Description: Table des avis et évaluations des livres
-- ===================================

-- Supprimer la table si elle existe (pour les tests)
DROP TABLE IF EXISTS reviews;

-- Créer la table reviews
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    
    -- Index pour optimiser les recherches
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_rating (rating),
    INDEX idx_is_approved (is_approved),
    
    -- Contraintes
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT unique_user_book UNIQUE (user_id, book_id)
);

-- Commentaires sur les colonnes
ALTER TABLE reviews 
COMMENT = 'Table des avis et évaluations des livres par les utilisateurs';
