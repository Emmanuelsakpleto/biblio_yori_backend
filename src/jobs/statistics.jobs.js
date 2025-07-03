const cron = require('node-cron');
const { logger } = require('../utils/helpers');
const StatisticsService = require('../services/statistics.service');
const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class StatisticsJobs {
  // Générer les statistiques quotidiennes (tous les jours à 1h du matin)
  static scheduleDailyStatistics() {
    cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('📊 Génération des statistiques quotidiennes...');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        // Calculer les statistiques du jour précédent
        const dailyStats = await StatisticsService.getDailyStatistics(dateStr);
        
        // Sauvegarder en base
        const query = `
          INSERT INTO daily_statistics 
          (date, total_users, active_users, new_users, total_books, 
           total_loans, new_loans, returned_loans, overdue_loans, 
           total_reviews, new_reviews, average_rating, revenue)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          total_users = VALUES(total_users),
          active_users = VALUES(active_users),
          new_users = VALUES(new_users),
          total_books = VALUES(total_books),
          total_loans = VALUES(total_loans),
          new_loans = VALUES(new_loans),
          returned_loans = VALUES(returned_loans),
          overdue_loans = VALUES(overdue_loans),
          total_reviews = VALUES(total_reviews),
          new_reviews = VALUES(new_reviews),
          average_rating = VALUES(average_rating),
          revenue = VALUES(revenue)
        `;
        
        await db.query(query, [
          dateStr,
          dailyStats.users.total,
          dailyStats.users.active,
          dailyStats.users.new,
          dailyStats.books.total,
          dailyStats.loans.total,
          dailyStats.loans.new,
          dailyStats.loans.returned,
          dailyStats.loans.overdue,
          dailyStats.reviews.total,
          dailyStats.reviews.new,
          dailyStats.reviews.averageRating,
          dailyStats.revenue.total
        ]);
        
        logger.info(`✅ Statistiques quotidiennes générées pour ${dateStr}`);
      } catch (error) {
        logger.error('❌ Erreur génération statistiques quotidiennes:', error);
      }
    });
  }

  // Générer les statistiques hebdomadaires (tous les lundis à 2h du matin)
  static scheduleWeeklyStatistics() {
    cron.schedule('0 2 * * 1', async () => {
      try {
        logger.info('📊 Génération des statistiques hebdomadaires...');
        
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weekStart = new Date(lastWeek);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lundi
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Dimanche
        
        const weeklyStats = await StatisticsService.getWeeklyStatistics(
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );
        
        // Sauvegarder en base
        const query = `
          INSERT INTO weekly_statistics 
          (week_start, week_end, total_users, active_users, new_users, 
           total_loans, new_loans, returned_loans, overdue_loans,
           total_reviews, new_reviews, average_rating, revenue,
           most_popular_book_id, most_active_user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          total_users = VALUES(total_users),
          active_users = VALUES(active_users),
          new_users = VALUES(new_users),
          total_loans = VALUES(total_loans),
          new_loans = VALUES(new_loans),
          returned_loans = VALUES(returned_loans),
          overdue_loans = VALUES(overdue_loans),
          total_reviews = VALUES(total_reviews),
          new_reviews = VALUES(new_reviews),
          average_rating = VALUES(average_rating),
          revenue = VALUES(revenue),
          most_popular_book_id = VALUES(most_popular_book_id),
          most_active_user_id = VALUES(most_active_user_id)
        `;
        
        await db.query(query, [
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0],
          weeklyStats.users.total,
          weeklyStats.users.active,
          weeklyStats.users.new,
          weeklyStats.loans.total,
          weeklyStats.loans.new,
          weeklyStats.loans.returned,
          weeklyStats.loans.overdue,
          weeklyStats.reviews.total,
          weeklyStats.reviews.new,
          weeklyStats.reviews.averageRating,
          weeklyStats.revenue.total,
          weeklyStats.mostPopularBook?.id || null,
          weeklyStats.mostActiveUser?.id || null
        ]);
        
        logger.info(`✅ Statistiques hebdomadaires générées pour la semaine du ${weekStart.toISOString().split('T')[0]}`);
      } catch (error) {
        logger.error('❌ Erreur génération statistiques hebdomadaires:', error);
      }
    });
  }

  // Générer les statistiques mensuelles (le 1er de chaque mois à 3h du matin)
  static scheduleMonthlyStatistics() {
    cron.schedule('0 3 1 * *', async () => {
      try {
        logger.info('📊 Génération des statistiques mensuelles...');
        
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        
        const monthlyStats = await StatisticsService.getMonthlyStatistics(
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0]
        );
        
        // Sauvegarder en base
        const query = `
          INSERT INTO monthly_statistics 
          (year, month, total_users, active_users, new_users, 
           total_books, new_books, total_loans, new_loans, returned_loans, overdue_loans,
           total_reviews, new_reviews, average_rating, revenue,
           most_popular_category, most_popular_book_id, most_active_user_id,
           retention_rate, churn_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          total_users = VALUES(total_users),
          active_users = VALUES(active_users),
          new_users = VALUES(new_users),
          total_books = VALUES(total_books),
          new_books = VALUES(new_books),
          total_loans = VALUES(total_loans),
          new_loans = VALUES(new_loans),
          returned_loans = VALUES(returned_loans),
          overdue_loans = VALUES(overdue_loans),
          total_reviews = VALUES(total_reviews),
          new_reviews = VALUES(new_reviews),
          average_rating = VALUES(average_rating),
          revenue = VALUES(revenue),
          most_popular_category = VALUES(most_popular_category),
          most_popular_book_id = VALUES(most_popular_book_id),
          most_active_user_id = VALUES(most_active_user_id),
          retention_rate = VALUES(retention_rate),
          churn_rate = VALUES(churn_rate)
        `;
        
        await db.query(query, [
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          monthlyStats.users.total,
          monthlyStats.users.active,
          monthlyStats.users.new,
          monthlyStats.books.total,
          monthlyStats.books.new,
          monthlyStats.loans.total,
          monthlyStats.loans.new,
          monthlyStats.loans.returned,
          monthlyStats.loans.overdue,
          monthlyStats.reviews.total,
          monthlyStats.reviews.new,
          monthlyStats.reviews.averageRating,
          monthlyStats.revenue.total,
          monthlyStats.categories.mostPopular?.name || null,
          monthlyStats.mostPopularBook?.id || null,
          monthlyStats.mostActiveUser?.id || null,
          monthlyStats.users.retentionRate || 0,
          monthlyStats.users.churnRate || 0
        ]);
        
        logger.info(`✅ Statistiques mensuelles générées pour ${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`);
      } catch (error) {
        logger.error('❌ Erreur génération statistiques mensuelles:', error);
      }
    });
  }

  // Exporter les rapports automatiques (tous les vendredis à 18h)
  static scheduleAutomaticReports() {
    cron.schedule('0 18 * * 5', async () => {
      try {
        logger.info('📋 Génération des rapports automatiques...');
        
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Rapport hebdomadaire
        const weeklyReport = await StatisticsService.generateWeeklyReport(
          lastWeek.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        // Sauvegarder le rapport
        const reportsDir = path.join(process.cwd(), 'reports', 'weekly');
        await fs.mkdir(reportsDir, { recursive: true });
        
        const filename = `weekly-report-${today.toISOString().split('T')[0]}.json`;
        const filepath = path.join(reportsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(weeklyReport, null, 2));
        
        // Enregistrer dans la base
        const reportQuery = `
          INSERT INTO generated_reports 
          (type, period_start, period_end, filename, file_path, status)
          VALUES ('weekly', ?, ?, ?, ?, 'completed')
        `;
        
        await db.query(reportQuery, [
          lastWeek.toISOString().split('T')[0],
          today.toISOString().split('T')[0],
          filename,
          filepath
        ]);
        
        logger.info(`✅ Rapport hebdomadaire généré: ${filename}`);
      } catch (error) {
        logger.error('❌ Erreur génération rapports automatiques:', error);
      }
    });
  }

  // Analyser les tendances de lecture (tous les dimanches à 4h)
  static scheduleReadingTrendsAnalysis() {
    cron.schedule('0 4 * * 0', async () => {
      try {
        logger.info('📈 Analyse des tendances de lecture...');
        
        // Analyser les catégories les plus populaires des 30 derniers jours
        const trendsQuery = `
          SELECT 
            b.category,
            COUNT(l.id) as loan_count,
            AVG(r.rating) as avg_rating,
            COUNT(DISTINCT l.user_id) as unique_readers
          FROM loans l
          JOIN books b ON l.book_id = b.id
          LEFT JOIN reviews r ON l.id = r.loan_id
          WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY b.category
          ORDER BY loan_count DESC
        `;
        
        const trends = await db.query(trendsQuery);
        
        // Analyser les heures de pic d'activité
        const activityQuery = `
          SELECT 
            HOUR(created_at) as hour,
            COUNT(*) as activity_count
          FROM loans
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY HOUR(created_at)
          ORDER BY activity_count DESC
        `;
        
        const activityPatterns = await db.query(activityQuery);
        
        // Analyser les durées moyennes d'emprunt
        const durationQuery = `
          SELECT 
            b.category,
            AVG(DATEDIFF(COALESCE(l.returned_at, NOW()), l.created_at)) as avg_duration_days
          FROM loans l
          JOIN books b ON l.book_id = b.id
          WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY b.category
        `;
        
        const durations = await db.query(durationQuery);
        
        // Sauvegarder l'analyse
        const analysisData = {
          analysis_date: new Date().toISOString().split('T')[0],
          category_trends: trends,
          activity_patterns: activityPatterns,
          duration_analysis: durations,
          peak_hour: activityPatterns[0]?.hour || 12,
          most_popular_category: trends[0]?.category || 'Unknown'
        };
        
        const trendsDir = path.join(process.cwd(), 'analytics', 'trends');
        await fs.mkdir(trendsDir, { recursive: true });
        
        const filename = `reading-trends-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(trendsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(analysisData, null, 2));
        
        logger.info(`✅ Analyse des tendances sauvegardée: ${filename}`);
      } catch (error) {
        logger.error('❌ Erreur analyse des tendances:', error);
      }
    });
  }

  // Calculer les KPIs de performance (tous les jours à 5h)
  static scheduleKPICalculation() {
    cron.schedule('0 5 * * *', async () => {
      try {
        logger.info('🎯 Calcul des KPIs de performance...');
        
        const today = new Date().toISOString().split('T')[0];
        
        // KPIs utilisateurs
        const userKPIs = await db.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_users_30d,
            COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_7d,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d
          FROM users
          WHERE status = 'active'
        `);
        
        // KPIs emprunts
        const loanKPIs = await db.query(`
          SELECT 
            COUNT(*) as total_loans,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
            COUNT(CASE WHEN status = 'returned' THEN 1 END) as completed_loans,
            COUNT(CASE WHEN status = 'active' AND due_date < NOW() THEN 1 END) as overdue_loans,
            AVG(CASE WHEN returned_at IS NOT NULL 
                THEN DATEDIFF(returned_at, created_at) END) as avg_loan_duration
          FROM loans
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        
        // KPIs livres
        const bookKPIs = await db.query(`
          SELECT 
            COUNT(*) as total_books,
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available_books,
            AVG(rating) as avg_book_rating,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_books_30d
          FROM books
        `);
        
        // Calculer les taux
        const userStats = userKPIs[0];
        const loanStats = loanKPIs[0];
        const bookStats = bookKPIs[0];
        
        const kpis = {
          date: today,
          user_engagement_rate: (userStats.active_users_30d / userStats.total_users * 100).toFixed(2),
          user_retention_rate: (userStats.active_users_7d / userStats.active_users_30d * 100).toFixed(2),
          book_utilization_rate: ((userStats.total_users - bookStats.available_books) / userStats.total_users * 100).toFixed(2),
          loan_completion_rate: (loanStats.completed_loans / loanStats.total_loans * 100).toFixed(2),
          overdue_rate: (loanStats.overdue_loans / loanStats.active_loans * 100).toFixed(2),
          avg_loan_duration: parseFloat(loanStats.avg_loan_duration || 0).toFixed(1),
          customer_satisfaction: parseFloat(bookStats.avg_book_rating || 0).toFixed(2)
        };
        
        // Sauvegarder les KPIs
        const kpiQuery = `
          INSERT INTO daily_kpis 
          (date, user_engagement_rate, user_retention_rate, book_utilization_rate,
           loan_completion_rate, overdue_rate, avg_loan_duration, customer_satisfaction)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          user_engagement_rate = VALUES(user_engagement_rate),
          user_retention_rate = VALUES(user_retention_rate),
          book_utilization_rate = VALUES(book_utilization_rate),
          loan_completion_rate = VALUES(loan_completion_rate),
          overdue_rate = VALUES(overdue_rate),
          avg_loan_duration = VALUES(avg_loan_duration),
          customer_satisfaction = VALUES(customer_satisfaction)
        `;
        
        await db.query(kpiQuery, [
          today,
          kpis.user_engagement_rate,
          kpis.user_retention_rate,
          kpis.book_utilization_rate,
          kpis.loan_completion_rate,
          kpis.overdue_rate,
          kpis.avg_loan_duration,
          kpis.customer_satisfaction
        ]);
        
        logger.info(`✅ KPIs calculés pour ${today}`);
        logger.info(`📊 Engagement: ${kpis.user_engagement_rate}%, Satisfaction: ${kpis.customer_satisfaction}/5`);
      } catch (error) {
        logger.error('❌ Erreur calcul des KPIs:', error);
      }
    });
  }

  // Démarrer toutes les tâches statistiques
  static startAllStatisticsJobs() {
    logger.info('🚀 Démarrage des tâches statistiques programmées...');
    
    this.scheduleDailyStatistics();
    this.scheduleWeeklyStatistics();
    this.scheduleMonthlyStatistics();
    this.scheduleAutomaticReports();
    this.scheduleReadingTrendsAnalysis();
    this.scheduleKPICalculation();
    
    logger.info('✅ Toutes les tâches statistiques sont programmées');
  }

  // Générer un rapport personnalisé
  static async generateCustomReport(reportType, startDate, endDate, options = {}) {
    try {
      logger.info(`📋 Génération rapport personnalisé: ${reportType}`);
      
      let reportData;
      
      switch (reportType) {
        case 'user_activity':
          reportData = await StatisticsService.getUserActivityReport(startDate, endDate, options);
          break;
          
        case 'book_performance':
          reportData = await StatisticsService.getBookPerformanceReport(startDate, endDate, options);
          break;
          
        case 'financial_summary':
          reportData = await StatisticsService.getFinancialReport(startDate, endDate, options);
          break;
          
        case 'operational_efficiency':
          reportData = await StatisticsService.getOperationalReport(startDate, endDate, options);
          break;
          
        default:
          throw new Error(`Type de rapport non supporté: ${reportType}`);
      }
      
      // Sauvegarder le rapport
      const reportsDir = path.join(process.cwd(), 'reports', 'custom');
      await fs.mkdir(reportsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${reportType}-${timestamp}.json`;
      const filepath = path.join(reportsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(reportData, null, 2));
      
      // Enregistrer dans la base
      const reportQuery = `
        INSERT INTO generated_reports 
        (type, period_start, period_end, filename, file_path, status, metadata)
        VALUES (?, ?, ?, ?, ?, 'completed', ?)
      `;
      
      await db.query(reportQuery, [
        reportType,
        startDate,
        endDate,
        filename,
        filepath,
        JSON.stringify(options)
      ]);
      
      logger.info(`✅ Rapport personnalisé généré: ${filename}`);
      return { filename, filepath, data: reportData };
      
    } catch (error) {
      logger.error('❌ Erreur génération rapport personnalisé:', error);
      throw error;
    }
  }
}

module.exports = StatisticsJobs;