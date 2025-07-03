-- ===================================
-- SEEDER 002: Livres de démonstration
-- Date: 2025-06-29
-- Description: Livres d'exemple pour tester le système
-- ===================================

-- Vider la table books (pour les tests)
DELETE FROM books;

-- Insérer des livres d'exemple
INSERT INTO books (
    title, 
    author, 
    isbn, 
    publisher, 
    publication_year, 
    category, 
    description, 
    language, 
    pages, 
    location, 
    total_copies, 
    available_copies,
    status
) VALUES 
-- 💻 INFORMATIQUE
(
    'Introduction aux Algorithmes',
    'Thomas H. Cormen, Charles E. Leiserson',
    '978-2100545261',
    'Dunod',
    2020,
    'Informatique',
    'Le livre de référence sur les algorithmes et structures de données. Couvre les concepts fondamentaux avec des exemples pratiques.',
    'fr',
    1312,
    'Section A - Étagère 1',
    3,
    3,
    'available'
),

(
    'Clean Code: A Handbook of Agile Software Craftsmanship',
    'Robert C. Martin',
    '978-0132350884',
    'Prentice Hall',
    2008,
    'Informatique',
    'Guide pratique pour écrire du code propre et maintenable. Principes et techniques pour améliorer la qualité du code.',
    'en',
    464,
    'Section A - Étagère 2',
    2,
    2,
    'available'
),

(
    'JavaScript: The Definitive Guide',
    'David Flanagan',
    '978-1491952023',
    'O''Reilly Media',
    2020,
    'Informatique',
    'Guide complet du langage JavaScript, des bases aux concepts avancés. Référence indispensable pour les développeurs.',
    'en',
    706,
    'Section A - Étagère 3',
    2,
    1,
    'available'
),

-- 📐 MATHÉMATIQUES
(
    'Analyse Mathématique I',
    'Jean-Pierre Marco, Laurent Lazzarini',
    '978-2100765676',
    'Dunod',
    2019,
    'Mathématiques',
    'Cours complet d''analyse mathématique niveau licence. Fonctions, limites, dérivées et intégrales.',
    'fr',
    480,
    'Section B - Étagère 1',
    4,
    4,
    'available'
),

(
    'Algèbre Linéaire',
    'Serge Lang',
    '978-2100559399',
    'Dunod',
    2017,
    'Mathématiques',
    'Introduction complète à l''algèbre linéaire. Espaces vectoriels, matrices et applications linéaires.',
    'fr',
    352,
    'Section B - Étagère 2',
    3,
    2,
    'available'
),

-- ⚗️ PHYSIQUE
(
    'Physique Générale - Mécanique',
    'Marcelo Alonso, Edward J. Finn',
    '978-2100721962',
    'Dunod',
    2018,
    'Physique',
    'Cours de mécanique classique pour étudiants en physique. Cinématique, dynamique et énergétique.',
    'fr',
    624,
    'Section C - Étagère 1',
    3,
    3,
    'available'
),

(
    'Électromagnétisme',
    'David J. Griffiths',
    '978-2804190583',
    'De Boeck',
    2016,
    'Physique',
    'Traité complet d''électromagnétisme. Électrostatique, magnétostatique et équations de Maxwell.',
    'fr',
    656,
    'Section C - Étagère 2',
    2,
    2,
    'available'
),

-- 📚 LITTÉRATURE
(
    'Les Misérables',
    'Victor Hugo',
    '978-2253096337',
    'Le Livre de Poche',
    2017,
    'Littérature',
    'Chef-d''œuvre de la littérature française. L''histoire de Jean Valjean dans la France du XIXe siècle.',
    'fr',
    1664,
    'Section D - Étagère 1',
    5,
    4,
    'available'
),

(
    'L''Étranger',
    'Albert Camus',
    '978-2070360024',
    'Gallimard',
    1971,
    'Littérature',
    'Roman emblématique de l''absurdisme. L''histoire de Meursault et sa confrontation avec l''absurdité de l''existence.',
    'fr',
    186,
    'Section D - Étagère 2',
    4,
    3,
    'available'
),

-- 🎨 ART ET CULTURE
(
    'Histoire de l''Art',
    'Ernst Gombrich',
    '978-2714309112',
    'Phaidon',
    2019,
    'Art',
    'Panorama complet de l''histoire de l''art occidental, de la préhistoire à l''art contemporain.',
    'fr',
    688,
    'Section E - Étagère 1',
    2,
    2,
    'available'
);

-- Statistiques des livres ajoutés
SELECT 
    category,
    COUNT(*) as nombre_livres,
    SUM(total_copies) as total_exemplaires,
    SUM(available_copies) as exemplaires_disponibles
FROM books 
GROUP BY category
ORDER BY nombre_livres DESC;

-- Liste des livres par catégorie
SELECT 
    category,
    title,
    author,
    isbn,
    total_copies,
    available_copies,
    location
FROM books 
ORDER BY category, title;
