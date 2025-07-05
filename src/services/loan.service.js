const db = require('../config/database');
const { logger, AppError } = require('../utils/helpers');
const { LOAN_STATUS, USER_ROLES, PAGINATION } = require('../utils/constants');

class LoanService {

    /**
     * Annuler une réservation (étudiant)
     */
    async cancelLoan(loanId, userId, role) {
        return await db.transaction(async (connection) => {
            // Récupérer l'emprunt
            const [loanRows] = await connection.execute(`
                SELECT l.*, b.title as book_title FROM loans l JOIN books b ON l.book_id = b.id WHERE l.id = ?
            `, [loanId]);
            if (loanRows.length === 0) throw new AppError('Emprunt non trouvé', 404);
            const loan = loanRows[0];
            if (loan.status !== 'pending') throw new AppError('Seules les réservations en attente peuvent être annulées', 400);
            if (role !== 'admin' && loan.user_id !== userId) throw new AppError('Vous ne pouvez annuler que vos propres réservations', 403);
            // Annuler la réservation
            await connection.execute(`UPDATE loans SET status = 'cancelled', updated_at = NOW() WHERE id = ?`, [loanId]);
            return { ...loan, status: 'cancelled' };
        });
    }

    /**
     * Refuser une réservation (admin)
     */
    async refuseLoan(loanId, adminId) {
        return await db.transaction(async (connection) => {
            // Récupérer l'emprunt
            const [loanRows] = await connection.execute(`
                SELECT l.*, b.title as book_title FROM loans l JOIN books b ON l.book_id = b.id WHERE l.id = ?
            `, [loanId]);
            if (loanRows.length === 0) throw new AppError('Emprunt non trouvé', 404);
            const loan = loanRows[0];
            if (loan.status !== 'pending') throw new AppError('Seules les réservations en attente peuvent être refusées', 400);
            // Refuser la réservation
            await connection.execute(`UPDATE loans SET status = 'refused', updated_at = NOW() WHERE id = ?`, [loanId]);
            return { ...loan, status: 'refused' };
        });
    }

