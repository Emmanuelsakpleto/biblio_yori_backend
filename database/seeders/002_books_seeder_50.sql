-- ===================================
-- SEEDER 002: 50 Livres modernes complets
-- Date: 2025-07-02
-- Description: 50 livres réalistes avec images et informations complètes
-- ===================================

-- Vider la table books avant d'insérer
DELETE FROM books;

-- Insérer 50 livres avec toutes les informations
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
    total_copies,
    available_copies,
    location,
    cover_image
) VALUES 

-- INFORMATIQUE & PROGRAMMATION (15 livres)
(
    'Clean Code: A Handbook of Agile Software Craftsmanship',
    'Robert C. Martin',
    '9780132350884',
    'Pearson',
    2008,
    'Informatique',
    'Ce livre présente une série de bonnes pratiques pour écrire du code propre et maintenable. Il couvre les principes fondamentaux de la programmation professionnelle et propose des techniques concrètes pour améliorer la qualité du code.',
    'fr',
    464,
    3,
    2,
    'A-INF-001',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=400&fit=crop&q=80'
),

(
    'Design Patterns: Elements of Reusable Object-Oriented Software',
    'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    '9780201633610',
    'Addison-Wesley',
    1994,
    'Informatique',
    'Le livre de référence sur les patterns de conception en programmation orientée objet. Il présente 23 patterns essentiels avec des exemples pratiques et des cas d''usage concrets.',
    'fr',
    395,
    2,
    1,
    'A-INF-002',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop&q=80'
),

(
    'JavaScript: The Definitive Guide',
    'David Flanagan',
    '9781491952023',
    'O''Reilly Media',
    2020,
    'Informatique',
    'Guide complet du langage JavaScript couvrant les dernières fonctionnalités d''ES2020. De la syntaxe de base aux concepts avancés, ce livre est une référence incontournable pour tous les développeurs JavaScript.',
    'fr',
    687,
    4,
    3,
    'A-INF-003',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=400&fit=crop&q=80'
),

(
    'Python Crash Course',
    'Eric Matthes',
    '9781718502703',
    'No Starch Press',
    2019,
    'Informatique',
    'Introduction pratique et complète à Python. Ce livre enseigne les bases du langage à travers des projets concrets : jeux, visualisations de données et applications web.',
    'fr',
    544,
    3,
    2,
    'A-INF-004',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&h=400&fit=crop&q=80'
),

(
    'Algorithms',
    'Robert Sedgewick, Kevin Wayne',
    '9780321573513',
    'Addison-Wesley',
    2011,
    'Informatique',
    'Référence moderne sur les algorithmes et structures de données. Couvre les algorithmes essentiels avec des implémentations en Java et des analyses de performance détaillées.',
    'fr',
    955,
    2,
    2,
    'A-INF-005',
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=300&h=400&fit=crop&q=80'
),

(
    'The Pragmatic Programmer',
    'David Thomas, Andrew Hunt',
    '9780135957059',
    'Addison-Wesley',
    2019,
    'Informatique',
    'Guide essentiel pour devenir un programmeur efficace et professionnel. Ce livre présente des conseils pratiques et des techniques éprouvées pour améliorer ses compétences de développeur.',
    'fr',
    352,
    3,
    1,
    'A-INF-006',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&h=400&fit=crop&q=80'
),

(
    'System Design Interview',
    'Alex Xu',
    '9798664653403',
    'Independently published',
    2020,
    'Informatique',
    'Guide complet pour réussir les entretiens de conception de systèmes. Couvre les principes fondamentaux et présente des études de cas réelles d''architectures à grande échelle.',
    'fr',
    322,
    2,
    2,
    'A-INF-007',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=400&fit=crop&q=80'
),

(
    'React: The Complete Reference',
    'Thomas Powell',
    '9781260135718',
    'McGraw-Hill Education',
    2021,
    'Informatique',
    'Référence complète pour maîtriser React et l''écosystème moderne du développement front-end. Couvre React, Redux, hooks, et les dernières bonnes pratiques.',
    'fr',
    896,
    3,
    3,
    'A-INF-008',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=400&fit=crop&q=80'
),

(
    'Database Systems: The Complete Book',
    'Hector Garcia-Molina, Jeffrey Ullman, Jennifer Widom',
    '9780131873254',
    'Prentice Hall',
    2008,
    'Informatique',
    'Traité complet sur les systèmes de bases de données couvrant la théorie et la pratique. De la conception relationnelle aux systèmes distribués modernes.',
    'fr',
    1203,
    2,
    1,
    'A-INF-009',
    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=300&h=400&fit=crop&q=80'
),

