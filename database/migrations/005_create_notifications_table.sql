-- ===================================
-- MIGRATION 005: Création de la table notifications
-- Date: 2025-06-29
-- Description: Table des notifications pour les utilisateurs
-- ===================================

-- Supprimer la table si elle existe (pour les tests)
DROP TABLE IF EXISTS notifications;

-- Créer la table notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('loan_reminder', 'overdue_notice', 'reservation_ready', 'reservation_refused', 'reservation_cancelled', 'book_returned', 'admin_reminder', 'account_created', 'password_reset') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    related_loan_id INT NULL,
    related_book_id INT NULL,
    scheduled_for TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_loan_id) REFERENCES loans(id) ON DELETE SET NULL,
    FOREIGN KEY (related_book_id) REFERENCES books(id) ON DELETE SET NULL,
    
    -- Index pour optimiser les recherches
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_is_sent (is_sent),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_created_at (created_at)
);

-- Commentaires sur les colonnes
ALTER TABLE notifications 
COMMENT = 'Table des notifications envoyées aux utilisateurs';
