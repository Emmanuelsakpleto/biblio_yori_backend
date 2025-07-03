
USE lectura_db;

-- Utilisateur admin (mot de passe: Password123!)
INSERT INTO users (first_name, last_name, email, password, role, is_active) VALUES 
('Admin', 'System', 'admin@lectura.com', '$2b$10$GRLswJTsRlZ.RkJZkN2zJ.rI8L8TkGS8c1YKF5F1eYQFf5Y6mYRPG', 'admin', TRUE);

-- Utilisateurs étudiants de test (mot de passe: Password123!)
INSERT INTO users (first_name, last_name, email, password, phone, student_id, department, role, is_active) VALUES 
('Jean', 'Dupont', 'jean.dupont@student.univ.com', '$2b$10$GRLswJTsRlZ.RkJZkN2zJ.rI8L8TkGS8c1YKF5F1eYQFf5Y6mYRPG', '+33123456789', 'STU001', 'Informatique', 'student', TRUE),
('Marie', 'Martin', 'marie.martin@student.univ.com', '$2b$10$GRLswJTsRlZ.RkJZkN2zJ.rI8L8TkGS8c1YKF5F1eYQFf5Y6mYRPG', '+33123456790', 'STU002', 'Mathématiques', 'student', TRUE),
('Pierre', 'Durand', 'pierre.durand@student.univ.com', '$2b$10$GRLswJTsRlZ.RkJZkN2zJ.rI8L8TkGS8c1YKF5F1eYQFf5Y6mYRPG', '+33123456791', 'STU003', 'Physique', 'student', TRUE);

-- Bibliothécaire (mot de passe: Password123!)
INSERT INTO users (first_name, last_name, email, password, role, is_active) VALUES 
('Sophie', 'Bibliothèque', 'sophie.biblio@lectura.com', '$2b$10$GRLswJTsRlZ.RkJZkN2zJ.rI8L8TkGS8c1YKF5F1eYQFf5Y6mYRPG', 'librarian', TRUE);

-- Livres de test
INSERT INTO books (title, author, isbn, publisher, publication_year, category, description, total_copies, available_copies, language, pages, location) VALUES 
('Introduction à l\'Algorithme', 'Thomas H. Cormen', '978-2100545308', 'Dunod', 2010, 'Informatique', 'Manuel de référence pour l\'apprentissage des algorithmes', 3, 3, 'fr', 1312, 'Section A - Étagère 1'),
('Calcul Différentiel et Intégral', 'James Stewart', '978-2761350858', 'Modulo', 2015, 'Mathématiques', 'Cours complet de calcul différentiel et intégral', 2, 2, 'fr', 1368, 'Section B - Étagère 2'),
('Physique Générale - Mécanique', 'Douglas C. Giancoli', '978-2761344135', 'ERPI', 2018, 'Physique', 'Introduction complète à la mécanique classique', 2, 2, 'fr', 720, 'Section C - Étagère 1'),
('Bases de Données - Concepts', 'Georges Gardarin', '978-2212112717', 'Eyrolles', 2003, 'Informatique', 'Guide complet pour les bases de données', 2, 1, 'fr', 512, 'Section A - Étagère 3'),
('Programmation en Python', 'Gérard Swinnen', '978-2212134346', 'Eyrolles', 2012, 'Informatique', 'Apprentissage de la programmation Python', 4, 4, 'fr', 372, 'Section A - Étagère 2');