(
    'Cybersecurity Essentials',
    'Charles J. Brooks',
    '9781119362395',
    'Wiley',
    2018,
    'Informatique',
    'Guide essentiel de la cybersécurité couvrant les menaces actuelles, les techniques de protection et les meilleures pratiques de sécurité informatique.',
    'fr',
    528,
    3,
    2,
    'A-INF-010',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&h=400&fit=crop&q=80'
),

(
    'Machine Learning Yearning',
    'Andrew Ng',
    '9780999579923',
    'Draft',
    2018,
    'Informatique',
    'Guide pratique pour structurer des projets de machine learning. Andrew Ng partage son expérience pour construire des systèmes d''IA efficaces.',
    'fr',
    118,
    2,
    2,
    'A-INF-011',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=300&h=400&fit=crop&q=80'
),

(
    'Docker Deep Dive',
    'Nigel Poulton',
    '9781521822808',
    'Independently published',
    2020,
    'Informatique',
    'Guide complet pour maîtriser Docker et la conteneurisation. De l''installation aux déploiements en production, ce livre couvre tous les aspects essentiels.',
    'fr',
    394,
    3,
    1,
    'A-INF-012',
    'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=300&h=400&fit=crop&q=80'
),

(
    'Git Pro',
    'Scott Chacon, Ben Straub',
    '9781484200773',
    'Apress',
    2014,
    'Informatique',
    'Manuel complet pour maîtriser Git, le système de contrôle de version le plus populaire. Couvre les commandes de base aux workflows avancés.',
    'fr',
    456,
    4,
    4,
    'A-INF-013',
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=300&h=400&fit=crop&q=80'
),

(
    'Cloud Computing: Concepts, Technology & Architecture',
    'Thomas Erl',
    '9780133387520',
    'Prentice Hall',
    2013,
    'Informatique',
    'Introduction complète au cloud computing couvrant les concepts fondamentaux, les technologies et les architectures. Guide essentiel pour comprendre le cloud moderne.',
    'fr',
    528,
    2,
    2,
    'A-INF-014',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=400&fit=crop&q=80'
),

(
    'Artificial Intelligence: A Modern Approach',
    'Stuart Russell, Peter Norvig',
    '9780134610993',
    'Pearson',
    2020,
    'Informatique',
    'Le manuel de référence en intelligence artificielle. Couvre tous les aspects de l''IA moderne : recherche, logique, apprentissage automatique, et applications pratiques.',
    'fr',
    1152,
    2,
    1,
    'A-INF-015',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=400&fit=crop&q=80'
),

-- MATHÉMATIQUES (10 livres)
(
    'Calculus: Early Transcendentals',
    'James Stewart',
    '9781285741550',
    'Cengage Learning',
    2015,
    'Mathématiques',
    'Manuel de référence en calcul différentiel et intégral. Couvre les limites, dérivées, intégrales et séries avec de nombreux exemples et exercices pratiques.',
    'fr',
    1368,
    3,
    2,
    'B-MAT-001',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=400&fit=crop&q=80'
),

(
    'Linear Algebra and Its Applications',
    'David C. Lay',
    '9780321982384',
    'Pearson',
    2015,
    'Mathématiques',
    'Introduction moderne à l''algèbre linéaire avec applications. Couvre les espaces vectoriels, matrices, valeurs propres et applications en informatique et ingénierie.',
    'fr',
    576,
    3,
    1,
    'B-MAT-002',
    'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&h=400&fit=crop&q=80'
),

(
    'Statistics for Engineers and Scientists',
    'William Navidi',
    '9780073401331',
    'McGraw-Hill',
    2014,
    'Mathématiques',
    'Manuel de statistiques appliquées aux sciences et à l''ingénierie. Couvre les probabilités, tests d''hypothèses, régression et analyse de variance.',
    'fr',
    890,
    2,
    2,
    'B-MAT-003',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&h=400&fit=crop&q=80'
),

(
    'Discrete Mathematics and Its Applications',
    'Kenneth Rosen',
    '9781259676512',
    'McGraw-Hill',
    2018,
    'Mathématiques',
    'Introduction complète aux mathématiques discrètes. Couvre la logique, ensembles, fonctions, algorithmes, théorie des graphes et combinatoire.',
    'fr',
    972,
    3,
    3,
    'B-MAT-004',
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=400&fit=crop&q=80'
),

