-- ===================================
-- SEEDER 004: Avis (reviews) sur les livres
-- Date: 2025-07-05
-- ===================================

-- Vider la table reviews avant d'insérer
DELETE FROM reviews;

-- Insérer des avis réalistes pour les livres empruntés/rendus
INSERT INTO reviews (user_id, book_id, rating, comment, is_approved, created_at, updated_at) VALUES
-- Jean Dupont sur "Clean Code"
(3, 11, 5, 'Un incontournable pour tout développeur. Clair, structuré, et motivant.', TRUE, '2025-07-01', '2025-07-01'),
-- Jean Dupont sur "JavaScript: The Definitive Guide"
(3, 13, 4, 'Très complet, mais parfois un peu dense pour les débutants.', TRUE, '2025-07-02', '2025-07-02'),
-- Pierre Durand sur "L''Étranger"
(5, 45, 5, 'Un chef-d’œuvre de la littérature française. Lecture marquante.', TRUE, '2025-07-03', '2025-07-03'),
-- Hyacinthe DOHI sur "Algorithms"
(8, 15, 4, 'Bon livre pour comprendre les bases, mais nécessite quelques prérequis.', TRUE, '2025-07-04', '2025-07-04'),
-- Hyacinthe DOHI sur "Le Rouge et le Noir"
(8, 19, 5, 'Roman passionnant, très bien écrit. Je recommande vivement.', TRUE, '2025-07-04', '2025-07-04');
