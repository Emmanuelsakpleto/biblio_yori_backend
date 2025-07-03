const db = require('../config/database');
const { AppError } = require('../utils/helpers');

class StatisticsService {
  // Statistiques générales du système
  static async getSystemStats() {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
          (SELECT COUNT(*) FROM books WHERE is_available = true) as available_books,
          (SELECT COUNT(*) FROM books) as total_books,
          (SELECT COUNT(*) FROM loans WHERE status = 'active') as active_loans,
          (SELECT COUNT(*) FROM loans WHERE status = 'overdue') as overdue_loans,
          (SELECT COUNT(*) FROM loans) as total_loans,
          (SELECT COUNT(*) FROM reviews) as total_reviews,
          (SELECT ROUND(AVG(rating), 2) FROM reviews) as average_rating,
          (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des statistiques système', 500);
    }
  }

  // Statistiques des utilisateurs
  static async getUserStats(userId = null) {
    try {
      let query;
      let params = [];

      if (userId) {
        query = `
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id) as total_loans,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status = 'active') as active_loans,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status = 'overdue') as overdue_loans,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status = 'completed') as completed_loans,
            (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as total_reviews,
            (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE user_id = u.id) as average_rating_given,
            (SELECT COUNT(*) FROM notifications WHERE user_id = u.id AND is_read = false) as unread_notifications
          FROM users u
          WHERE u.id = $1 AND u.is_active = true
        `;
        params = [userId];
      } else {
        query = `
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.registration_date,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id) as total_loans,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status = 'active') as active_loans,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status = 'overdue') as overdue_loans,
            (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status = 'completed') as completed_loans,
            (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as total_reviews,
            (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE user_id = u.id) as average_rating_given
          FROM users u
          WHERE u.is_active = true
          ORDER BY u.registration_date DESC
          LIMIT 100
        `;
      }

      const result = await db.query(query, params);
      return userId ? result.rows[0] : result.rows;
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des statistiques utilisateur', 500);
    }
  }

  // Statistiques des livres
  static async getBookStats(bookId = null) {
    try {
      let query;
      let params = [];

      if (bookId) {
        query = `
          SELECT 
            b.id,
            b.title,
            b.author,
            b.isbn,
            b.publication_year,
            b.is_available,
            (SELECT COUNT(*) FROM loans WHERE book_id = b.id) as total_loans,
            (SELECT COUNT(*) FROM loans WHERE book_id = b.id AND status = 'active') as current_loans,
            (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) as total_reviews,
            (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE book_id = b.id) as average_rating,
            (SELECT COUNT(*) FROM loans WHERE book_id = b.id AND status = 'overdue') as overdue_count,
            (SELECT user_id FROM loans WHERE book_id = b.id AND status = 'active' LIMIT 1) as current_borrower_id,
            (SELECT due_date FROM loans WHERE book_id = b.id AND status = 'active' LIMIT 1) as current_due_date
          FROM books b
          WHERE b.id = $1
        `;
        params = [bookId];
      } else {
        query = `
          SELECT 
            b.id,
            b.title,
            b.author,
            b.category,
            b.is_available,
            b.created_at,
            (SELECT COUNT(*) FROM loans WHERE book_id = b.id) as total_loans,
            (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) as total_reviews,
            (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE book_id = b.id) as average_rating
          FROM books b
          ORDER BY b.created_at DESC
          LIMIT 100
        `;
      }

      const result = await db.query(query, params);
      return bookId ? result.rows[0] : result.rows;
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des statistiques des livres', 500);
    }
  }

  // Livres les plus populaires
  static async getPopularBooks(limit = 10) {
    try {
      const query = `
        SELECT 
          b.id,
          b.title,
          b.author,
          b.category,
          b.cover_image,
          COUNT(l.id) as loan_count,
          ROUND(AVG(r.rating), 2) as average_rating,
          COUNT(r.id) as review_count
        FROM books b
        LEFT JOIN loans l ON b.id = l.book_id
        LEFT JOIN reviews r ON b.id = r.book_id
        GROUP BY b.id, b.title, b.author, b.category, b.cover_image
        ORDER BY loan_count DESC, average_rating DESC
        LIMIT $1
      `;

      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des livres populaires', 500);
    }
  }

