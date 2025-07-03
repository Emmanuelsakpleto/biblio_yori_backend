-- Script pour ajouter des images de couverture aux livres existants
-- À exécuter après avoir inséré les livres de base

UPDATE books SET cover_image = 'algorithmes.jpg' WHERE title LIKE '%Algorithmes%';
UPDATE books SET cover_image = 'clean-code.jpg' WHERE title LIKE '%Clean Code%';
UPDATE books SET cover_image = 'javascript-guide.jpg' WHERE title LIKE '%JavaScript%';
UPDATE books SET cover_image = 'analyse-math.jpg' WHERE title LIKE '%Analyse Mathématique%';
UPDATE books SET cover_image = 'algebre-lineaire.jpg' WHERE title LIKE '%Algèbre Linéaire%';
UPDATE books SET cover_image = 'statistiques.jpg' WHERE title LIKE '%Statistiques%';
UPDATE books SET cover_image = 'physique-generale.jpg' WHERE title LIKE '%Physique Générale%';
UPDATE books SET cover_image = 'mecanique-quantique.jpg' WHERE title LIKE '%Mécanique Quantique%';
UPDATE books SET cover_image = 'chimie-organique.jpg' WHERE title LIKE '%Chimie Organique%';
UPDATE books SET cover_image = 'biologie-cellulaire.jpg' WHERE title LIKE '%Biologie Cellulaire%';
UPDATE books SET cover_image = 'histoire-france.jpg' WHERE title LIKE '%Histoire de France%';
UPDATE books SET cover_image = 'revolution-francaise.jpg' WHERE title LIKE '%Révolution Française%';
UPDATE books SET cover_image = 'guerre-mondiale.jpg' WHERE title LIKE '%Guerre Mondiale%';
UPDATE books SET cover_image = 'geographie-humaine.jpg' WHERE title LIKE '%Géographie Humaine%';
UPDATE books SET cover_image = 'economie-politique.jpg' WHERE title LIKE '%Économie Politique%';
UPDATE books SET cover_image = 'marketing.jpg' WHERE title LIKE '%Marketing%';
UPDATE books SET cover_image = 'gestion-projet.jpg' WHERE title LIKE '%Gestion de Projet%';
UPDATE books SET cover_image = 'le-rouge-noir.jpg' WHERE title LIKE '%Rouge et le Noir%';
UPDATE books SET cover_image = 'madame-bovary.jpg' WHERE title LIKE '%Madame Bovary%';
UPDATE books SET cover_image = 'germinal.jpg' WHERE title LIKE '%Germinal%';
UPDATE books SET cover_image = 'candide.jpg' WHERE title LIKE '%Candide%';
UPDATE books SET cover_image = 'philosophy.jpg' WHERE title LIKE '%Philosophie%' OR title LIKE '%Critique%';
UPDATE books SET cover_image = 'sociologie.jpg' WHERE title LIKE '%Sociologie%';
UPDATE books SET cover_image = 'psychologie.jpg' WHERE title LIKE '%Psychologie%';
UPDATE books SET cover_image = 'droit-civil.jpg' WHERE title LIKE '%Droit%';
UPDATE books SET cover_image = 'anglais.jpg' WHERE title LIKE '%English%' OR title LIKE '%Anglais%';
UPDATE books SET cover_image = 'espagnol.jpg' WHERE title LIKE '%Español%' OR title LIKE '%Espagnol%';
