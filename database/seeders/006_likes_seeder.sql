-- ===================================
-- SEEDER 006: Likes de livres de démonstration
-- Date: 2025-07-05
-- Description: Likes d'exemple pour tester le système
-- ===================================

-- Vider les tables de likes avant d'insérer
DELETE FROM user_book_likes;
DELETE FROM book_likes;

-- Insérer des likes individuels (user_book_likes)
INSERT INTO user_book_likes (user_id, book_id, created_at) VALUES
-- Jean Dupont (user_id: 5) aime plusieurs livres
(5, 11, '2025-06-01 10:30:00'), -- Clean Code
(5, 13, '2025-06-05 14:15:00'), -- JavaScript: The Definitive Guide
(5, 15, '2025-06-10 16:45:00'), -- Algorithms
(5, 44, '2025-07-01 11:20:00'), -- Les Misérables

-- Marie Martin (user_id: 6) aime des livres variés
(6, 14, '2025-06-15 09:30:00'), -- Python Crash Course
(6, 27, '2025-06-20 13:10:00'), -- Linear Algebra and Its Applications
(6, 47, '2025-06-25 15:45:00'), -- 1984
(6, 45, '2025-07-02 12:30:00'), -- L'Étranger

-- Pierre Durand (user_id: 7) aime la littérature
(7, 45, '2025-05-15 10:15:00'), -- L'Étranger
(7, 46, '2025-06-18 14:20:00'), -- Le Petit Prince
(7, 48, '2025-07-02 16:30:00'), -- Pride and Prejudice
(7, 44, '2025-06-22 11:45:00'), -- Les Misérables

-- Test User (user_id: 8) aime les livres techniques et littéraires
(8, 15, '2025-06-20 10:30:00'), -- Algorithms
(8, 28, '2025-06-25 13:15:00'), -- Statistics for Engineers and Scientists
(8, 11, '2025-07-01 15:45:00'), -- Clean Code
(8, 48, '2025-07-03 09:20:00'), -- Pride and Prejudice

-- Étudiant Principal (user_id: 4) aime quelques livres
(4, 11, '2025-07-04 12:10:00'), -- Clean Code
(4, 14, '2025-07-04 14:30:00'), -- Python Crash Course
(4, 26, '2025-07-05 10:15:00'); -- Calculus: Early Transcendentals

-- Insérer les compteurs agrégés dans book_likes
INSERT INTO book_likes (book_id, likes, updated_at) VALUES
-- Livres les plus populaires
(11, 3, '2025-07-05 10:00:00'), -- Clean Code (3 likes)
(15, 2, '2025-07-05 10:00:00'), -- Algorithms (2 likes)
(17, 2, '2025-07-05 10:00:00'), -- 1984 (2 likes)
(19, 2, '2025-07-05 10:00:00'), -- Le Rouge et le Noir (2 likes)
(45, 2, '2025-07-05 10:00:00'), -- L'Étranger (2 likes)
(14, 2, '2025-07-05 10:00:00'), -- Python Crash Course (2 likes)
(18, 2, '2025-07-05 10:00:00'), -- Sapiens (2 likes)

-- Livres avec 1 like
(13, 1, '2025-07-05 10:00:00'), -- JavaScript: The Definitive Guide
(20, 1, '2025-07-05 10:00:00'), -- L'Art de la Guerre
(21, 1, '2025-07-05 10:00:00'), -- Le Meilleur des mondes
(16, 1, '2025-07-05 10:00:00'); -- Le Petit Prince

-- Statistiques des likes
SELECT 
    bl.book_id,
    b.title,
    bl.likes as likes_agréges,
    COUNT(ubl.id) as likes_individuels
FROM book_likes bl
JOIN books b ON bl.book_id = b.id
LEFT JOIN user_book_likes ubl ON bl.book_id = ubl.book_id
GROUP BY bl.book_id, bl.likes, b.title
ORDER BY bl.likes DESC;

-- Vérification de la cohérence
SELECT 
    'Livres avec des likes individuels mais sans agrégation' as probleme,
    COUNT(*) as nombre
FROM (
    SELECT book_id
    FROM user_book_likes
    WHERE book_id NOT IN (SELECT book_id FROM book_likes)
) as incohérent
UNION ALL
SELECT 
    'Livres avec agrégation mais sans likes individuels' as probleme,
    COUNT(*) as nombre
FROM (
    SELECT book_id
    FROM book_likes
    WHERE book_id NOT IN (SELECT book_id FROM user_book_likes)
) as incohérent;
