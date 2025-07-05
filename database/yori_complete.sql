-- ========================================
-- YORI - Système de Gestion de Bibliothèque
-- Version complète pour démonstration
-- Date: 2025-07-05
-- ========================================

-- Configuration
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


--
-- Structure de la table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `author` varchar(300) NOT NULL,
  `isbn` varchar(17) NOT NULL,
  `publisher` varchar(200) DEFAULT NULL,
  `publication_year` year(4) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `language` varchar(10) DEFAULT 'fr',
  `pages` int(11) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `total_copies` int(11) DEFAULT 1,
  `available_copies` int(11) DEFAULT 1,
  `status` enum('available','borrowed','reserved','maintenance','lost','deleted') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Déchargement des données de la table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `publisher`, `publication_year`, `category`, `description`, `language`, `pages`, `location`, `cover_image`, `total_copies`, `available_copies`, `status`, `created_at`, `updated_at`) VALUES
(11, 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', '9780132350884', 'Pearson', '2008', 'Informatique', 'Ce livre présente une série de bonnes pratiques pour écrire du code propre et maintenable. Il couvre les principes fondamentaux de la programmation professionnelle et propose des techniques concrètes pour améliorer la qualité du code.', 'fr', 464, 'A-INF-001', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:44:44'),
(12, 'Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '9780201633610', 'Addison-Wesley', '1994', 'Informatique', 'Le livre de référence sur les patterns de conception en programmation orientée objet. Il présente 23 patterns essentiels avec des exemples pratiques et des cas d\'usage concrets.', 'fr', 395, 'A-INF-002', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop&q=80', 2, 0, 'available', '2025-07-04 22:27:55', '2025-07-04 22:57:41'),
(13, 'JavaScript: The Definitive Guide', 'David Flanagan', '9781491952023', 'O\'Reilly Media', '2020', 'Informatique', 'Guide complet du langage JavaScript couvrant les dernières fonctionnalités d\'ES2020. De la syntaxe de base aux concepts avancés, ce livre est une référence incontournable pour tous les développeurs JavaScript.', 'fr', 687, 'A-INF-003', 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=400&fit=crop&q=80', 4, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:44:44'),
(14, 'Python Crash Course', 'Eric Matthes', '9781718502703', 'No Starch Press', '2019', 'Informatique', 'Introduction pratique et complète à Python. Ce livre enseigne les bases du langage à travers des projets concrets : jeux, visualisations de données et applications web.', 'fr', 544, 'A-INF-004', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:44:44'),
(15, 'Algorithms', 'Robert Sedgewick, Kevin Wayne', '9780321573513', 'Addison-Wesley', '2011', 'Informatique', 'Référence moderne sur les algorithmes et structures de données. Couvre les algorithmes essentiels avec des implémentations en Java et des analyses de performance détaillées.', 'fr', 955, 'A-INF-005', 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:44:44'),
(16, 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', '9780135957059', 'Addison-Wesley', '2019', 'Informatique', 'Guide essentiel pour devenir un programmeur efficace et professionnel. Ce livre présente des conseils pratiques et des techniques éprouvées pour améliorer ses compétences de développeur.', 'fr', 352, 'A-INF-006', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&h=400&fit=crop&q=80', 3, 0, 'available', '2025-07-04 22:27:55', '2025-07-05 11:38:28'),
(17, 'System Design Interview', 'Alex Xu', '9798664653403', 'Independently published', '2020', 'Informatique', 'Guide complet pour réussir les entretiens de conception de systèmes. Couvre les principes fondamentaux et présente des études de cas réelles d\'architectures à grande échelle.', 'fr', 322, 'A-INF-007', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(18, 'React: The Complete Reference', 'Thomas Powell', '9781260135718', 'McGraw-Hill Education', '2021', 'Informatique', 'Référence complète pour maîtriser React et l\'écosystème moderne du développement front-end. Couvre React, Redux, hooks, et les dernières bonnes pratiques.', 'fr', 896, 'A-INF-008', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=400&fit=crop&q=80', 3, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(19, 'Database Systems: The Complete Book', 'Hector Garcia-Molina, Jeffrey Ullman, Jennifer Widom', '9780131873254', 'Prentice Hall', '2008', 'Informatique', 'Traité complet sur les systèmes de bases de données couvrant la théorie et la pratique. De la conception relationnelle aux systèmes distribués modernes.', 'fr', 1203, 'A-INF-009', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(20, 'Cybersecurity Essentials', 'Charles J. Brooks', '9781119362395', 'Wiley', '2018', 'Informatique', 'Guide essentiel de la cybersécurité couvrant les menaces actuelles, les techniques de protection et les meilleures pratiques de sécurité informatique.', 'fr', 528, 'A-INF-010', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-05 14:17:28'),
(21, 'Machine Learning Yearning', 'Andrew Ng', '9780999579923', 'Draft', '2018', 'Informatique', 'Guide pratique pour structurer des projets de machine learning. Andrew Ng partage son expérience pour construire des systèmes d\'IA efficaces.', 'fr', 118, 'A-INF-011', 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 23:57:55'),
(22, 'Docker Deep Dive', 'Nigel Poulton', '9781521822808', 'Independently published', '2020', 'Informatique', 'Guide complet pour maîtriser Docker et la conteneurisation. De l\'installation aux déploiements en production, ce livre couvre tous les aspects essentiels.', 'fr', 394, 'A-INF-012', 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(23, 'Git Pro', 'Scott Chacon, Ben Straub', '9781484200773', 'Apress', '2014', 'Informatique', 'Manuel complet pour maîtriser Git, le système de contrôle de version le plus populaire. Couvre les commandes de base aux workflows avancés.', 'fr', 456, 'A-INF-013', 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=300&h=400&fit=crop&q=80', 4, 4, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(24, 'Cloud Computing: Concepts, Technology & Architecture', 'Thomas Erl', '9780133387520', 'Prentice Hall', '2013', 'Informatique', 'Introduction complète au cloud computing couvrant les concepts fondamentaux, les technologies et les architectures. Guide essentiel pour comprendre le cloud moderne.', 'fr', 528, 'A-INF-014', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(25, 'Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', '9780134610993', 'Pearson', '2020', 'Informatique', 'Le manuel de référence en intelligence artificielle. Couvre tous les aspects de l\'IA moderne : recherche, logique, apprentissage automatique, et applications pratiques.', 'fr', 1152, 'A-INF-015', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(26, 'Calculus: Early Transcendentals', 'James Stewart', '9781285741550', 'Cengage Learning', '2015', 'Mathématiques', 'Manuel de référence en calcul différentiel et intégral. Couvre les limites, dérivées, intégrales et séries avec de nombreux exemples et exercices pratiques.', 'fr', 1368, 'B-MAT-001', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(27, 'Linear Algebra and Its Applications', 'David C. Lay', '9780321982384', 'Pearson', '2015', 'Mathématiques', 'Introduction moderne à l\'algèbre linéaire avec applications. Couvre les espaces vectoriels, matrices, valeurs propres et applications en informatique et ingénierie.', 'fr', 576, 'B-MAT-002', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(28, 'Statistics for Engineers and Scientists', 'William Navidi', '9780073401331', 'McGraw-Hill', '2014', 'Mathématiques', 'Manuel de statistiques appliquées aux sciences et à l\'ingénierie. Couvre les probabilités, tests d\'hypothèses, régression et analyse de variance.', 'fr', 890, 'B-MAT-003', 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(29, 'Discrete Mathematics and Its Applications', 'Kenneth Rosen', '9781259676512', 'McGraw-Hill', '2018', 'Mathématiques', 'Introduction complète aux mathématiques discrètes. Couvre la logique, ensembles, fonctions, algorithmes, théorie des graphes et combinatoire.', 'fr', 972, 'B-MAT-004', 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-05 14:17:23'),
(30, 'Introduction to Mathematical Thinking', 'Keith Devlin', '9780615653631', 'Keith Devlin', '2012', 'Mathématiques', 'Guide pour développer la pensée mathématique moderne. Enseigne comment lire, comprendre et construire des preuves mathématiques rigoureuses.', 'fr', 106, 'B-MAT-005', 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=300&h=400&fit=crop&q=80', 4, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(31, 'Real Analysis', 'Elias M. Stein, Rami Shakarchi', '9780691113869', 'Princeton University Press', '2005', 'Mathématiques', 'Introduction rigoureuse à l\'analyse réelle. Couvre les fondements de l\'analyse moderne : mesure, intégration, espaces de fonctions et applications.', 'fr', 402, 'B-MAT-006', 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(32, 'Abstract Algebra', 'David S. Dummit, Richard M. Foote', '9780471433347', 'Wiley', '2003', 'Mathématiques', 'Traité complet d\'algèbre abstraite couvrant les groupes, anneaux, corps et théorie de Galois. Référence essentielle pour l\'algèbre moderne.', 'fr', 932, 'B-MAT-007', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(33, 'Numerical Methods', 'Richard L. Burden, J. Douglas Faires', '9781305253667', 'Cengage Learning', '2015', 'Mathématiques', 'Manuel de méthodes numériques couvrant l\'interpolation, intégration numérique, résolution d\'équations et approximation. Avec implémentations pratiques.', 'fr', 895, 'B-MAT-008', 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(34, 'Graph Theory', 'Reinhard Diestel', '9783662575604', 'Springer', '2017', 'Mathématiques', 'Introduction moderne à la théorie des graphes. Couvre les concepts fondamentaux et les applications en informatique, optimisation et réseaux.', 'fr', 428, 'B-MAT-009', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(35, 'Introduction to Probability', 'Dimitri P. Bertsekas, John N. Tsitsiklis', '9781886529236', 'Athena Scientific', '2008', 'Mathématiques', 'Manuel de probabilités couvrant les concepts fondamentaux et applications. De la probabilité discrète aux processus stochastiques.', 'fr', 544, 'B-MAT-010', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=400&fit=crop&q=80', 3, 0, 'available', '2025-07-04 22:27:55', '2025-07-05 14:17:30'),
(36, 'University Physics with Modern Physics', 'Hugh D. Young, Roger A. Freedman', '9780135159552', 'Pearson', '2019', 'Physique', 'Manuel complet de physique universitaire couvrant la mécanique, thermodynamique, électromagnétisme, optique et physique moderne.', 'fr', 1632, 'C-PHY-001', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-05 14:17:36'),
(37, 'Introduction to Quantum Mechanics', 'David J. Griffiths', '9781107189638', 'Cambridge University Press', '2016', 'Physique', 'Introduction claire et rigoureuse à la mécanique quantique. Couvre les postulats, équation de Schrödinger, et applications aux atomes et molécules.', 'fr', 508, 'C-PHY-002', 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(38, 'Classical Mechanics', 'John R. Taylor', '9781891389221', 'University Science Books', '2005', 'Physique', 'Traité moderne de mécanique classique. De la mécanique newtonienne à la mécanique lagrangienne et hamiltonienne, avec applications contemporaines.', 'fr', 786, 'C-PHY-003', 'https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(39, 'Introduction to Electrodynamics', 'David J. Griffiths', '9781108420419', 'Cambridge University Press', '2017', 'Physique', 'Manuel de référence en électrodynamique couvrant l\'électrostatique, magnétostatique, induction électromagnétique et ondes électromagnétiques.', 'fr', 619, 'C-PHY-004', 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(40, 'Thermodynamics and Statistical Mechanics', 'Walter Greiner, Ludwig Neise, Horst Stöcker', '9781461254805', 'Springer', '2012', 'Physique', 'Introduction à la thermodynamique et mécanique statistique. Couvre les lois de la thermodynamique et les fondements statistiques.', 'fr', 463, 'C-PHY-005', 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(41, 'Astrophysics in a Nutshell', 'Dan Maoz', '9780691164793', 'Princeton University Press', '2016', 'Physique', 'Introduction concise à l\'astrophysique moderne. Couvre les étoiles, galaxies, cosmologie et physique des objets extrêmes.', 'fr', 312, 'C-PHY-006', 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-05 13:31:18'),
(42, 'Solid State Physics', 'Neil W. Ashcroft, N. David Mermin', '9780030839931', 'Cengage Learning', '1976', 'Physique', 'Référence classique en physique du solide. Couvre la structure cristalline, propriétés électroniques, thermiques et magnétiques des solides.', 'fr', 826, 'C-PHY-007', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(43, 'Particle Physics: An Introduction', 'Frank Close', '9780199695614', 'Oxford University Press', '2013', 'Physique', 'Introduction accessible à la physique des particules. Couvre le modèle standard, interactions fondamentales et découvertes récentes.', 'fr', 162, 'C-PHY-008', 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(44, 'Les Misérables', 'Victor Hugo', '9782070409228', 'Gallimard', '0000', 'Littérature', 'Chef-d\'œuvre de la littérature française suivant le destin de Jean Valjean dans la France du XIXe siècle. Fresque sociale et humaine d\'une ampleur exceptionnelle.', 'fr', 1536, 'D-LIT-001', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80', 4, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(45, 'L\'Étranger', 'Albert Camus', '9782070360024', 'Gallimard', '1942', 'Littérature', 'Roman emblématique de l\'absurde racontant l\'histoire de Meursault, homme indifférent face à l\'existence. Œuvre majeure de la littérature du XXe siècle.', 'fr', 186, 'D-LIT-002', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80', 5, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:44:44'),
(46, 'Le Petit Prince', 'Antoine de Saint-Exupéry', '9782070612758', 'Gallimard', '1943', 'Littérature', 'Conte poétique et philosophique racontant la rencontre entre un aviateur et un petit prince venu d\'une autre planète. Allégorie sur l\'enfance et l\'amitié.', 'fr', 96, 'D-LIT-003', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80', 6, 5, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(47, '1984', 'George Orwell', '9782070368228', 'Gallimard', '1949', 'Littérature', 'Dystopie prophétique décrivant une société totalitaire sous surveillance permanente. Roman d\'anticipation devenu référence sur les dérives autoritaires.', 'fr', 439, 'D-LIT-004', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop&q=80', 4, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(48, 'Pride and Prejudice', 'Jane Austen', '9780141439518', 'Penguin Classics', '0000', 'Littérature', 'Roman social anglais suivant les relations entre Elizabeth Bennet et Mr. Darcy. Critique subtile de la société aristocratique du XIXe siècle.', 'fr', 416, 'D-LIT-005', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80', 3, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(49, 'To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Harper', '1960', 'Littérature', 'Roman emblématique sur le racisme dans le Sud américain des années 1930, vu à travers les yeux de Scout Finch. Prix Pulitzer 1961.', 'fr', 376, 'D-LIT-006', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(50, 'One Hundred Years of Solitude', 'Gabriel García Márquez', '9780060883287', 'Harper', '1967', 'Littérature', 'Chef-d\'œuvre du réalisme magique racontant l\'histoire de la famille Buendía sur plusieurs générations. Prix Nobel de littérature.', 'fr', 448, 'D-LIT-007', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80', 2, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(51, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', '1925', 'Littérature', 'Roman emblématique des Années folles américaines suivant Jay Gatsby et son amour obsessionnel. Critique du rêve américain et de la société de consommation.', 'fr', 180, 'D-LIT-008', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80', 4, 4, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(52, 'Principles of Economics', 'N. Gregory Mankiw', '9781305585126', 'Cengage Learning', '2017', 'Économie', 'Manuel de référence en économie couvrant microéconomie et macroéconomie. Introduction claire aux concepts fondamentaux avec applications contemporaines.', 'fr', 888, 'E-ECO-001', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(53, 'The Lean Startup', 'Eric Ries', '9780307887894', 'Crown Business', '2011', 'Économie', 'Méthodologie révolutionnaire pour créer des entreprises innovantes en réduisant les risques. Approche itérative basée sur l\'apprentissage validé.', 'fr', 336, 'E-ECO-002', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80', 4, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(54, 'Good to Great', 'Jim Collins', '9780066620992', 'HarperBusiness', '2001', 'Économie', 'Étude des facteurs qui permettent aux entreprises de passer de la performance correcte à l\'excellence durable. Analyse de 11 entreprises exceptionnelles.', 'fr', 320, 'E-ECO-003', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(55, 'Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Farrar, Straus and Giroux', '2011', 'Économie', 'Exploration des mécanismes de la prise de décision par le prix Nobel d\'économie. Analyse des biais cognitifs et de la psychologie comportementale.', 'fr', 499, 'E-ECO-004', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&q=80', 3, 1, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(56, 'The Intelligent Investor', 'Benjamin Graham', '9780060555665', 'Harper', '2006', 'Économie', 'Guide classique de l\'investissement value par le mentor de Warren Buffett. Principes intemporels pour investir intelligemment en bourse.', 'fr', 640, 'E-ECO-005', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80', 2, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(57, 'Blue Ocean Strategy', 'W. Chan Kim, Renée Mauborgne', '9781625274496', 'Harvard Business Review Press', '2015', 'Économie', 'Stratégie révolutionnaire pour créer de nouveaux espaces de marché sans concurrence. Méthodologie pour innover et capturer une demande nouvelle.', 'fr', 287, 'E-ECO-006', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80', 3, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(58, 'The Art of War', 'Sun Tzu', '9781599869773', 'Filiquarian Publishing', '2006', 'Économie', 'Traité stratégique antique appliqué au business moderne. Principes intemporels de stratégie et de leadership pour réussir en entreprise.', 'fr', 112, 'E-ECO-007', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80', 4, 4, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(59, 'Rich Dad Poor Dad', 'Robert Kiyosaki', '9781612680194', 'Plata Publishing', '2017', 'Économie', 'Guide de l\'éducation financière contrastant deux approches de l\'argent. Principes pour développer l\'intelligence financière et créer la richesse.', 'fr', 336, 'E-ECO-008', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80', 5, 3, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55'),
(60, 'The 4-Hour Workweek', 'Timothy Ferriss', '9780307465351', 'Crown', '2009', 'Économie', 'Guide pour automatiser ses revenus et optimiser son style de vie. Méthodologie pour travailler moins tout en gagnant plus grâce à l\'efficacité.', 'fr', 416, 'E-ECO-009', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&q=80', 3, 2, 'available', '2025-07-04 22:27:55', '2025-07-04 22:27:55');

-- --------------------------------------------------------

--
-- Structure de la table `loans`
--

CREATE TABLE `loans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `loan_date` date NOT NULL DEFAULT curdate(),
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `extension_count` int(11) DEFAULT 0,
  `status` enum('pending','active','returned','overdue','extended') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Déchargement des données de la table `loans`
--

INSERT INTO `loans` (`id`, `user_id`, `book_id`, `loan_date`, `due_date`, `return_date`, `extension_count`, `status`, `notes`, `fine_amount`, `created_at`, `updated_at`) VALUES
(6, 3, 11, '2025-06-01', '2025-07-10', NULL, 0, 'active', 'Projet de fin d\'études', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(7, 3, 13, '2025-05-01', '2025-06-01', NULL, 0, 'overdue', 'A rendre rapidement', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(8, 4, 14, '2025-07-01', '2025-07-20', NULL, 0, '', 'Réservation en attente', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(9, 5, 45, '2025-05-10', '2025-06-10', '2025-06-10', 0, 'returned', 'Livre rendu à temps', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(10, 8, 15, '2025-06-20', '2025-07-20', NULL, 0, 'active', 'Lecture personnelle', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(11, 3, 16, '2025-06-15', '2025-07-15', NULL, 0, '', 'Annulé par l’utilisateur', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(12, 4, 17, '2025-06-18', '2025-07-18', NULL, 0, '', 'Refusé par l’admin', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(13, 5, 18, '2025-07-02', '2025-07-22', NULL, 0, '', 'En attente de validation', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(14, 8, 19, '2025-05-15', '2025-06-15', NULL, 0, 'returned', 'Rendu après rappel', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(15, 3, 20, '2025-07-01', '2025-07-30', NULL, 0, 'active', 'Lecture d’été', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(16, 5, 21, '2025-05-10', '2025-06-10', NULL, 0, 'overdue', 'Toujours pas rendu', 0.00, '2025-07-04 22:44:43', '2025-07-04 23:15:17'),
(17, 5, 22, '2025-06-20', '2025-07-20', NULL, 0, '', 'Annulé par l’utilisateur', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(18, 8, 23, '2025-06-25', '2025-07-25', NULL, 0, '', 'Refusé par l’admin', 0.00, '2025-07-04 22:44:43', '2025-07-04 22:44:43'),
(19, 5, 12, '2025-07-04', '2025-07-18', NULL, 0, 'active', NULL, 0.00, '2025-07-04 22:57:41', '2025-07-04 22:57:41'),
(20, 7, 21, '2025-07-04', '2025-07-18', NULL, 0, 'active', NULL, 0.00, '2025-07-04 23:57:55', '2025-07-04 23:57:55'),
(21, 10, 16, '2025-07-05', '2025-07-19', NULL, 0, '', NULL, 0.00, '2025-07-05 11:38:28', '2025-07-05 11:38:28'),
(22, 5, 50, '2025-07-05', '2025-07-19', NULL, 0, '', 'Test emprunt via curl', 0.00, '2025-07-05 12:36:47', '2025-07-05 12:36:47'),
(23, 5, 49, '2025-07-05', '2025-07-19', NULL, 0, '', 'Test emprunt via curl', 0.00, '2025-07-05 13:07:54', '2025-07-05 13:07:54'),
(24, 5, 41, '2025-07-05', '2025-07-19', NULL, 0, 'active', 'Test emprunt via curl', 0.00, '2025-07-05 13:16:35', '2025-07-05 13:31:17'),
(25, 6, 35, '2025-07-05', '2025-07-19', NULL, 0, 'active', NULL, 0.00, '2025-07-05 13:42:32', '2025-07-05 14:17:30'),
(26, 6, 35, '2025-07-05', '2025-07-19', NULL, 0, 'active', NULL, 0.00, '2025-07-05 13:42:56', '2025-07-05 14:17:26'),
(27, 6, 35, '2025-07-05', '2025-07-19', NULL, 0, 'active', NULL, 0.00, '2025-07-05 13:42:59', '2025-07-05 13:44:17'),
(28, 9, 20, '2025-07-05', '2025-07-19', NULL, 0, 'active', NULL, 0.00, '2025-07-05 13:56:34', '2025-07-05 14:17:28'),
(29, 8, 36, '2025-07-05', '2025-07-19', NULL, 0, 'active', NULL, 0.00, '2025-07-05 14:11:32', '2025-07-05 14:17:36'),
(30, 8, 29, '2025-07-05', '2025-07-19', NULL, 0, 'active', NULL, 0.00, '2025-07-05 14:16:41', '2025-07-05 14:17:23'),
(31, 5, 19, '2025-07-05', '2025-07-19', NULL, 0, 'pending', NULL, 0.00, '2025-07-05 20:09:14', '2025-07-05 20:09:14');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('loan_created','loan_validated','loan_refused','loan_reminder','loan_overdue','loan_returned','loan_renewed','book_available','new_book','book_reservation','account_created','system_update','welcome','password_changed','email_verified','profile_updated','maintenance','custom') NOT NULL DEFAULT 'system_update',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `related_entity_type` varchar(50) DEFAULT NULL,
  `related_entity_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `is_read` tinyint(1) DEFAULT 0,
  `is_sent` tinyint(1) DEFAULT 0,
  `related_loan_id` int(11) DEFAULT NULL,
  `related_book_id` int(11) DEFAULT NULL,
  `scheduled_for` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des notifications envoyées aux utilisateurs';

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `related_entity_type`, `related_entity_id`, `metadata`, `is_read`, `is_sent`, `related_loan_id`, `related_book_id`, `scheduled_for`, `created_at`, `updated_at`, `read_at`) VALUES
(1, 9, 'account_created', 'Bienvenue sur LECTURA', 'Bonjour Emmanuel SAKPLETO, bienvenue sur la plateforme LECTURA ! Vous pouvez maintenant explorer notre catalogue et emprunter des livres.', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, '2025-07-05 11:14:09', '2025-07-05 11:14:09', NULL),
(2, 10, 'account_created', 'Bienvenue sur LECTURA', 'Bonjour Yao SKT, bienvenue sur la plateforme LECTURA ! Vous pouvez maintenant explorer notre catalogue et emprunter des livres.', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, '2025-07-05 11:35:13', '2025-07-05 11:35:13', NULL),
(11, 8, 'loan_created', 'Nouvel emprunt confirmé', 'Votre emprunt du livre \"University Physics with Modern Physics\" a été confirmé. Date de retour prévue : 2025-07-19 00:00:00', 'normal', 'loan', 29, '{\"book_title\":\"University Physics with Modern Physics\",\"due_date\":\"2025-07-19T00:00:00.000Z\"}', 0, 0, NULL, NULL, NULL, '2025-07-05 14:11:32', '2025-07-05 15:11:19', NULL),
(12, 8, 'loan_created', 'Nouvel emprunt confirmé', 'Votre emprunt du livre \"Discrete Mathematics and Its Applications\" a été confirmé. Date de retour prévue : 2025-07-19 00:00:00', 'normal', 'loan', 30, '{\"book_title\":\"Discrete Mathematics and Its Applications\",\"due_date\":\"2025-07-19T00:00:00.000Z\"}', 0, 0, NULL, NULL, NULL, '2025-07-05 14:16:41', '2025-07-05 15:11:19', NULL),
(13, 8, 'book_reservation', 'Réservation validée : Discrete Mathematics and Its Applications', 'Votre réservation pour le livre \"Discrete Mathematics and Its Applications\" a été validée. Vous pouvez venir le récupérer.', 'normal', 'loan', 30, NULL, 0, 0, NULL, NULL, NULL, '2025-07-05 14:17:23', '2025-07-05 15:12:20', NULL),
(14, 1, 'loan_validated', 'Emprunt validé pour Test User', 'L\'emprunt du livre \"Discrete Mathematics and Its Applications\" par Test User a été validé.', 'normal', 'loan', 30, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:23', '2025-07-05 16:46:55', '2025-07-05 16:46:55'),
(15, 6, 'book_reservation', 'Réservation validée : Introduction to Probability', 'Votre réservation pour le livre \"Introduction to Probability\" a été validée. Vous pouvez venir le récupérer.', 'normal', 'loan', 26, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:26', '2025-07-05 20:30:23', '2025-07-05 20:30:23'),
(16, 1, 'loan_validated', 'Emprunt validé pour Marie Martin', 'L\'emprunt du livre \"Introduction to Probability\" par Marie Martin a été validé.', 'normal', 'loan', 26, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:26', '2025-07-05 16:46:55', '2025-07-05 16:46:55'),
(17, 9, 'book_reservation', 'Réservation validée : Cybersecurity Essentials', 'Votre réservation pour le livre \"Cybersecurity Essentials\" a été validée. Vous pouvez venir le récupérer.', 'normal', 'loan', 28, NULL, 0, 0, NULL, NULL, NULL, '2025-07-05 14:17:28', '2025-07-05 15:12:20', NULL),
(18, 1, 'loan_validated', 'Emprunt validé pour Emmanuel SAKPLETO', 'L\'emprunt du livre \"Cybersecurity Essentials\" par Emmanuel SAKPLETO a été validé.', 'normal', 'loan', 28, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:28', '2025-07-05 16:46:53', '2025-07-05 16:46:53'),
(19, 6, 'book_reservation', 'Réservation validée : Introduction to Probability', 'Votre réservation pour le livre \"Introduction to Probability\" a été validée. Vous pouvez venir le récupérer.', 'normal', 'loan', 25, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:30', '2025-07-05 20:30:22', '2025-07-05 20:30:22'),
(20, 1, 'loan_validated', 'Emprunt validé pour Marie Martin', 'L\'emprunt du livre \"Introduction to Probability\" par Marie Martin a été validé.', 'normal', 'loan', 25, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:30', '2025-07-05 16:40:58', '2025-07-05 16:40:58'),
(21, 8, 'book_reservation', 'Réservation validée : University Physics with Modern Physics', 'Votre réservation pour le livre \"University Physics with Modern Physics\" a été validée. Vous pouvez venir le récupérer.', 'normal', 'loan', 29, NULL, 0, 0, NULL, NULL, NULL, '2025-07-05 14:17:36', '2025-07-05 15:12:20', NULL),
(22, 1, 'loan_validated', 'Emprunt validé pour Test User', 'L\'emprunt du livre \"University Physics with Modern Physics\" par Test User a été validé.', 'normal', 'loan', 29, NULL, 1, 0, NULL, NULL, NULL, '2025-07-05 14:17:36', '2025-07-05 16:40:50', '2025-07-05 16:40:50'),
(23, 5, 'loan_created', 'Nouvel emprunt confirmé', 'Votre emprunt du livre \"Database Systems: The Complete Book\" a été confirmé. Date de retour prévue : 2025-07-19 00:00:00', 'normal', 'loan', 31, '{\"book_title\":\"Database Systems: The Complete Book\",\"due_date\":\"2025-07-19T00:00:00.000Z\"}', 1, 0, NULL, NULL, NULL, '2025-07-05 20:09:14', '2025-07-05 20:20:47', '2025-07-05 20:20:47');

-- --------------------------------------------------------

--
-- Structure de la table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Déchargement des données de la table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `book_id`, `rating`, `comment`, `is_approved`, `created_at`, `updated_at`) VALUES
(1, 3, 11, 5, 'Un incontournable pour tout développeur. Clair, structuré, et motivant.', 1, '2025-07-01 00:00:00', '2025-07-01 00:00:00'),
(2, 3, 13, 4, 'Très complet, mais parfois un peu dense pour les débutants.', 1, '2025-07-02 00:00:00', '2025-07-02 00:00:00'),
(3, 5, 45, 5, 'Un chef-d’œuvre de la littérature française. Lecture marquante.', 1, '2025-07-03 00:00:00', '2025-07-03 00:00:00'),
(4, 8, 15, 4, 'Bon livre pour comprendre les bases, mais nécessite quelques prérequis.', 1, '2025-07-04 00:00:00', '2025-07-04 00:00:00'),
(5, 8, 19, 5, 'Roman passionnant, très bien écrit. Je recommande vivement.', 1, '2025-07-04 00:00:00', '2025-07-04 00:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `role` enum('admin','librarian','student') DEFAULT 'student',
  `is_active` tinyint(1) DEFAULT 1,
  `profile_image` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des utilisateurs du système de bibliothèque';

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `first_name`, `last_name`, `phone`, `student_id`, `department`, `role`, `is_active`, `profile_image`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin@yori.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Admin', 'Principal', '+33123456789', NULL, 'Administration', 'admin', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(2, 'librarian@yori.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Sophie', 'Bibliothèque', '+33123456790', NULL, 'Bibliothèque', 'librarian', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(3, 'sophie.biblio@yori.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Sophie', 'Martin', '+33123456795', NULL, 'Bibliothèque Centrale', 'librarian', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(4, 'student@yori.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Étudiant', 'Principal', '+33123456791', NULL, 'Informatique', 'student', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(5, 'jean.dupont@student.univ.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Jean', 'Dupont', '+33123456792', NULL, 'Informatique', 'student', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(6, 'marie.martin@student.univ.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Marie', 'Martin', '+33123456793', NULL, 'Mathématiques', 'student', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(7, 'pierre.durand@student.univ.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Pierre', 'Durand', '+33123456794', NULL, 'Physique', 'student', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(8, 'test@example.com', '$2b$10$Rp4xLZK4KgRVVJ8TVGVHKOVoa8kBznqOw8OJ8cnMUV01W6lOD2dq.', 'Test', 'User', '+33123456796', NULL, 'Test', 'student', 1, NULL, NULL, '2025-07-04 22:23:48', '2025-07-04 22:23:48'),
(9, 'emm.sakpleto@gmail.com', '$2a$12$ti4CLnWKuVJA3CnPGFUMc.cl9qXHhc38F16c2zuTC3ALwyVSltuTK', 'Emmanuel', 'SAKPLETO', '+22607558858', NULL, 'IA', 'student', 1, NULL, NULL, '2025-07-05 11:14:09', '2025-07-05 11:14:09'),
(10, 'emmanuelsakpleto1@gmail.com', '$2a$12$xjnhmkHGSNbGoo2VfkuB/.SY7WRMLvs8tKQDtRCF7xuK2EXEVPhUS', 'Yao', 'SKT', '+336489579865', NULL, 'Data', 'student', 1, NULL, NULL, '2025-07-05 11:35:13', '2025-07-05 11:35:13');

-- --------------------------------------------------------

--
-- Structure de la table `user_book_likes`
--

CREATE TABLE `user_book_likes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Likes individuels par utilisateur et livre';

--
-- Déchargement des données de la table `user_book_likes`
--

INSERT INTO `user_book_likes` (`id`, `user_id`, `book_id`, `created_at`) VALUES
(4, 1, 13, '2025-07-05 19:19:41'),
(5, 1, 12, '2025-07-05 19:22:00'),
(6, 1, 11, '2025-07-05 19:22:01');

-- --------------------------------------------------------

--
-- Structure de la table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `refresh_token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des sessions utilisateur avec tokens de rafraîchissement';

--
-- Déchargement des données de la table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `refresh_token`, `expires_at`, `ip_address`, `user_agent`, `is_active`, `created_at`) VALUES
(1, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNjY5NzAzLCJleHAiOjE3NTQyNjE3MDN9.p6xnWOYi2bRMFAq7Y3wAmFOrtyLXbIhjHpV3Xh8pP-0', '2025-07-04 23:48:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-04 22:55:03'),
(2, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNjczMDU1LCJleHAiOjE3NTQyNjUwNTV9.x-Pb5sj5WyvJhQzRG9b2bDh2gjtwb933BsZSGVfXvMc', '2025-07-04 23:57:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-04 23:50:55'),
(3, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzUxNjczNDUyLCJleHAiOjE3NTQyNjU0NTJ9.BKiasDN_2x-s11K0XA3eMMQVd1otlChWcVsIYBudEGY', '2025-07-05 00:07:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-04 23:57:32'),
(4, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNjc0MDUyLCJleHAiOjE3NTQyNjYwNTJ9.KoiXFGjC7P5id4WglCSqA-0NVveU1ziB1zavMJtycJk', '2025-07-05 09:48:17', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 00:07:32'),
(5, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzA4OTAzLCJleHAiOjE3NTQzMDA5MDN9.2svbOKtfmP3qzcmdg83s4WbIyYCdVmzCmbjNWTf4-sE', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 09:48:23'),
(6, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzEwODg5LCJleHAiOjE3NTQzMDI4ODl9.BteZFQmjuiTRzprxXeksUHF9eGQewRyOf3mS0NofWcQ', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 10:21:29'),
(7, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzE1NTQzLCJleHAiOjE3NTQzMDc1NDN9.-gLi-ampcyfSHcByrirTkPq0n_FONmQBnZw4lj0kIxo', '2025-07-05 13:41:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 11:39:03'),
(8, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzE4NzQxLCJleHAiOjE3NTQzMTA3NDF9.VNYvnVcj5OcE3YQtiNGviq0FUU6uV-crAGBvY8oIAUw', '2025-07-05 20:21:18', '::1', 'curl/8.14.1', 0, '2025-07-05 12:32:21'),
(9, 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzUxNzIyOTAyLCJleHAiOjE3NTQzMTQ5MDJ9.ED7XIyuiPnDuZb50dGXjsy9nmXTm6NDAb4TcfFJmeFA', '2025-07-05 13:41:50', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 13:41:42'),
(10, 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzUxNzIyOTE4LCJleHAiOjE3NTQzMTQ5MTh9.mXkh_m0x-IURy-l_sAGxvbHKYggPXl7rcESA_Z7Wd3o', '2025-07-05 13:43:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 13:41:58'),
(11, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzIzMDExLCJleHAiOjE3NTQzMTUwMTF9.kxZ4kWNl3lVocK5VzhlU-AC0jJ_WSR9LY3bd9Y_Q3k8', '2025-07-05 13:54:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 13:43:31'),
(12, 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzUxNzIzNzA4LCJleHAiOjE3NTQzMTU3MDh9.SGdT0U9IFy4tQUEIiIkv-t9ykkSbLME8Zo1euFW2o9k', '2025-07-05 13:55:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 13:55:08'),
(13, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzUxNzIzNzczLCJleHAiOjE3NTQzMTU3NzN9.xz0SdZO6Zk4IIknfbkLBJb5TBTRaixJvwdD61iy2Uds', '2025-07-05 13:56:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 13:56:13'),
(14, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzIzODEzLCJleHAiOjE3NTQzMTU4MTN9.euwFwZa9YsW1VPo90yrBLftixQVWKQNzi4ERvONvVYY', '2025-07-05 14:08:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 13:56:53'),
(15, 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUxNzI0NjcxLCJleHAiOjE3NTQzMTY2NzF9.kq-r6F5bN5cP0lMd4cZDbDlm8H4_dAO9Vg9MBcuBd_Q', '2025-07-05 14:16:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 14:11:11'),
(16, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzI1MDIwLCJleHAiOjE3NTQzMTcwMjB9.vmy5sczCfLKRhxOoq5TDDyi22Gx2QR5lsxPUL6_hVTo', '2025-07-05 16:53:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 14:17:00'),
(17, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzM0NDM1LCJleHAiOjE3NTQzMjY0MzV9.zvGKKaMRcEwGuKFivIRM0LdC7dN1zeutaz5vLsuytBU', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 16:53:55'),
(18, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzM0Njg0LCJleHAiOjE3NTQzMjY2ODR9.RbhmYqwS1x7u6-7tQVlsrSf79UZaB_RNDTU1SsOEkeI', '2025-07-05 18:27:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 16:58:04'),
(19, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzQwMDUzLCJleHAiOjE3NTQzMzIwNTN9.PllshlBb8HUxNRho3csV9YyanLucuAZgalyIahfEMSM', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 18:27:33'),
(20, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzQwNTQ1LCJleHAiOjE3NTQzMzI1NDV9.Zlx8nAEansU--VcFrQXGJ6AX01x76mC9f9rrn8BRc00', '2025-07-05 18:36:01', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 18:35:45'),
(21, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzQwNTY2LCJleHAiOjE3NTQzMzI1NjZ9.taVm6kdDiOIPKhaSEAQnU_c-It9on_sU4UIBCzteXhM', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 18:36:06'),
(22, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzQxODIxLCJleHAiOjE3NTQzMzM4MjF9.fd70TYk_Mfi2EjF-CYVw6EKjS1dYBp2UpDntoq75u0k', '2025-07-05 20:08:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 18:57:01'),
(23, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzQ2MTE5LCJleHAiOjE3NTQzMzgxMTl9.MgSBScVNFr_0bVZcc2VO0W_F2t9AU93pP3McQiLChOY', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 20:08:39'),
(24, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzQ2NjU1LCJleHAiOjE3NTQzMzg2NTV9.odbyT9bTHqeYDePcFNaXBCzq-h38QDJMXH_Mr2FEhW0', '2025-07-05 20:19:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 20:17:35'),
(25, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzQ2Nzg2LCJleHAiOjE3NTQzMzg3ODZ9.OMD11asnDp-WWfYP6ZUgYc6sxWFVXXcuHCUhrLh0VCU', '2025-07-05 20:21:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 20:19:46'),
(26, 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzUxNzQ2ODkzLCJleHAiOjE3NTQzMzg4OTN9.ELgdqeYTiJwDAS0q999tBOIEJJ-fEgY3mkX-yTsPw7M', '2025-07-05 20:30:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 20:21:33'),
(27, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzUxNzQ3NDQ5LCJleHAiOjE3NTQzMzk0NDl9.MEdRAelTI86VBsU0R87f_3V0N4plfZP9SGvflu0MZvI', '2025-07-05 20:31:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 20:30:49'),
(28, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzUxNzQ3NTA1LCJleHAiOjE3NTQzMzk1MDV9.tSibrfNoo3CvTNHGP3rObQV--RtnXKwrGq_jssg2jZ4', '2025-07-05 20:49:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 0, '2025-07-05 20:31:45'),
(29, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUxNzQ4MzM0LCJleHAiOjE3NTQzNDAzMzR9.S7fHDvqdUW-ZJQJsrbSi4DtsFW4L7D38ZvvMaXH9EWU', '2025-08-04 20:45:34', '::1', 'curl/8.14.1', 1, '2025-07-05 20:45:34');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `isbn` (`isbn`),
  ADD KEY `idx_isbn` (`isbn`),
  ADD KEY `idx_title` (`title`),
  ADD KEY `idx_author` (`author`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_publication_year` (`publication_year`);

--
-- Index pour la table `loans`
--
ALTER TABLE `loans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_book_id` (`book_id`),
  ADD KEY `idx_loan_date` (`loan_date`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_return_date` (`return_date`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `related_loan_id` (`related_loan_id`),
  ADD KEY `related_book_id` (`related_book_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_is_sent` (`is_sent`),
  ADD KEY `idx_scheduled_for` (`scheduled_for`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_book` (`user_id`,`book_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_book_id` (`book_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_is_approved` (`is_approved`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Index pour la table `user_book_likes`
--
ALTER TABLE `user_book_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_book` (`user_id`,`book_id`),
  ADD KEY `idx_user_book_likes_user_id` (`user_id`),
  ADD KEY `idx_user_book_likes_book_id` (`book_id`);

--
-- Index pour la table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_refresh_token` (`refresh_token`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `loans`
--
ALTER TABLE `loans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT pour la table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `user_book_likes`
--
ALTER TABLE `user_book_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `loans`
--
ALTER TABLE `loans`
  ADD CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loans_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`related_loan_id`) REFERENCES `loans` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`related_book_id`) REFERENCES `books` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_book_likes`
--
ALTER TABLE `user_book_likes`
  ADD CONSTRAINT `user_book_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_book_likes_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
