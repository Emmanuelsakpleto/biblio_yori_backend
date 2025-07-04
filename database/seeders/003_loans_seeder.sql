-- ===================================
-- SEEDER 003: Emprunts de démonstration
-- Date: 2025-06-29
-- Description: Quelques emprunts d'exemple pour tester le système
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
-- Jean Dupont (id: 3) - Emprunt actif sur "Clean Code" (id: 11)
(3, 11, '2025-06-01', '2025-07-10', 'active', 'Projet de fin d''études'),
-- Jean Dupont (id: 3) - Emprunt en retard sur "JavaScript: The Definitive Guide" (id: 13)
(3, 13, '2025-05-01', '2025-06-01', 'overdue', 'A rendre rapidement'),
-- Marie Martin (id: 4) - Emprunt pending (réservation) sur "Python Crash Course" (id: 14)
(4, 14, '2025-07-01', '2025-07-20', 'pending', 'Réservation en attente'),
-- Pierre Durand (id: 5) - Emprunt retourné sur "L'Étranger" (id: 45)
(5, 45, '2025-05-10', '2025-06-10', 'returned', 'Livre rendu à temps'),
-- Hyacinthe DOHI (id: 8) - Emprunt actif sur "Algorithms" (id: 15)
(8, 15, '2025-06-20', '2025-07-20', 'active', 'Lecture personnelle'),
-- Jean Dupont (id: 3) - Emprunt annulé sur "Le Petit Prince" (id: 16)
(5, 16, '2025-06-15', '2025-07-15', 'cancelled', 'Annulé par l’utilisateur'),
-- Marie Martin (id: 4) - Emprunt refusé sur "1984" (id: 17)
(4, 17, '2025-06-18', '2025-07-18', 'refused', 'Refusé par l’admin'),
-- Pierre Durand (id: 5) - Emprunt pending (réservation) sur "Sapiens" (id: 18)
(5, 18, '2025-07-02', '2025-07-22', 'pending', 'En attente de validation'),
-- Hyacinthe DOHI (id: 8) - Emprunt retourné sur "Le Rouge et le Noir" (id: 19)
(8, 19, '2025-05-15', '2025-06-15', 'returned', 'Rendu après rappel'),
-- Jean Dupont (id: 3) - Emprunt actif sur "L'Art de la Guerre" (id: 20)
(3, 20, '2025-07-01', '2025-07-30', 'active', 'Lecture d’été'),
-- Marie Martin (id: 4) - Emprunt en retard sur "Le Meilleur des mondes" (id: 21)
(4, 21, '2025-05-10', '2025-06-10', 'overdue', 'Toujours pas rendu'),
-- Pierre Durand (id: 5) - Emprunt annulé sur "Le Comte de Monte-Cristo" (id: 22)
(5, 22, '2025-06-20', '2025-07-20', 'cancelled', 'Annulé par l’utilisateur'),
-- Hyacinthe DOHI (id: 8) - Emprunt refusé sur "Les Misérables" (id: 23)
(8, 23, '2025-06-25', '2025-07-25', 'refused', 'Refusé par l’admin');


-- Mettre à jour la date de retour pour l'emprunt rendu (Pierre Durand)
UPDATE loans 
SET return_date = '2025-06-10' 
WHERE user_id = 5 AND book_id = 45;


-- Mettre à jour les copies disponibles des livres empruntés
UPDATE books SET available_copies = available_copies - 1 WHERE id IN (11, 13, 14, 15, 45);

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
