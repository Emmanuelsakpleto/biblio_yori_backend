-- Schéma complet de la base de données LECTURA

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS lectura_db.users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'student', 'librarian') DEFAULT 'student',
  student_id VARCHAR(20) UNIQUE,
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_student_id (student_id),
  INDEX idx_role (role)
);

-- Table des livres
CREATE TABLE IF NOT EXISTS lectura_db.books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  publisher VARCHAR(100),
  publication_year YEAR,
  category VARCHAR(50),
  description TEXT,
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  status ENUM('available', 'borrowed', 'reserved', 'maintenance', 'lost') DEFAULT 'available',
  cover_image VARCHAR(255),
  language VARCHAR(10) DEFAULT 'fr',
  pages INT,
  location VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_title (title),
  INDEX idx_author (author),
  INDEX idx_isbn (isbn),
  INDEX idx_category (category),
  INDEX idx_status (status),
  FULLTEXT idx_search (title, author, description)
);

-- Table des emprunts
CREATE TABLE IF NOT EXISTS lectura_db.loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  loan_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  status ENUM('active', 'returned', 'overdue', 'reserved') DEFAULT 'active',
  renewals_count INT DEFAULT 0,
  late_fee DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_book_id (book_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);

-- Table des avis/critiques
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_user_book_review (user_id, book_id),
  INDEX idx_book_id (book_id),
  INDEX idx_rating (rating),
  INDEX idx_approved (is_approved)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('loan_reminder', 'overdue_notice', 'reservation_ready', 'book_returned', 'account_created', 'password_reset') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  related_loan_id INT NULL,
  related_book_id INT NULL,
  scheduled_for TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_loan_id) REFERENCES loans(id) ON DELETE SET NULL,
  FOREIGN KEY (related_book_id) REFERENCES books(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_read (is_read),
  INDEX idx_sent (is_sent),
  INDEX idx_scheduled (scheduled_for)
);

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS lectura_db.user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_refresh_token (refresh_token),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Vues utiles
CREATE OR REPLACE VIEW active_loans AS
SELECT 
  l.*,
  u.first_name,
  u.last_name,
  u.email,
  b.title,
  b.author,
  CASE 
    WHEN l.due_date < CURDATE() THEN 'overdue'
    WHEN l.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 'due_soon'
    ELSE 'active'
  END as urgency
FROM loans l
JOIN users u ON l.user_id = u.id
JOIN books b ON l.book_id = b.id
WHERE l.status = 'active';

-- Procédures stockées utiles
DELIMITER //

CREATE PROCEDURE GetUserLoanHistory(IN userId INT)
BEGIN
  SELECT 
    l.*,
    b.title,
    b.author,
    b.isbn
  FROM loans l
  JOIN books b ON l.book_id = b.id
  WHERE l.user_id = userId
  ORDER BY l.created_at DESC;
END //

CREATE PROCEDURE GetOverdueLoans()
BEGIN
  SELECT 
    l.*,
    u.first_name,
    u.last_name,
    u.email,
    b.title,
    b.author,
    DATEDIFF(CURDATE(), l.due_date) as days_overdue
  FROM loans l
  JOIN users u ON l.user_id = u.id
  JOIN books b ON l.book_id = b.id
  WHERE l.status = 'active' AND l.due_date < CURDATE()
  ORDER BY days_overdue DESC;
END //

DELIMITER ;