    /**
     * Envoyer un rappel manuel (admin)
     */
    async sendManualReminder(loanId, adminId) {
        // On ne modifie pas l'emprunt, on retourne juste les infos pour la notification
        const [loanRows] = await db.query(`
            SELECT l.*, b.title as book_title FROM loans l JOIN books b ON l.book_id = b.id WHERE l.id = ?
        `, [loanId]);
        if (loanRows.length === 0) throw new AppError('Emprunt non trouvé', 404);
        return loanRows[0];
    }
    /**
     * Valider une réservation (admin)
     * Passe le statut de 'pending' à 'active', met à jour la dispo du livre, envoie une notification
     */
    async validateLoan(loanId, adminId) {
        return await db.transaction(async (connection) => {
            // Récupérer l'emprunt
            const [loanRows] = await connection.execute(`
                SELECT l.*, u.email, u.first_name, u.last_name, b.title as book_title, b.available_copies
                FROM loans l
                JOIN users u ON l.user_id = u.id
                JOIN books b ON l.book_id = b.id
                WHERE l.id = ?
            `, [loanId]);
            if (loanRows.length === 0) throw new AppError('Emprunt non trouvé', 404);
            const loan = loanRows[0];
            if (loan.status !== 'pending') throw new AppError('Seules les réservations en attente peuvent être validées', 400);
            if (loan.available_copies <= 0) throw new AppError('Aucune copie disponible pour ce livre', 400);

            // Mettre à jour le statut de l'emprunt et la date de début
            const today = new Date().toISOString().split('T')[0];
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14); // 14 jours par défaut
            const dueDateStr = dueDate.toISOString().split('T')[0];

            await connection.execute(`
                UPDATE loans SET status = 'active', loan_date = ?, due_date = ?, updated_at = NOW() WHERE id = ?
            `, [today, dueDateStr, loanId]);

            // Décrémenter le nombre de copies disponibles
            await connection.execute(`
                UPDATE books SET available_copies = available_copies - 1 WHERE id = ?
            `, [loan.book_id]);

            // Notification à l'étudiant
            const NotificationService = require('./notification.service');
            await NotificationService.create({
                user_id: loan.user_id,
                type: 'loan_validated',
                title: `Réservation validée : ${loan.book_title}`,
                message: `Votre réservation pour le livre "${loan.book_title}" a été validée. Vous pouvez venir le récupérer.`,
                priority: 'normal',
                related_entity_type: 'loan',
                related_entity_id: loanId
            });
            // Notification à l'admin
            const [adminRows] = await connection.execute(`SELECT id, email, first_name, last_name FROM users WHERE role = 'admin'`);
            for (const admin of adminRows) {
                await NotificationService.create({
                    user_id: admin.id,
                    type: 'loan_validated_admin',
                    title: `Emprunt validé pour ${loan.first_name} ${loan.last_name}`,
                    message: `L'emprunt du livre "${loan.book_title}" par ${loan.first_name} ${loan.last_name} a été validé.`,
                    priority: 'normal',
                    related_entity_type: 'loan',
                    related_entity_id: loanId
                });
            }

            return { ...loan, status: 'active', loan_date: today, due_date: dueDateStr };
        });
    }
    /**
     * Créer un nouvel emprunt
     */
    async createLoan({ user_id, book_id, notes = null, duration_days = 14 }) {
        logger.info('Creating loan with parameters:', { user_id, book_id, notes, duration_days });
        
        return await db.transaction(async (connection) => {
            // Vérifier la disponibilité du livre
            const [bookRows] = await connection.execute(`
                SELECT 
                    id, 
                    title, 
                    author,
                    total_copies,
                    available_copies
                FROM books 
                WHERE id = ? AND status != 'deleted'
            `, [book_id]);
            
            if (bookRows.length === 0) {
                throw new Error('Livre non trouvé ou non disponible');
            }
            
            const book = bookRows[0];
            
            if (book.available_copies <= 0) {
                throw new Error('Aucune copie disponible pour ce livre');
            }
            
            // Vérifier les emprunts actifs de l'utilisateur
            const [userActiveLoansRows] = await connection.execute(`
                SELECT COUNT(*) as count
                FROM loans 
                WHERE user_id = ? AND status IN ('active', 'overdue')
            `, [user_id]);
            
            const maxLoansAllowed = 5; // Limite configurable
            if (parseInt(userActiveLoansRows[0].count) >= maxLoansAllowed) {
                throw new Error(`Limite d'emprunts atteinte (${maxLoansAllowed} max)`);
            }
            
            // Vérifier si l'utilisateur a déjà emprunté ce livre
            const [existingLoanRows] = await connection.execute(`
                SELECT id FROM loans 
                WHERE user_id = ? AND book_id = ? AND status IN ('active', 'overdue')
            `, [user_id, book_id]);
            
            if (existingLoanRows.length > 0) {
                throw new Error('Vous avez déjà emprunté ce livre');
            }
            
            // Calculer les dates
            const loanDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + duration_days);
            const dueDateStr = dueDate.toISOString().split('T')[0];
            
            // Créer l'emprunt
            const [loanResult] = await connection.execute(`
                INSERT INTO loans (
                    user_id, book_id, loan_date, due_date, status, 
                    notes, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())
            `, [user_id, book_id, loanDate, dueDateStr, notes || null]);
            
            // NE PAS décrémenter ici : la décrémentation se fait lors de la validation de l'emprunt (validateLoan)
            
            // Récupérer l'emprunt créé avec les détails du livre
            const [createdLoanRows] = await connection.execute(`
                SELECT 
                    l.id,
                    l.user_id,
                    l.book_id,
                    l.loan_date,
                    l.due_date,
                    l.return_date,
                    l.extension_count,
                    l.status,
                    l.notes,
                    l.fine_amount,
                    l.created_at,
                    l.updated_at,
                    b.title as book_title,
                    b.author as book_author,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM loans l
                JOIN books b ON l.book_id = b.id
                JOIN users u ON l.user_id = u.id
                WHERE l.id = ?
            `, [loanResult.insertId]);
            
            const createdLoan = createdLoanRows[0];
            
            logger.info('Emprunt créé avec succès', {
                loanId: createdLoan.id,
                user_id,
                book_id,
                dueDate: dueDateStr
            });
            
            return createdLoan;
        });
    }
    
    /**
     * Retourner un livre emprunté
     */
    async returnBook(loanId, options = {}) {
        return await db.transaction(async (connection) => {
            const { condition = 'good', notes = null, returned_by } = options;
            
            // Récupérer l'emprunt avec les détails du livre
            const [loanRows] = await connection.execute(`
                SELECT 
                    l.*,
                    b.title as book_title,
                    b.author as book_author
                FROM loans l
                JOIN books b ON l.book_id = b.id
                WHERE l.id = ?
            `, [loanId]);
            
            if (loanRows.length === 0) {
                throw new Error('Emprunt non trouvé');
            }
            
            const loan = loanRows[0];
            
            if (loan.status === 'returned') {
                throw new Error('Ce livre a déjà été retourné');
            }
            
            const returnDate = new Date().toISOString().split('T')[0];
            const isLate = new Date(returnDate) > new Date(loan.due_date);
            const lateDays = isLate 
                ? Math.ceil((new Date(returnDate) - new Date(loan.due_date)) / (1000 * 60 * 60 * 24))
                : 0;
            
            // Mettre à jour l'emprunt
            await connection.execute(`
                UPDATE loans 
                SET 
                    return_date = ?,
                    status = 'returned',
                    notes = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [returnDate, notes, loanId]);
            
            // Incrémenter les copies disponibles du livre
            await connection.execute(`
                UPDATE books 
                SET available_copies = available_copies + 1
                WHERE id = ?
            `, [loan.book_id]);
            
            logger.info('Livre retourné avec succès', {
                loanId,
                userId: loan.user_id,
                isLate,
                lateDays,
                returnedBy: returned_by
            });
            
            return {
                ...loan,
                return_date: returnDate,
                status: 'returned',
                is_late: isLate,
                late_days: lateDays
            };
        });
    }
    
    /**
     * Renouveler un emprunt
     */
    async renewLoan(loanId, requestingUserId, extensionDays = 7, isAdmin = false) {
        try {
            // Construire la requête en fonction du rôle
            let query, params;
            if (isAdmin) {
                // Admin peut renouveler n'importe quel emprunt
                query = `
                    SELECT l.*, b.title as book_title
                    FROM loans l
                    JOIN books b ON l.book_id = b.id
                    WHERE l.id = ?
                `;
                params = [loanId];
            } else {
                // Utilisateur normal ne peut renouveler que ses propres emprunts
                query = `
                    SELECT l.*, b.title as book_title
                    FROM loans l
                    JOIN books b ON l.book_id = b.id
                    WHERE l.id = ? AND l.user_id = ?
                `;
                params = [loanId, requestingUserId];
            }
            
            const [loan] = await db.query(query, params);
            
            if (!loan) {
                throw new Error('Emprunt non trouvé');
            }
            
            if (loan.status !== 'active' && loan.status !== 'overdue') {
                throw new Error('Seuls les emprunts actifs ou en retard peuvent être renouvelés');
            }
            
            if (loan.renewal_count >= 2) {
                throw new Error('Limite de renouvellements atteinte (2 max)');
            }
            
            // Calculer la nouvelle date d'échéance
            const newDueDate = new Date(loan.due_date);
            newDueDate.setDate(newDueDate.getDate() + extensionDays);
            
            // Mettre à jour l'emprunt
            await db.query(`
                UPDATE loans 
                SET due_date = ?, 
                    extension_count = extension_count + 1,
                    status = 'active',
                    updated_at = NOW()
                WHERE id = ?
            `, [newDueDate, loanId]);
            
            // Récupérer l'emprunt mis à jour
            const [updatedLoan] = await db.query(`
                SELECT l.*, b.title as book_title, b.author,
                       u.first_name, u.last_name, u.email
                FROM loans l
                JOIN books b ON l.book_id = b.id
                JOIN users u ON l.user_id = u.id
                WHERE l.id = ?
            `, [loanId]);
            
            return updatedLoan;
        } catch (error) {
            console.error('Erreur renouvellement emprunt:', error);
            throw new AppError('Erreur lors du renouvellement de l\'emprunt: ' + error.message, 500);
        }
    }
    
    /**
     * Obtenir les emprunts d'un utilisateur
     */
    async getUserLoans(userId, options = {}) {
        try {
            const {
                status = null,
                page = 1,
                limit = 20,
                sortBy = 'loan_date',
                sortOrder = 'DESC'
            } = options;
            
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE l.user_id = ?';
            const params = [userId];
            
            if (status) {
                whereClause += ' AND l.status = ?';
                params.push(status);
            }
            
            const query = `
                SELECT 
                    l.*,
                    b.title,
                    b.author,
                    b.isbn,
                    b.cover_image,
                    CASE 
                        WHEN l.status = 'active' AND l.due_date < CURDATE() THEN 'overdue'
                        ELSE l.status
                    END as current_status,
                    CASE 
                        WHEN l.due_date < CURDATE() AND l.status = 'active' 
                        THEN DATEDIFF(CURDATE(), l.due_date)
                        ELSE 0
                    END as days_overdue
                FROM loans l
                JOIN books b ON l.book_id = b.id
                ${whereClause}
                ORDER BY l.loan_date ${sortOrder}
                LIMIT ${limit} OFFSET ${offset}
            `;
            
            params.push(limit, offset);
            
            const result = await db.query(query, params.slice(0, -2));
            
            // Compter le total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM loans l
                ${whereClause}
            `;
            
            const countResult = await db.query(countQuery, params.slice(0, -2));
            const total = parseInt(countResult[0].total);
            
            return {
                loans: result,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
            
        } catch (error) {
            logger.error('Erreur lors de la récupération des emprunts utilisateur', { 
                error: error.message, 
                userId 
            });
            throw error;
        }
    }
    
    /**
     * Obtenir tous les emprunts (admin)
     */
    async getAllLoans(options = {}) {
        try {
            const {
                status = null,
                user_id = null,
                book_id = null,
                overdue_only = false
            } = options;
            
            // Construction des paramètres de filtrage
            const params = [];
            let whereClause = '';
            const whereConditions = [];
            
            // Filtre par statut
            if (status && status.trim() !== '') {
                whereConditions.push('l.status = ?');
                params.push(status.trim());
            }
            
            // Filtre par utilisateur
            if (user_id && !isNaN(parseInt(user_id))) {
                whereConditions.push('l.user_id = ?');
                params.push(parseInt(user_id));
            }
            
            // Filtre par livre
            if (book_id && !isNaN(parseInt(book_id))) {
                whereConditions.push('l.book_id = ?');
                params.push(parseInt(book_id));
            }
            
            // Filtre pour emprunts en retard
            if (overdue_only === true || overdue_only === 'true') {
                whereConditions.push('l.due_date < CURDATE() AND l.status = ?');
                params.push('active');
            }
            
            // Construction de la clause WHERE
            if (whereConditions.length > 0) {
                whereClause = ' WHERE ' + whereConditions.join(' AND ');
            }
            
            // Requête principale avec filtres
            const query = `
                SELECT 
                    l.id,
                    l.user_id,
                    l.book_id,
                    l.loan_date,
                    l.due_date,
                    l.return_date,
                    l.status,
                    u.email,
                    u.first_name,
                    u.last_name,
                    b.title,
                    b.author
                FROM loans l
                INNER JOIN users u ON l.user_id = u.id
                INNER JOIN books b ON l.book_id = b.id${whereClause}
                ORDER BY l.loan_date DESC
                LIMIT 20`;
            
            const result = await db.query(query, params);
            
            // Comptage avec les mêmes filtres
            const countQuery = `
                SELECT COUNT(*) as total
                FROM loans l
                INNER JOIN users u ON l.user_id = u.id
                INNER JOIN books b ON l.book_id = b.id${whereClause}`;
            
            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult[0]?.total || 0);
            
            return {
                loans: result,
                pagination: {
                    page: 1,
                    limit: 20,
                    total,
                    totalPages: Math.ceil(total / 20)
                }
            };
            
        } catch (error) {
            logger.error('Erreur lors de la récupération de tous les emprunts', { 
                error: error.message,
                stack: error.stack 
            });
            throw error;
        }
    }
    
    /**
     * Obtenir un emprunt par ID
     */
    async getLoanById(loanId, userId = null) {
        try {
            let query = `
                SELECT 
                    l.*,
                    u.email,
                    u.first_name,
                    u.last_name,
                    b.title,
                    b.author,
                    b.isbn,
                    b.cover_image,
                    b.total_copies,
                    CASE 
                        WHEN l.status = 'active' AND l.due_date < CURDATE() THEN 'overdue'
                        ELSE l.status
                    END as current_status,
                    CASE 
                        WHEN l.due_date < CURDATE() AND l.status = 'active' 
                        THEN DATEDIFF(CURDATE(), l.due_date)
                        ELSE 0
                    END as days_overdue
                FROM loans l
                JOIN users u ON l.user_id = u.id
                JOIN books b ON l.book_id = b.id
                WHERE l.id = ?
            `;
            
            const params = [loanId];
            
            if (userId) {
                query += ' AND l.user_id = ?';
                params.push(userId);
            }
            
            const result = await db.query(query, params);
            
            if (result.length === 0) {
                return null;
            }
            
            return result[0];
            
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'emprunt', { 
                error: error.message, 
                loanId, 
                userId 
            });
            throw error;
        }
    }
    
    /**
     * Mettre à jour les emprunts en retard
     */
    async updateOverdueLoans() {
        try {
            const result = await db.query(`
                UPDATE loans 
                SET status = ?, updated_at = NOW()
                WHERE status = ? AND due_date < CURDATE()
            `, ['overdue', 'active']);
            
            logger.info('Emprunts en retard mis à jour', { 
                count: result.affectedRows || 0
            });
            
            return result;
            
        } catch (error) {
            logger.error('Erreur lors de la mise à jour des emprunts en retard', { 
                error: error.message 
            });
            throw error;
        }
    }
    
    /**
     * Obtenir les statistiques des emprunts
     */
    async getLoanStatistics(userId = null) {
        try {
            let baseQuery = '';
            let params = [];
            
            if (userId) {
                baseQuery = 'WHERE user_id = ?';
                params = [userId];
            }
            
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_loans,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
                    COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_loans,
                    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_loans,
                    COUNT(CASE WHEN late_days > 0 THEN 1 END) as late_returns,
                    AVG(CASE WHEN status = 'returned' 
                        THEN DATEDIFF(return_date, loan_date) 
                    END) as avg_loan_duration,
                    AVG(CASE WHEN late_days > 0 THEN late_days END) as avg_late_days
                FROM loans
                ${baseQuery}
            `;
            
            const result = await db.query(statsQuery, params);
            const stats = result[0];
            
            // Statistiques par mois (derniers 12 mois)
            const monthlyQuery = `
                SELECT 
                    DATE_FORMAT(loan_date, '%Y-%m') as month,
                    COUNT(*) as loans_count,
                    COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_count
                FROM loans
                ${baseQuery ? baseQuery + ' AND' : 'WHERE'} 
                    loan_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(loan_date, '%Y-%m')
                ORDER BY month DESC
            `;
            
            const monthlyResult = await db.query(monthlyQuery, params);
            
            return {
                overview: {
                    totalLoans: parseInt(stats.total_loans),
                    activeLoans: parseInt(stats.active_loans),
                    returnedLoans: parseInt(stats.returned_loans),
                    overdueLoans: parseInt(stats.overdue_loans),
                    lateReturns: parseInt(stats.late_returns),
                    avgLoanDuration: parseFloat(stats.avg_loan_duration) || 0,
                    avgLateDays: parseFloat(stats.avg_late_days) || 0
                },
                monthlyTrends: monthlyResult.map(row => ({
                    month: row.month,
                    loansCount: parseInt(row.loans_count),
                    returnedCount: parseInt(row.returned_count)
                }))
            };
            
        } catch (error) {
            logger.error('Erreur lors de la récupération des statistiques', { 
                error: error.message, 
                userId 
            });
            throw error;
        }
    }
    
    /**
     * Obtenir les livres les plus empruntés
     */
    async getMostBorrowedBooks(limit = 10) {
        try {
            const query = `
                SELECT 
                    b.id,
                    b.title,
                    b.author,
                    b.isbn,
                    b.cover_image,
                    COUNT(l.id) as loan_count,
                    COUNT(CASE WHEN l.status = 'active' THEN 1 END) as current_loans
                FROM books b
                LEFT JOIN loans l ON b.id = l.book_id
                GROUP BY b.id, b.title, b.author, b.isbn, b.cover_image
                ORDER BY loan_count DESC, current_loans DESC
                LIMIT ?
            `;
            
            const result = await db.query(query, [limit]);
            
            return result.map(row => ({
                ...row,
                loan_count: parseInt(row.loan_count),
                current_loans: parseInt(row.current_loans)
            }));
            
        } catch (error) {
            logger.error('Erreur lors de la récupération des livres les plus empruntés', { 
                error: error.message 
            });
            throw error;
        }
    }
    
    /**
     * Obtenir les emprunts en retard
     */
    async getOverdueLoans(filters = {}, pagination = {}) {
        try {
            const {
                days_overdue = null,
                user_id = null
            } = filters;
            
            const {
                page = 1,
                limit = 20
            } = pagination;
            
            const offset = (page - 1) * limit;
            const params = [];
            let whereConditions = ['l.due_date < CURDATE()', 'l.status = "active"'];
            
            if (days_overdue && days_overdue > 0) {
                whereConditions.push('DATEDIFF(CURDATE(), l.due_date) >= ?');
                params.push(days_overdue);
            }
            
            if (user_id) {
                whereConditions.push('l.user_id = ?');
                params.push(user_id);
            }
            
            const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
            
            const query = `
                SELECT 
                    l.*,
                    u.email,
                    u.first_name,
                    u.last_name,
                    b.title,
                    b.author,
                    b.isbn,
                    b.cover_image,
                    'overdue' as current_status,
                    DATEDIFF(CURDATE(), l.due_date) as days_overdue
                FROM loans l
                JOIN users u ON l.user_id = u.id
                JOIN books b ON l.book_id = b.id
                ${whereClause}
                ORDER BY l.due_date ASC
                LIMIT ? OFFSET ?
            `;
            
            params.push(limit, offset);
            
            const result = await db.query(query, params);
            
            // Compter le total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM loans l
                JOIN users u ON l.user_id = u.id
                JOIN books b ON l.book_id = b.id
                ${whereClause}
            `;
            
            const countResult = await db.query(countQuery, params.slice(0, -2));
            const total = parseInt(countResult[0].total);
            
            return {
                loans: result,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
            
        } catch (error) {
            logger.error('Erreur lors de la récupération des emprunts en retard', { 
                error: error.message 
            });
            throw error;
        }
    }
}

module.exports = new LoanService();