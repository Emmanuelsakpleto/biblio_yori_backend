const nodemailer = require('nodemailer');
const { logger } = require('../utils/helpers');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }
    
    /**
     * Initialiser le transporteur email
     */
    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'localhost',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            
            // Vérifier la configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    logger.error('Configuration email invalide', { error: error.message });
                } else {
                    logger.info('Service email configuré avec succès');
                }
            });
            
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du service email', { 
                error: error.message 
            });
        }
    }
    
    /**
     * Envoyer un email
     */
    async sendEmail(to, subject, html, text = null) {
        try {
            if (!this.transporter) {
                throw new Error('Service email non configuré');
            }
            
            const mailOptions = {
                from: `"${process.env.APP_NAME || 'YORI'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to,
                subject,
                html,
                text: text || this.htmlToText(html)
            };
            
            const result = await this.transporter.sendMail(mailOptions);
            
            logger.info('Email envoyé avec succès', {
                to,
                subject,
                messageId: result.messageId
            });
            
            return result;
            
        } catch (error) {
            logger.error('Erreur lors de l\'envoi de l\'email', {
                error: error.message,
                to,
                subject
            });
            throw error;
        }
    }
    
    /**
     * Envoyer un email de bienvenue
     */
    async sendWelcomeEmail(user) {
        const subject = 'Bienvenue sur YORI !';
        const html = this.getWelcomeTemplate(user);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer un email de vérification
     */
    async sendVerificationEmail(user, verificationToken) {
        const subject = 'Vérifiez votre adresse email - YORI';
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const html = this.getVerificationTemplate(user, verificationUrl);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer un email de réinitialisation de mot de passe
     */
    async sendPasswordResetEmail(user, resetToken) {
        const subject = 'Réinitialisation de votre mot de passe - YORI';
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const html = this.getPasswordResetTemplate(user, resetUrl);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer une notification d'emprunt
     */
    async sendLoanNotification(user, book, loan) {
        const subject = 'Confirmation d\'emprunt - YORI';
        const html = this.getLoanNotificationTemplate(user, book, loan);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer un rappel d'échéance
     */
    async sendDueReminderEmail(user, book, loan, daysUntilDue) {
        const subject = `Rappel : retour de livre dans ${daysUntilDue} jour(s) - YORI`;
        const html = this.getDueReminderTemplate(user, book, loan, daysUntilDue);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer une notification de retard
     */
    async sendOverdueNotification(user, book, loan, daysOverdue) {
        const subject = `Livre en retard - ${book.title} - YORI`;
        const html = this.getOverdueTemplate(user, book, loan, daysOverdue);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer une notification de retour
     */
    async sendReturnNotification(user, book, loan) {
        const subject = 'Retour de livre confirmé - YORI';
        const html = this.getReturnNotificationTemplate(user, book, loan);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer une notification de renouvellement
     */
    async sendRenewalNotification(user, book, loan) {
        const subject = 'Renouvellement d\'emprunt confirmé - YORI';
        const html = this.getRenewalNotificationTemplate(user, book, loan);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer une notification de disponibilité de livre
     */
    async sendBookAvailableNotification(user, book) {
        const subject = `Livre disponible : ${book.title} - YORI`;
        const html = this.getBookAvailableTemplate(user, book);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Envoyer un rapport mensuel
     */
    async sendMonthlyReport(user, reportData) {
        const subject = 'Votre rapport mensuel YORI';
        const html = this.getMonthlyReportTemplate(user, reportData);
        
        return await this.sendEmail(user.email, subject, html);
    }
    
    /**
     * Template de base HTML
     */
    getBaseTemplate(title, content) {
        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px; 
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0; 
                }
                .content { 
                    background: #f8f9fa; 
                    padding: 30px; 
                    border-radius: 0 0 10px 10px; 
                }
                .button { 
                    display: inline-block; 
                    background: #667eea; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                }
                .footer { 
                    text-align: center; 
                    color: #666; 
                    font-size: 12px; 
                    margin-top: 30px; 
                }
                .book-info { 
                    background: white; 
                    padding: 20px; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                    border-left: 4px solid #667eea; 
                }
                .highlight { 
                    background: #e3f2fd; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0; 
                }
                .warning { 
                    background: #fff3cd; 
                    border: 1px solid #ffeaa7; 
                    color: #856404; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0; 
                }
                .danger { 
                    background: #f8d7da; 
                    border: 1px solid #f5c6cb; 
                    color: #721c24; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0; 
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 YORI</h1>
                <p>Votre bibliothèque numérique</p>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} YORI - Tous droits réservés</p>
                <p>Vous recevez cet email car vous êtes inscrit sur notre plateforme.</p>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * Template d'email de bienvenue
     */
    getWelcomeTemplate(user) {
        const content = `
            <h2>Bienvenue ${user.first_name} !</h2>
            <p>C'est un plaisir de vous accueillir dans notre bibliothèque. Nous espérons que vous trouverez de belles lectures et que vous profiterez pleinement de nos services.</p>
            <div class="highlight">
                <h3>Votre compte est maintenant actif.</h3>
                <p><strong>Nom :</strong> ${user.first_name} ${user.last_name}</p>
                <p><strong>Email :</strong> ${user.email}</p>
            </div>
            <p>N'hésitez pas à explorer le catalogue, emprunter des livres, et partager vos avis avec la communauté.</p>
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                    Accéder à mon espace
                </a>
            </div>
            <p>Nous restons à votre écoute pour toute question.<br/>Bonne lecture et à bientôt !</p>
        `;
        return this.getBaseTemplate('Bienvenue sur YORI', content);
    }
    
    /**
     * Template de vérification d'email
     */
    getVerificationTemplate(user, verificationUrl) {
        const content = `
            <h2>Vérification de votre adresse email</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Merci de rejoindre notre bibliothèque. Pour finaliser votre inscription, veuillez cliquer sur le bouton ci-dessous.</p>
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">
                    Vérifier mon email
                </a>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
            </p>
            <p>Ce lien est valable 24h. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.</p>
            <p>Merci et à bientôt !</p>
        `;
        return this.getBaseTemplate('Vérification de votre email', content);
    }
    
    /**
     * Template de réinitialisation de mot de passe
     */
    getPasswordResetTemplate(user, resetUrl) {
        const content = `
            <h2>Réinitialisation de mot de passe</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">
                    Réinitialiser mon mot de passe
                </a>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px;">
                ${resetUrl}
            </p>
            <p>Ce lien est valable 1h. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
            <p>Cordialement,<br/>L'équipe de la bibliothèque</p>
        `;
        return this.getBaseTemplate('Réinitialisation de mot de passe', content);
    }
    
    /**
     * Template de notification d'emprunt
     */
    getLoanNotificationTemplate(user, book, loan) {
        const dueDate = new Date(loan.due_date).toLocaleDateString('fr-FR');
        
        const content = `
            <h2>Emprunt confirmé</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Votre emprunt a bien été enregistré. Nous vous souhaitons une agréable lecture !</p>
            <div class="book-info">
                <h3>📖 Détails du livre</h3>
                <p><strong>Titre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author}</p>
                <p><strong>ISBN :</strong> ${book.isbn}</p>
            </div>
            <div class="highlight">
                <h3>📅 Informations d'emprunt</h3>
                <p><strong>Date d'emprunt :</strong> ${new Date(loan.loan_date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Date de retour prévue :</strong> ${dueDate}</p>
                <p><strong>Durée :</strong> ${loan.duration_days} jours</p>
            </div>
            <p>Pensez à rendre le livre à temps pour en faire profiter d'autres lecteurs.</p>
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/loans" class="button">
                    Voir mes emprunts
                </a>
            </div>
            <p>Merci de votre confiance.<br/>L'équipe de la bibliothèque</p>
        `;
        return this.getBaseTemplate('Emprunt confirmé', content);
    }
    
    /**
     * Template de rappel d'échéance
     */
    getDueReminderTemplate(user, book, loan, daysUntilDue) {
        const dueDate = new Date(loan.due_date).toLocaleDateString('fr-FR');
        
        const content = `
            <h2>⏰ Rappel de retour</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>La date de retour de votre livre approche. Merci de penser à le rapporter à temps.</p>
            <div class="book-info">
                <h3>📖 Livre à retourner</h3>
                <p><strong>Titre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author}</p>
            </div>
            <div class="warning">
                <h3>⚠️ Date de retour</h3>
                <p><strong>À retourner le :</strong> ${dueDate}</p>
                <p><strong>Dans :</strong> ${daysUntilDue} jour(s)</p>
            </div>
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/loans/${loan.id}" class="button">
                    Gérer mon emprunt
                </a>
            </div>
            <p>Merci de votre ponctualité !</p>
        `;
        return this.getBaseTemplate('Rappel de retour', content);
    }
    
    /**
     * Template de notification de retard
     */
    getOverdueTemplate(user, book, loan, daysOverdue) {
        const content = `
            <h2>🚨 Livre en retard</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Votre livre n'a pas encore été rendu. Merci de le rapporter dès que possible pour permettre à d'autres lecteurs d'en profiter.</p>
            <div class="book-info">
                <h3>📖 Livre en retard</h3>
                <p><strong>Titre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author}</p>
            </div>
            <div class="danger">
                <h3>🚨 Informations de retard</h3>
                <p><strong>Date d'échéance dépassée :</strong> ${new Date(loan.due_date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Nombre de jours de retard :</strong> ${daysOverdue} jour(s)</p>
            </div>
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/loans/${loan.id}" class="button">
                    Retourner le livre
                </a>
            </div>
            <p>Merci de votre compréhension et à bientôt !</p>
        `;
        return this.getBaseTemplate('Livre en retard', content);
    }
    
    /**
     * Template de notification de retour
     */
    getReturnNotificationTemplate(user, book, loan) {
        const wasLate = loan.late_days > 0;
        
        const content = `
            <h2>✅ Retour confirmé</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Le retour de votre livre a été confirmé avec succès.</p>
            
            <div class="book-info">
                <h3>📖 Livre retourné</h3>
                <p><strong>Titre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author}</p>
            </div>
            
            <div class="highlight">
                <h3>📊 Résumé de l'emprunt</h3>
                <p><strong>Date d'emprunt :</strong> ${new Date(loan.loan_date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Date de retour :</strong> ${new Date(loan.return_date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Durée totale :</strong> ${Math.ceil((new Date(loan.return_date) - new Date(loan.loan_date)) / (1000 * 60 * 60 * 24))} jours</p>
                ${wasLate ? `<p><strong>Retard :</strong> ${loan.late_days} jour(s)</p>` : ''}
            </div>
            
            ${wasLate ? 
                '<div class="warning"><p>⚠️ Ce livre a été retourné en retard. Veillez à respecter les dates d\'échéance pour vos prochains emprunts.</p></div>' :
                '<div class="highlight"><p>✅ Retour dans les délais ! Merci de votre ponctualité.</p></div>'
            }
            
            <p>Merci d'utiliser YORI ! N'hésitez pas à emprunter d'autres livres.</p>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/books" class="button">
                    Découvrir d'autres livres
                </a>
            </div>
        `;
        
        return this.getBaseTemplate('Retour confirmé', content);
    }
    
    /**
     * Template de notification de renouvellement
     */
    getRenewalNotificationTemplate(user, book, loan) {
        const newDueDate = new Date(loan.due_date).toLocaleDateString('fr-FR');
        
        const content = `
            <h2>🔄 Renouvellement confirmé</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Votre renouvellement d'emprunt a été confirmé avec succès.</p>
            
            <div class="book-info">
                <h3>📖 Livre renouvelé</h3>
                <p><strong>Titre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author}</p>
            </div>
            
            <div class="highlight">
                <h3>📅 Nouvelles dates</h3>
                <p><strong>Nouvelle date de retour :</strong> ${newDueDate}</p>
                <p><strong>Nombre de renouvellements :</strong> ${loan.renewal_count}</p>
            </div>
            
            <p>Vous pouvez continuer à profiter de votre lecture !</p>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/loans" class="button">
                    Voir mes emprunts
                </a>
            </div>
        `;
        
        return this.getBaseTemplate('Renouvellement confirmé', content);
    }
    
    /**
     * Template de disponibilité de livre
     */
    getBookAvailableTemplate(user, book) {
        const content = `
            <h2>📚 Livre disponible !</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Bonne nouvelle ! Le livre que vous attendiez est maintenant disponible.</p>
            
            <div class="book-info">
                <h3>📖 Livre disponible</h3>
                <p><strong>Titre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author}</p>
                <p><strong>ISBN :</strong> ${book.isbn}</p>
            </div>
            
            <div class="highlight">
                <p>⏰ Dépêchez-vous ! Ce livre est très demandé et peut être emprunté par quelqu'un d'autre.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/books/${book.id}" class="button">
                    Emprunter maintenant
                </a>
            </div>
        `;
        
        return this.getBaseTemplate('Livre disponible', content);
    }
    
    /**
     * Template de rapport mensuel
     */
    getMonthlyReportTemplate(user, reportData) {
        const content = `
            <h2>📊 Votre rapport mensuel</h2>
            <p>Bonjour ${user.first_name},</p>
            <p>Voici un résumé de votre activité ce mois-ci sur YORI.</p>
            
            <div class="highlight">
                <h3>📈 Statistiques du mois</h3>
                <p><strong>Livres empruntés :</strong> ${reportData.loansThisMonth}</p>
                <p><strong>Livres retournés :</strong> ${reportData.returnsThisMonth}</p>
                <p><strong>Avis rédigés :</strong> ${reportData.reviewsThisMonth}</p>
                <p><strong>Temps de lecture estimé :</strong> ${reportData.estimatedReadingTime} heures</p>
            </div>
            
            <div class="book-info">
                <h3>⭐ Vos livres préférés ce mois</h3>
                ${reportData.favoriteBooks.map(book => 
                    `<p>• ${book.title} par ${book.author} (Note: ${book.rating}/5)</p>`
                ).join('')}
            </div>
            
            <div class="highlight">
                <h3>🎯 Recommandations pour vous</h3>
                <p>Basé sur vos lectures, nous vous recommandons :</p>
                ${reportData.recommendations.map(book => 
                    `<p>• ${book.title} par ${book.author}</p>`
                ).join('')}
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                    Voir mon tableau de bord
                </a>
            </div>
        `;
        
        return this.getBaseTemplate('Rapport mensuel', content);
    }
    
    /**
     * Convertir HTML en texte simple
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }
}

module.exports = new EmailService();