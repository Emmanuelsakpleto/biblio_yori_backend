-- ===================================
-- MIGRATION 006: Création de la table user_sessions
-- Date: 2025-06-29
-- Description: Table des sessions utilisateur pour la gestion des tokens de rafraîchissement
-- ===================================

-- Supprimer la table si elle existe (pour les tests)
DROP TABLE IF EXISTS user_sessions;

-- Créer la table user_sessions
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Index pour optimiser les recherches
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
);

-- Commentaires sur les colonnes
ALTER TABLE user_sessions 
COMMENT = 'Table des sessions utilisateur avec tokens de rafraîchissement';
