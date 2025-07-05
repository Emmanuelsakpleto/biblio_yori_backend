-- ===================================
-- MIGRATION 007: Table des likes de livres
-- Date: 2025-07-05
-- Description: Table pour stocker les likes globaux par livre
-- ===================================

CREATE TABLE IF NOT EXISTS book_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    likes INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_book (book_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Commentaire
ALTER TABLE book_likes COMMENT = 'Nombre de likes par livre (global, pas par utilisateur)';
