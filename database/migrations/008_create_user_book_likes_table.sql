-- ===================================
-- MIGRATION 008: Table des likes individuels
-- Date: 2025-07-05
-- Description: Table pour stocker les likes individuels par utilisateur et livre
-- ===================================

CREATE TABLE IF NOT EXISTS user_book_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_book (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_user_book_likes_user_id ON user_book_likes(user_id);
CREATE INDEX idx_user_book_likes_book_id ON user_book_likes(book_id);

-- Commentaire
ALTER TABLE user_book_likes COMMENT = 'Likes individuels par utilisateur et livre';
