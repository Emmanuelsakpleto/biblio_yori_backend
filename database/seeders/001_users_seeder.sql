-- ===================================
-- SEEDER 001: Utilisateurs par défaut
-- Date: 2025-06-29
-- Description: Création des comptes admin, librarian et student
-- Mot de passe pour tous: Password123!
-- Hash généré avec bcrypt (rounds=10)
-- ===================================

-- Insérer les utilisateurs par défaut
INSERT INTO users (
    email, 
    password, 
    first_name, 
    last_name, 
    phone, 
    student_id,
    department, 
    role, 
    is_active
) VALUES 
-- 🔑 ADMINISTRATEUR PRINCIPAL
(
    'admin@yori.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Admin',
    'Principal',
    '+33123456789',
    NULL,
    'Administration',
    'admin',
    TRUE
),

-- 📚 BIBLIOTHÉCAIRE
(
    'librarian@yori.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Sophie',
    'Bibliothèque',
    '+33123456790',
    NULL,
    'Bibliothèque',
    'librarian',
    TRUE
),

-- 📚 AUTRE BIBLIOTHÉCAIRE
(
    'sophie.biblio@yori.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Sophie',
    'Martin',
    '+33123456795',
    NULL,
    'Bibliothèque Centrale',
    'librarian',
    TRUE
),

-- 🎓 ÉTUDIANTS
(
    'student@yori.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Étudiant',
    'Principal',
    '+33123456791',
    'STU001',
    'Informatique',
    'student',
    TRUE
),

(
    'jean.dupont@student.univ.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Jean',
    'Dupont',
    '+33123456792',
    'STU002',
    'Informatique',
    'student',
    TRUE
),

(
    'marie.martin@student.univ.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Marie',
    'Martin',
    '+33123456793',
    'STU003',
    'Mathématiques',
    'student',
    TRUE
),

(
    'pierre.durand@student.univ.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Pierre',
    'Durand',
    '+33123456794',
    'STU004',
    'Physique',
    'student',
    TRUE
),

(
    'test@example.com',
    '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', -- Password123!
    'Test',
    'User',
    '+33123456796',
    'STU005',
    'Test',
    'student',
    TRUE
);

-- Vérification des utilisateurs créés
SELECT 
    id,
    email,
    CONCAT(first_name, ' ', last_name) as full_name,
    role,
    department,
    is_active,
    created_at
FROM users 
ORDER BY role DESC, first_name ASC;