(
    'Introduction to Mathematical Thinking',
    'Keith Devlin',
    '9780615653631',
    'Keith Devlin',
    2012,
    'Mathématiques',
    'Guide pour développer la pensée mathématique moderne. Enseigne comment lire, comprendre et construire des preuves mathématiques rigoureuses.',
    'fr',
    106,
    4,
    3,
    'B-MAT-005',
    'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=300&h=400&fit=crop&q=80'
),

(
    'Real Analysis',
    'Elias M. Stein, Rami Shakarchi',
    '9780691113869',
    'Princeton University Press',
    2005,
    'Mathématiques',
    'Introduction rigoureuse à l''analyse réelle. Couvre les fondements de l''analyse moderne : mesure, intégration, espaces de fonctions et applications.',
    'fr',
    402,
    2,
    1,
    'B-MAT-006',
    'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=300&h=400&fit=crop&q=80'
),

(
    'Abstract Algebra',
    'David S. Dummit, Richard M. Foote',
    '9780471433347',
    'Wiley',
    2003,
    'Mathématiques',
    'Traité complet d''algèbre abstraite couvrant les groupes, anneaux, corps et théorie de Galois. Référence essentielle pour l''algèbre moderne.',
    'fr',
    932,
    2,
    2,
    'B-MAT-007',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=400&fit=crop&q=80'
),

(
    'Numerical Methods',
    'Richard L. Burden, J. Douglas Faires',
    '9781305253667',
    'Cengage Learning',
    2015,
    'Mathématiques',
    'Manuel de méthodes numériques couvrant l''interpolation, intégration numérique, résolution d''équations et approximation. Avec implémentations pratiques.',
    'fr',
    895,
    3,
    2,
    'B-MAT-008',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&h=400&fit=crop&q=80'
),

(
    'Graph Theory',
    'Reinhard Diestel',
    '9783662575604',
    'Springer',
    2017,
    'Mathématiques',
    'Introduction moderne à la théorie des graphes. Couvre les concepts fondamentaux et les applications en informatique, optimisation et réseaux.',
    'fr',
    428,
    2,
    1,
    'B-MAT-009',
    'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&h=400&fit=crop&q=80'
),

(
    'Introduction to Probability',
    'Dimitri P. Bertsekas, John N. Tsitsiklis',
    '9781886529236',
    'Athena Scientific',
    2008,
    'Mathématiques',
    'Manuel de probabilités couvrant les concepts fondamentaux et applications. De la probabilité discrète aux processus stochastiques.',
    'fr',
    544,
    3,
    3,
    'B-MAT-010',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=400&fit=crop&q=80'
),

-- PHYSIQUE (8 livres)
(
    'University Physics with Modern Physics',
    'Hugh D. Young, Roger A. Freedman',
    '9780135159552',
    'Pearson',
    2019,
    'Physique',
    'Manuel complet de physique universitaire couvrant la mécanique, thermodynamique, électromagnétisme, optique et physique moderne.',
    'fr',
    1632,
    3,
    2,
    'C-PHY-001',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&h=400&fit=crop&q=80'
),

(
    'Introduction to Quantum Mechanics',
    'David J. Griffiths',
    '9781107189638',
    'Cambridge University Press',
    2016,
    'Physique',
    'Introduction claire et rigoureuse à la mécanique quantique. Couvre les postulats, équation de Schrödinger, et applications aux atomes et molécules.',
    'fr',
    508,
    2,
    1,
    'C-PHY-002',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop&q=80'
),

(
    'Classical Mechanics',
    'John R. Taylor',
    '9781891389221',
    'University Science Books',
    2005,
    'Physique',
    'Traité moderne de mécanique classique. De la mécanique newtonienne à la mécanique lagrangienne et hamiltonienne, avec applications contemporaines.',
    'fr',
    786,
    2,
    2,
    'C-PHY-003',
    'https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=300&h=400&fit=crop&q=80'
),

(
    'Introduction to Electrodynamics',
    'David J. Griffiths',
    '9781108420419',
    'Cambridge University Press',
    2017,
    'Physique',
    'Manuel de référence en électrodynamique couvrant l''électrostatique, magnétostatique, induction électromagnétique et ondes électromagnétiques.',
    'fr',
    619,
    3,
    1,
    'C-PHY-004',
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=300&h=400&fit=crop&q=80'
),

