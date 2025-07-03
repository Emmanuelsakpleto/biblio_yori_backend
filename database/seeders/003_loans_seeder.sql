-- ===================================
-- SEEDER 003: Emprunts de démonstration
-- Date: 2025-06-29
-- Description: Quelques emprunts d'exemple pour tester le système
-- ===================================

-- Vider la table loans (pour les tests)
DELETE FROM loans;

-- Insérer des emprunts d'exemple
-- Note: Les IDs des utilisateurs et livres doivent correspondre aux seeders précédents

INSERT INTO loans (
    user_id, 
    book_id, 
    loan_date, 
    due_date, 
    status, 
    notes
) VALUES 
-- Jean Dupont (user_id: 5) emprunte "Introduction aux Algorithmes" (book_id: 1)
(
    5, -- jean.dupont@student.univ.com
    1, -- Introduction aux Algorithmes
    '2024-06-15',
    '2024-07-15',
    'active',
    'Emprunt pour projet de fin d''études'
),

-- Marie Martin (user_id: 6) emprunte "Analyse Mathématique I" (book_id: 4)
(
    6, -- marie.martin@student.univ.com
    4, -- Analyse Mathématique I
    '2024-06-20',
    '2024-07-20',
    'active',
    'Préparation aux examens'
),

-- Pierre Durand (user_id: 7) emprunte "L'Étranger" (book_id: 9)
(
    7, -- pierre.durand@student.univ.com
    9, -- L'Étranger
    '2024-06-10',
    '2024-07-10',
    'active',
    'Lecture personnelle'
),

-- Test User (user_id: 8) a rendu "Clean Code" (book_id: 2)
(
    8, -- test@example.com
    2, -- Clean Code
    '2024-05-15',
    '2024-06-15',
    'returned',
    'Très bon livre sur les bonnes pratiques'
),

-- Jean Dupont emprunte aussi "JavaScript Guide" (book_id: 3) - emprunt en retard
(
    5, -- jean.dupont@student.univ.com
    3, -- JavaScript: The Definitive Guide
    '2024-05-01',
    '2024-06-01',
    'overdue',
    'Apprentissage JavaScript'
);

-- Mettre à jour la date de retour pour l'emprunt rendu
UPDATE loans 
SET return_date = '2024-06-10' 
WHERE user_id = 8 AND book_id = 2;

-- Mettre à jour les copies disponibles des livres empruntés
UPDATE books SET available_copies = available_copies - 1 WHERE id IN (1, 3, 4, 9);

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
