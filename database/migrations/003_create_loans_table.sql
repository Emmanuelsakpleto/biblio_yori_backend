-- ===================================
-- MIGRATION 003: Création de la table loans
-- Date: 2025-06-29
-- Description: Table des emprunts avec gestion des dates
-- ===================================

-- Supprimer la table si elle existe (pour les tests)
DROP TABLE IF EXISTS loans;

-- Créer la table loans
CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    loan_date DATE NOT NULL DEFAULT (CURDATE()),
    due_date DATE NOT NULL,
    return_date DATE NULL,
    extension_count INT DEFAULT 0,
    status ENUM('active', 'returned', 'overdue', 'extended') DEFAULT 'active',
    notes TEXT,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    
    -- Index pour optimiser les recherches
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_loan_date (loan_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status),
    INDEX idx_return_date (return_date),
    
    -- Contraintes
    CONSTRAINT chk_dates CHECK (due_date >= loan_date),
    CONSTRAINT chk_return_date CHECK (return_date IS NULL OR return_date >= loan_date),
    CONSTRAINT chk_extension_count CHECK (extension_count >= 0),
    CONSTRAINT chk_fine_amount CHECK (fine_amount >= 0)
);

-- Commentaires sur les colonnes
ALTER TABLE loans 
COMMENT = 'Table des emprunts de livres';