(
    'Thermodynamics and Statistical Mechanics',
    'Walter Greiner, Ludwig Neise, Horst Stöcker',
    '9781461254805',
    'Springer',
    2012,
    'Physique',
    'Introduction à la thermodynamique et mécanique statistique. Couvre les lois de la thermodynamique et les fondements statistiques.',
    'fr',
    463,
    2,
    2,
    'C-PHY-005',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=400&fit=crop&q=80'
),

(
    'Astrophysics in a Nutshell',
    'Dan Maoz',
    '9780691164793',
    'Princeton University Press',
    2016,
    'Physique',
    'Introduction concise à l''astrophysique moderne. Couvre les étoiles, galaxies, cosmologie et physique des objets extrêmes.',
    'fr',
    312,
    3,
    3,
    'C-PHY-006',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop&q=80'
),

(
    'Solid State Physics',
    'Neil W. Ashcroft, N. David Mermin',
    '9780030839931',
    'Cengage Learning',
    1976,
    'Physique',
    'Référence classique en physique du solide. Couvre la structure cristalline, propriétés électroniques, thermiques et magnétiques des solides.',
    'fr',
    826,
    2,
    1,
    'C-PHY-007',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=400&fit=crop&q=80'
),

(
    'Particle Physics: An Introduction',
    'Frank Close',
    '9780199695614',
    'Oxford University Press',
    2013,
    'Physique',
    'Introduction accessible à la physique des particules. Couvre le modèle standard, interactions fondamentales et découvertes récentes.',
    'fr',
    162,
    3,
    2,
    'C-PHY-008',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop&q=80'
),

-- LITTÉRATURE (8 livres)
(
    'Les Misérables',
    'Victor Hugo',
    '9782070409228',
    'Gallimard',
    1862,
    'Littérature',
    'Chef-d''œuvre de la littérature française suivant le destin de Jean Valjean dans la France du XIXe siècle. Fresque sociale et humaine d''une ampleur exceptionnelle.',
    'fr',
    1536,
    4,
    3,
    'D-LIT-001',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80'
),

(
    'L''Étranger',
    'Albert Camus',
    '9782070360024',
    'Gallimard',
    1942,
    'Littérature',
    'Roman emblématique de l''absurde racontant l''histoire de Meursault, homme indifférent face à l''existence. Œuvre majeure de la littérature du XXe siècle.',
    'fr',
    186,
    5,
    4,
    'D-LIT-002',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80'
),

(
    'Le Petit Prince',
    'Antoine de Saint-Exupéry',
    '9782070612758',
    'Gallimard',
    1943,
    'Littérature',
    'Conte poétique et philosophique racontant la rencontre entre un aviateur et un petit prince venu d''une autre planète. Allégorie sur l''enfance et l''amitié.',
    'fr',
    96,
    6,
    5,
    'D-LIT-003',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80'
),

(
    '1984',
    'George Orwell',
    '9782070368228',
    'Gallimard',
    1949,
    'Littérature',
    'Dystopie prophétique décrivant une société totalitaire sous surveillance permanente. Roman d''anticipation devenu référence sur les dérives autoritaires.',
    'fr',
    439,
    4,
    2,
    'D-LIT-004',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop&q=80'
),

(
    'Pride and Prejudice',
    'Jane Austen',
    '9780141439518',
    'Penguin Classics',
    1813,
    'Littérature',
    'Roman social anglais suivant les relations entre Elizabeth Bennet et Mr. Darcy. Critique subtile de la société aristocratique du XIXe siècle.',
    'fr',
    416,
    3,
    3,
    'D-LIT-005',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80'
),

(
    'To Kill a Mockingbird',
    'Harper Lee',
    '9780061120084',
    'Harper',
    1960,
    'Littérature',
    'Roman emblématique sur le racisme dans le Sud américain des années 1930, vu à travers les yeux de Scout Finch. Prix Pulitzer 1961.',
    'fr',
    376,
    3,
    2,
    'D-LIT-006',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&q=80'
),

(
    'One Hundred Years of Solitude',
    'Gabriel García Márquez',
    '9780060883287',
    'Harper',
    1967,
    'Littérature',
    'Chef-d''œuvre du réalisme magique racontant l''histoire de la famille Buendía sur plusieurs générations. Prix Nobel de littérature.',
    'fr',
    448,
    2,
    1,
    'D-LIT-007',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80'
),