  // Utilisateurs les plus actifs
  static async getActiveUsers(limit = 10) {
    try {
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(l.id) as loan_count,
          COUNT(r.id) as review_count,
          ROUND(AVG(r.rating), 2) as average_rating_given,
          u.last_login_at
        FROM users u
        LEFT JOIN loans l ON u.id = l.user_id
        LEFT JOIN reviews r ON u.id = r.user_id
        WHERE u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.last_login_at
        ORDER BY loan_count DESC, review_count DESC
        LIMIT $1
      `;

      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des utilisateurs actifs', 500);
    }
  }

  // Statistiques par période
  static async getStatsByPeriod(period = 'month', startDate, endDate) {
    try {
      let dateFilter = '';
      let groupBy = '';
      
      switch (period) {
        case 'day':
          groupBy = "DATE_TRUNC('day', created_at)";
          break;
        case 'week':
          groupBy = "DATE_TRUNC('week', created_at)";
          break;
        case 'month':
          groupBy = "DATE_TRUNC('month', created_at)";
          break;
        case 'year':
          groupBy = "DATE_TRUNC('year', created_at)";
          break;
        default:
          groupBy = "DATE_TRUNC('month', created_at)";
      }

      if (startDate && endDate) {
        dateFilter = `WHERE created_at BETWEEN '${startDate}' AND '${endDate}'`;
      }

      const loansQuery = `
        SELECT 
          ${groupBy} as period,
          COUNT(*) as loan_count
        FROM loans
        ${dateFilter}
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `;

      const usersQuery = `
        SELECT 
          ${groupBy} as period,
          COUNT(*) as new_users
        FROM users
        ${dateFilter.replace('created_at', 'registration_date')}
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `;

      const booksQuery = `
        SELECT 
          ${groupBy} as period,
          COUNT(*) as new_books
        FROM books
        ${dateFilter}
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `;

      const [loansResult, usersResult, booksResult] = await Promise.all([
        db.query(loansQuery),
        db.query(usersQuery),
        db.query(booksQuery)
      ]);

      return {
        loans: loansResult.rows,
        users: usersResult.rows,
        books: booksResult.rows
      };
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des statistiques par période', 500);
    }
  }

  // Statistiques des retards
  static async getOverdueStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_overdue,
          AVG(EXTRACT(DAY FROM NOW() - due_date)) as average_days_overdue,
          MIN(due_date) as oldest_overdue,
          MAX(due_date) as newest_overdue,
          COUNT(DISTINCT user_id) as users_with_overdue
        FROM loans
        WHERE status = 'overdue'
      `;

      const detailQuery = `
        SELECT 
          l.id,
          l.loan_date,
          l.due_date,
          EXTRACT(DAY FROM NOW() - l.due_date) as days_overdue,
          u.first_name,
          u.last_name,
          u.email,
          b.title,
          b.author
        FROM loans l
        JOIN users u ON l.user_id = u.id
        JOIN books b ON l.book_id = b.id
        WHERE l.status = 'overdue'
        ORDER BY l.due_date ASC
      `;

      const [statsResult, detailResult] = await Promise.all([
        db.query(query),
        db.query(detailQuery)
      ]);

      return {
        summary: statsResult.rows[0],
        details: detailResult.rows
      };
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des statistiques de retards', 500);
    }
  }

  // Rapport mensuel
  static async getMonthlyReport(year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const query = `
        SELECT 
          'loans' as type,
          COUNT(*) as count
        FROM loans 
        WHERE DATE(loan_date) BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT 
          'users' as type,
          COUNT(*) as count
        FROM users 
        WHERE DATE(registration_date) BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT 
          'books' as type,
          COUNT(*) as count
        FROM books 
        WHERE DATE(created_at) BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT 
          'reviews' as type,
          COUNT(*) as count
        FROM reviews 
        WHERE DATE(created_at) BETWEEN $1 AND $2
      `;

      const result = await db.query(query, [startDate, endDate]);
      
      const report = {
        period: `${year}-${month.toString().padStart(2, '0')}`,
        loans: 0,
        users: 0,
        books: 0,
        reviews: 0
      };

      result.rows.forEach(row => {
        report[row.type] = parseInt(row.count);
      });

      return report;
    } catch (error) {
      throw new AppError('Erreur lors de la génération du rapport mensuel', 500);
    }
  }

  // Statistiques des catégories
  static async getCategoryStats() {
    try {
      const query = `
        SELECT 
          b.category,
          COUNT(b.id) as book_count,
          COUNT(l.id) as loan_count,
          ROUND(AVG(r.rating), 2) as average_rating,
          COUNT(r.id) as review_count
        FROM books b
        LEFT JOIN loans l ON b.id = l.book_id
        LEFT JOIN reviews r ON b.id = r.book_id
        GROUP BY b.category
        ORDER BY loan_count DESC, book_count DESC
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw new AppError('Erreur lors de la récupération des statistiques par catégorie', 500);
    }
  }

  // Dashboard administrateur
  static async getAdminDashboard() {
    try {
      const systemStats = await this.getSystemStats();
      
      // Calculer les nouveaux utilisateurs de cette semaine
      const weekAgoQuery = `
        SELECT COUNT(*) as new_users_this_week
        FROM users 
        WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `;
      const weekAgoResult = await db.query(weekAgoQuery);
      
      return {
        totalUsers: parseInt(systemStats.active_users) || 0,
        totalBooks: parseInt(systemStats.total_books) || 0,
        activeLoans: parseInt(systemStats.active_loans) || 0,
        overdueLoans: parseInt(systemStats.overdue_loans) || 0,
        pendingReturns: parseInt(systemStats.active_loans) || 0, // Approximation
        newUsersThisWeek: parseInt(weekAgoResult.rows[0]?.new_users_this_week) || 0,
        availableBooks: parseInt(systemStats.available_books) || 0,
        totalReviews: parseInt(systemStats.total_reviews) || 0,
        averageRating: parseFloat(systemStats.average_rating) || 0,
        unreadNotifications: parseInt(systemStats.unread_notifications) || 0
      };
    } catch (error) {
      throw new AppError('Erreur lors de la récupération du dashboard administrateur', 500);
    }
  }
}

module.exports = StatisticsService;