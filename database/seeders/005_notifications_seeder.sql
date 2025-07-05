-- ===================================
-- SEEDER 005: Notifications de démonstration
-- Date: 2025-07-05
-- Description: Notifications d'exemple pour tester le système
-- ===================================

-- Vider la table notifications avant d'insérer
DELETE FROM notifications;

-- Insérer des notifications d'exemple
INSERT INTO notifications (
    user_id, 
    type, 
    title, 
    message, 
    priority, 
    related_entity_type, 
    related_entity_id,
    is_read, 
    is_sent,
    related_loan_id,
    related_book_id,
    created_at
) VALUES
-- Notifications pour Jean Dupont (user_id: 5)
(5, 'loan_reminder', 'Rappel d''échéance', 'Le livre "JavaScript: The Definitive Guide" est en retard. Merci de le rendre rapidement.', 'high', 'loan', 2, FALSE, TRUE, 2, 13, '2025-07-04 10:00:00'),
(5, 'loan_created', 'Nouvel emprunt validé', 'Votre emprunt du livre "Clean Code" a été validé.', 'medium', 'loan', 1, TRUE, TRUE, 1, 11, '2025-06-01 09:00:00'),
(5, 'new_book', 'Nouveau livre disponible', 'Un nouveau livre "Python pour les nuls" est maintenant disponible en bibliothèque.', 'low', 'book', 25, FALSE, TRUE, NULL, 25, '2025-07-03 14:30:00'),

-- Notifications pour Marie Martin (user_id: 6)
(6, 'loan_validated', 'Réservation confirmée', 'Votre réservation pour "Python Crash Course" a été confirmée.', 'medium', 'loan', 3, TRUE, TRUE, 3, 14, '2025-07-01 11:15:00'),
(6, 'loan_overdue', 'Livre en retard', 'Le livre "Linear Algebra and Its Applications" est en retard depuis 5 jours.', 'high', 'loan', 11, FALSE, TRUE, 11, 27, '2025-07-05 08:00:00'),
(6, 'welcome', 'Bienvenue !', 'Bienvenue dans le système de bibliothèque YORI ! N''hésitez pas à explorer nos ressources.', 'low', 'user', 6, TRUE, TRUE, NULL, NULL, '2025-06-15 16:00:00'),

-- Notifications pour Pierre Durand (user_id: 7)
(7, 'loan_returned', 'Livre rendu', 'Merci d''avoir rendu "L''Étranger" à temps.', 'low', 'loan', 4, TRUE, TRUE, 4, 45, '2025-06-10 15:30:00'),
(7, 'loan_validated', 'Réservation en attente', 'Votre demande pour "Pride and Prejudice" est en cours de traitement.', 'medium', 'loan', 8, FALSE, TRUE, 8, 48, '2025-07-02 12:00:00'),
(7, 'book_available', 'Livre disponible', 'Le livre "1984" que vous recherchiez est maintenant disponible.', 'medium', 'book', 47, FALSE, TRUE, NULL, 47, '2025-07-04 16:45:00'),

-- Notifications pour Test User (user_id: 8)
(8, 'loan_created', 'Emprunt validé', 'Votre emprunt du livre "Algorithms" a été validé.', 'medium', 'loan', 5, TRUE, TRUE, 5, 15, '2025-06-20 10:30:00'),
(8, 'loan_renewed', 'Emprunt prolongé', 'Votre emprunt du livre "Statistics for Engineers and Scientists" a été prolongé de 15 jours.', 'low', 'loan', 12, TRUE, TRUE, 12, 28, '2025-06-01 14:00:00'),
(8, 'system_update', 'Mise à jour système', 'Le système de bibliothèque sera en maintenance dimanche de 2h à 4h du matin.', 'medium', 'system', NULL, FALSE, TRUE, NULL, NULL, '2025-07-05 17:00:00'),

-- Notifications pour Étudiant Principal (user_id: 4)
(4, 'loan_created', 'Emprunt validé', 'Votre emprunt du livre "Calculus: Early Transcendentals" a été validé.', 'medium', 'loan', 10, TRUE, TRUE, 10, 26, '2025-07-01 10:00:00'),
(4, 'welcome', 'Bienvenue !', 'Bienvenue dans le système de bibliothèque YORI !', 'low', 'user', 4, TRUE, TRUE, NULL, NULL, '2025-06-10 14:00:00'),

-- Notifications globales (pour tous les utilisateurs actifs)
(4, 'maintenance', 'Maintenance programmée', 'La bibliothèque sera fermée samedi 6 juillet pour maintenance.', 'high', 'system', NULL, FALSE, TRUE, NULL, NULL, '2025-07-05 18:00:00'),
(5, 'maintenance', 'Maintenance programmée', 'La bibliothèque sera fermée samedi 6 juillet pour maintenance.', 'high', 'system', NULL, FALSE, TRUE, NULL, NULL, '2025-07-05 18:00:00'),
(6, 'maintenance', 'Maintenance programmée', 'La bibliothèque sera fermée samedi 6 juillet pour maintenance.', 'high', 'system', NULL, FALSE, TRUE, NULL, NULL, '2025-07-05 18:00:00'),
(7, 'maintenance', 'Maintenance programmée', 'La bibliothèque sera fermée samedi 6 juillet pour maintenance.', 'high', 'system', NULL, FALSE, TRUE, NULL, NULL, '2025-07-05 18:00:00'),
(8, 'maintenance', 'Maintenance programmée', 'La bibliothèque sera fermée samedi 6 juillet pour maintenance.', 'high', 'system', NULL, FALSE, TRUE, NULL, NULL, '2025-07-05 18:00:00');

-- Statistiques des notifications
SELECT 
    type,
    COUNT(*) as nombre,
    SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as lues,
    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as non_lues
FROM notifications 
GROUP BY type
ORDER BY nombre DESC;

-- Vérification des notifications par utilisateur
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as utilisateur,
    COUNT(n.id) as total_notifications,
    SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as non_lues
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.first_name, u.last_name
ORDER BY non_lues DESC;