(
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    '9780743273565',
    'Scribner',
    1925,
    'Littérature',
    'Roman emblématique des Années folles américaines suivant Jay Gatsby et son amour obsessionnel. Critique du rêve américain et de la société de consommation.',
    'fr',
    180,
    4,
    4,
    'D-LIT-008',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80'
),

-- ÉCONOMIE & GESTION (9 livres)
(
    'Principles of Economics',
    'N. Gregory Mankiw',
    '9781305585126',
    'Cengage Learning',
    2017,
    'Économie',
    'Manuel de référence en économie couvrant microéconomie et macroéconomie. Introduction claire aux concepts fondamentaux avec applications contemporaines.',
    'fr',
    888,
    3,
    2,
    'E-ECO-001',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80'
),

(
    'The Lean Startup',
    'Eric Ries',
    '9780307887894',
    'Crown Business',
    2011,
    'Économie',
    'Méthodologie révolutionnaire pour créer des entreprises innovantes en réduisant les risques. Approche itérative basée sur l''apprentissage validé.',
    'fr',
    336,
    4,
    3,
    'E-ECO-002',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80'
),

(
    'Good to Great',
    'Jim Collins',
    '9780066620992',
    'HarperBusiness',
    2001,
    'Économie',
    'Étude des facteurs qui permettent aux entreprises de passer de la performance correcte à l''excellence durable. Analyse de 11 entreprises exceptionnelles.',
    'fr',
    320,
    3,
    2,
    'E-ECO-003',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80'
),

(
    'Thinking, Fast and Slow',
    'Daniel Kahneman',
    '9780374533557',
    'Farrar, Straus and Giroux',
    2011,
    'Économie',
    'Exploration des mécanismes de la prise de décision par le prix Nobel d''économie. Analyse des biais cognitifs et de la psychologie comportementale.',
    'fr',
    499,
    3,
    1,
    'E-ECO-004',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&q=80'
),

(
    'The Intelligent Investor',
    'Benjamin Graham',
    '9780060555665',
    'Harper',
    2006,
    'Économie',
    'Guide classique de l''investissement value par le mentor de Warren Buffett. Principes intemporels pour investir intelligemment en bourse.',
    'fr',
    640,
    2,
    2,
    'E-ECO-005',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80'
),

(
    'Blue Ocean Strategy',
    'W. Chan Kim, Renée Mauborgne',
    '9781625274496',
    'Harvard Business Review Press',
    2015,
    'Économie',
    'Stratégie révolutionnaire pour créer de nouveaux espaces de marché sans concurrence. Méthodologie pour innover et capturer une demande nouvelle.',
    'fr',
    287,
    3,
    3,
    'E-ECO-006',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80'
),

(
    'The Art of War',
    'Sun Tzu',
    '9781599869773',
    'Filiquarian Publishing',
    2006,
    'Économie',
    'Traité stratégique antique appliqué au business moderne. Principes intemporels de stratégie et de leadership pour réussir en entreprise.',
    'fr',
    112,
    4,
    4,
    'E-ECO-007',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80'
),

(
    'Rich Dad Poor Dad',
    'Robert Kiyosaki',
    '9781612680194',
    'Plata Publishing',
    2017,
    'Économie',
    'Guide de l''éducation financière contrastant deux approches de l''argent. Principes pour développer l''intelligence financière et créer la richesse.',
    'fr',
    336,
    5,
    3,
    'E-ECO-008',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop&q=80'
),

(
    'The 4-Hour Workweek',
    'Timothy Ferriss',
    '9780307465351',
    'Crown',
    2009,
    'Économie',
    'Guide pour automatiser ses revenus et optimiser son style de vie. Méthodologie pour travailler moins tout en gagnant plus grâce à l''efficacité.',
    'fr',
    416,
    3,
    2,
    'E-ECO-009',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&q=80'
);

-- Mettre à jour les statistiques de la table
ANALYZE TABLE books;

-- Afficher un résumé des livres ajoutés
SELECT 
    category,
    COUNT(*) as nombre_livres,
    SUM(total_copies) as total_exemplaires,
    SUM(available_copies) as exemplaires_disponibles
FROM books 
GROUP BY category
ORDER BY nombre_livres DESC;

-- ===================================
-- FIN DU SEEDER
-- ===================================
