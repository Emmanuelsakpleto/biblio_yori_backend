-- ===================================
-- SEEDER 003: Emprunts de démonstration (VERSION CORRIGÉE)
-- Date: 2025-07-05
-- Description: Quelques emprunts d'exemple pour tester le système avec les bons IDs
-- Note: Les utilisateurs étudiants ont les IDs 4, 5, 6, 7, 8 selon le seeder users
-- ===================================

-- Vider la table loans (pour les tests)
DELETE FROM loans;

-- Insérer des emprunts d'exemple
-- Note: Les IDs des utilisateurs et livres doivent correspondre aux seeders précédents

-- Emprunts de démonstration (seulement pour les étudiants)
INSERT INTO loans (
    user_id, 
    book_id, 
    loan_date, 
    due_date, 
    status, 
    notes
) VALUES
-- Étudiant Principal (user_id: 4) - Emprunt actif sur "Clean Code" (id: 11)
(4, 11, '2025-06-01', '2025-07-10', 'active', 'Projet de fin d''études'),
-- Jean Dupont (user_id: 5) - Emprunt en retard sur "JavaScript: The Definitive Guide" (id: 13)
(5, 13, '2025-05-01', '2025-06-01', 'overdue', 'A rendre rapidement'),
-- Marie Martin (user_id: 6) - Emprunt pending (réservation) sur "Python Crash Course" (id: 14)
(6, 14, '2025-07-01', '2025-07-20', 'pending', 'Réservation en attente'),
-- Pierre Durand (user_id: 7) - Emprunt retourné sur "L'Étranger" (id: 45)
(7, 45, '2025-05-10', '2025-06-10', 'returned', 'Livre rendu à temps'),
-- Test User (user_id: 8) - Emprunt actif sur "Algorithms" (id: 15)
(8, 15, '2025-06-20', '2025-07-20', 'active', 'Lecture personnelle'),
-- Pierre Durand (user_id: 7) - Emprunt annulé sur "Le Petit Prince" (id: 46)
(7, 46, '2025-06-15', '2025-07-15', 'cancelled', 'Annulé par l'utilisateur'),
-- Marie Martin (user_id: 6) - Emprunt refusé sur "1984" (id: 47)
(6, 47, '2025-06-18', '2025-07-18', 'refused', 'Refusé par l'admin'),
-- Test User (user_id: 8) - Emprunt pending (réservation) sur "Pride and Prejudice" (id: 48)
(8, 48, '2025-07-02', '2025-07-22', 'pending', 'En attente de validation'),
-- Jean Dupont (user_id: 5) - Emprunt retourné sur "Les Misérables" (id: 44)
(5, 44, '2025-05-15', '2025-06-15', 'returned', 'Rendu après rappel'),
-- Étudiant Principal (user_id: 4) - Emprunt actif sur "Calculus: Early Transcendentals" (id: 26)
(4, 26, '2025-07-01', '2025-07-30', 'active', 'Lecture d'été'),
-- Marie Martin (user_id: 6) - Emprunt en retard sur "Linear Algebra and Its Applications" (id: 27)
(6, 27, '2025-05-10', '2025-06-10', 'overdue', 'Toujours pas rendu'),
-- Test User (user_id: 8) - Emprunt annulé sur "Statistics for Engineers and Scientists" (id: 28)
(8, 28, '2025-06-20', '2025-07-20', 'cancelled', 'Annulé par l'utilisateur'),
-- Jean Dupont (user_id: 5) - Emprunt refusé sur "Discrete Mathematics and Its Applications" (id: 29)
(5, 29, '2025-06-25', '2025-07-25', 'refused', 'Refusé par l'admin');

-- Mettre à jour la date de retour pour les emprunts rendus
UPDATE loans 
SET return_date = '2025-06-10' 
WHERE user_id = 7 AND book_id = 45;

UPDATE loans 
SET return_date = '2025-06-15' 
WHERE user_id = 5 AND book_id = 44;

-- Mettre à jour les copies disponibles des livres empruntés (status = 'active')
UPDATE books SET available_copies = available_copies - 1 WHERE id IN (11, 15, 26);

-- Statistiques des emprunts
SELECT 
    l.status,
    COUNT(*) as nombre_emprunts
FROM loans l
JOIN users u ON l.user_id = u.id
JOIN books b ON l.book_id = b.id
GROUP BY l.status;

-- Vue détaillée des emprunts actifs
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as emprunteur,
    u.email,
    b.title as livre,
    l.loan_date as date_emprunt,
    l.due_date as date_echeance,
    l.status,
    CASE 
        WHEN l.due_date < CURDATE() AND l.status = 'active' THEN 'EN RETARD'
        WHEN l.due_date = CURDATE() AND l.status = 'active' THEN 'ÉCHÉANCE AUJOURD''HUI'
        ELSE 'OK'
    END as alerte
FROM loans l
JOIN users u ON l.user_id = u.id
JOIN books b ON l.book_id = b.id
WHERE l.status IN ('active', 'overdue')
ORDER BY l.due_date;
