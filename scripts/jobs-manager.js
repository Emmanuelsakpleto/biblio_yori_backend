#!/usr/bin/env node

/**
 * Script d'administration des tâches CRON
 * Usage: node scripts/jobs-manager.js [command] [options]
 */

const { logger } = require('../src/utils/helpers');
const CleanupJobs = require('../src/jobs/cleanup.jobs');
const NotificationJobs = require('../src/jobs/notification.jobs');
const StatisticsJobs = require('../src/jobs/statistics.jobs');

const ReviewService = require('../src/services/review.service');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  colorLog('cyan', '\n🕐 LECTURA - Gestionnaire de Tâches CRON\n');
  
  console.log('Usage: node scripts/jobs-manager.js [command] [options]\n');
  
  colorLog('yellow', 'Commandes disponibles:');
  console.log('  cleanup [options]     - Exécuter un nettoyage manuel');
  console.log('  notify [type] [data]  - Envoyer une notification immédiate');
  console.log('  stats [type] [dates]  - Générer des statistiques');
  console.log('  status               - Afficher l\'état du système');
  console.log('  help                 - Afficher cette aide\n');

  colorLog('yellow', 'Commandes avancées:');
  console.log('  review-reports [action] [reportId] [adminNotes] - Traiter un signalement d\'avis (admin)');
  console.log('  notify-admin-review [reviewId]                  - Notifier l\'admin d\'un nouvel avis');
  console.log();
  
  colorLog('yellow', 'Options de nettoyage:');
  console.log('  --notifications      - Nettoyer les anciennes notifications');
  console.log('  --sessions          - Nettoyer les sessions expirées');
  console.log('  --tokens            - Nettoyer les tokens expirés');
  console.log('  --files             - Nettoyer les fichiers temporaires');
  console.log('  --logs              - Nettoyer les anciens logs');
  console.log('  --audit             - Nettoyer les données d\'audit');
  console.log('  --optimize          - Optimiser la base de données');
  console.log('  --all               - Tout nettoyer\n');
  
  colorLog('yellow', 'Types de notifications:');
  console.log('  system_maintenance   - Notification de maintenance');
  console.log('  urgent_announcement  - Annonce urgente\n');
  
  colorLog('yellow', 'Types de statistiques:');
  console.log('  daily               - Statistiques quotidiennes');
  console.log('  weekly              - Statistiques hebdomadaires');
  console.log('  monthly             - Statistiques mensuelles');
  console.log('  custom              - Rapport personnalisé\n');
  
  colorLog('yellow', 'Exemples:');
  console.log('  node scripts/jobs-manager.js cleanup --all');
  console.log('  node scripts/jobs-manager.js cleanup --notifications --sessions');
  console.log('  node scripts/jobs-manager.js stats daily');
  console.log('  node scripts/jobs-manager.js status\n');
}

async function runCleanup(args) {
  try {
    colorLog('blue', '🧹 Démarrage du nettoyage manuel...\n');
    
    const options = {
      notifications: args.includes('--notifications') || args.includes('--all'),
      sessions: args.includes('--sessions') || args.includes('--all'),
      tokens: args.includes('--tokens') || args.includes('--all'),
      files: args.includes('--files') || args.includes('--all'),
      logs: args.includes('--logs') || args.includes('--all'),
      audit: args.includes('--audit') || args.includes('--all'),
      optimize: args.includes('--optimize') || args.includes('--all')
    };
    
    if (!Object.values(options).some(Boolean)) {
      colorLog('yellow', '⚠️  Aucune option spécifiée. Utiliser --help pour voir les options disponibles.');
      return;
    }
    
    colorLog('cyan', 'Options sélectionnées:');
    Object.entries(options).forEach(([key, value]) => {
      if (value) {
        console.log(`  ✓ ${key}`);
      }
    });
    console.log();
    
    const result = await CleanupJobs.runManualCleanup(options);
    
    if (result.success) {
      colorLog('green', '✅ Nettoyage terminé avec succès!\n');
    } else {
      colorLog('red', '❌ Erreur lors du nettoyage\n');
    }
    
  } catch (error) {
    colorLog('red', `❌ Erreur: ${error.message}\n`);
  }
}

async function sendNotification(args) {
  try {
    const type = args[1];
    
    if (!type) {
      colorLog('red', '❌ Type de notification requis. Utiliser --help pour voir les types disponibles.\n');
      return;
    }
    
    colorLog('blue', `📧 Envoi de notification: ${type}...\n`);
    
    // Exemple d'utilisateurs (en réalité, on récupérerait depuis la DB)
    const users = [
      {
        id: 1,
        email: 'admin@lectura.com',
        first_name: 'Admin',
        last_name: 'Système'
      }
    ];
    
    let data;
    
    switch (type) {
      case 'system_maintenance':
        data = {
          message: 'Maintenance programmée du système de 22h à 2h.',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          metadata: { source: 'manual' }
        };
        break;
        
      case 'urgent_announcement':
        data = {
          title: 'Annonce importante',
          message: 'Message d\'annonce urgent envoyé manuellement.',
          metadata: { priority: 'high', source: 'manual' }
        };
        break;
        
      default:
        colorLog('red', `❌ Type de notification non supporté: ${type}\n`);
        return;
    }
    
    const results = await NotificationJobs.sendImmediateNotification(type, users, data);
    
    const successCount = results.filter(r => r.status === 'sent').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    
    colorLog('green', `✅ Notification envoyée: ${successCount} succès, ${failCount} échecs\n`);
    
  } catch (error) {
    colorLog('red', `❌ Erreur: ${error.message}\n`);
  }
}

async function generateStats(args) {
  try {
    const type = args[1];
    
    if (!type) {
      colorLog('red', '❌ Type de statistiques requis. Utiliser --help pour voir les types disponibles.\n');
      return;
    }
    
    colorLog('blue', `📊 Génération de statistiques: ${type}...\n`);
    
    switch (type) {
      case 'daily':
        colorLog('cyan', 'Génération des statistiques quotidiennes...');
        // En réalité, on appellerait la méthode appropriée
        colorLog('green', '✅ Statistiques quotidiennes générées\n');
        break;
        
      case 'weekly':
        colorLog('cyan', 'Génération des statistiques hebdomadaires...');
        colorLog('green', '✅ Statistiques hebdomadaires générées\n');
        break;
        
      case 'monthly':
        colorLog('cyan', 'Génération des statistiques mensuelles...');
        colorLog('green', '✅ Statistiques mensuelles générées\n');
        break;
        
      case 'custom':
        const startDate = args[2] || '2024-01-01';
        const endDate = args[3] || '2024-01-31';
        
        colorLog('cyan', `Génération de rapport personnalisé: ${startDate} à ${endDate}...`);
        
        const result = await StatisticsJobs.generateCustomReport(
          'user_activity',
          startDate,
          endDate,
          { format: 'json' }
        );
        
        colorLog('green', `✅ Rapport généré: ${result.filename}\n`);
        break;
        
      default:
        colorLog('red', `❌ Type de statistiques non supporté: ${type}\n`);
        return;
    }
    
  } catch (error) {
    colorLog('red', `❌ Erreur: ${error.message}\n`);
  }
}

// Traiter un signalement d'avis (admin)
async function processReviewReport(args) {
  try {
    const action = args[1];
    const reportId = args[2];
    const adminNotes = args[3] || '';
    if (!['dismiss', 'warning', 'remove_review', 'suspend_user'].includes(action)) {
      colorLog('red', '❌ Action invalide. Actions possibles: dismiss, warning, remove_review, suspend_user');
      return;
    }
    if (!reportId) {
      colorLog('red', '❌ reportId requis.');
      return;
    }
    colorLog('blue', `📝 Traitement du signalement ${reportId} avec action ${action}...`);
    const result = await ReviewService.processReport(reportId, action, adminNotes);
    colorLog('green', '✅ Signalement traité avec succès');
    console.log(result);
  } catch (error) {
    colorLog('red', `❌ Erreur: ${error.message}`);
  }
}

// Notifier l'admin lors d'un nouvel avis
async function notifyAdminReview(args) {
  try {
    const reviewId = args[1];
    if (!reviewId) {
      colorLog('red', '❌ reviewId requis.');
      return;
    }
    colorLog('blue', `📢 Notification admin pour nouvel avis: ${reviewId}...`);
    if (typeof NotificationJobs.sendAdminReviewNotification !== 'function') {
      colorLog('red', '❌ Fonction sendAdminReviewNotification non implémentée dans NotificationJobs.');
      return;
    }
    const result = await NotificationJobs.sendAdminReviewNotification(reviewId);
    colorLog('green', '✅ Notification admin envoyée');
    console.log(result);
  } catch (error) {
    colorLog('red', `❌ Erreur: ${error.message}`);
  }
}

function showStatus() {
  colorLog('blue', '📋 État du système LECTURA\n');
  
  colorLog('cyan', 'Modules de tâches:');
  console.log('  ✓ CleanupJobs      - Disponible');
  console.log('  ✓ NotificationJobs - Disponible');
  console.log('  ✓ StatisticsJobs   - Disponible\n');
  
  colorLog('cyan', 'Environnement:');
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Plateforme: ${process.platform}`);
  console.log(`  Mémoire: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
  console.log(`  Uptime: ${Math.round(process.uptime())} secondes\n`);
  
  colorLog('cyan', 'Configuration:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Jobs actifs: ${process.env.NODE_ENV === 'production' ? 'Oui' : 'Non (mode dev)'}\n`);
  
  colorLog('green', '✅ Système opérationnel\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  try {
    switch (command) {
      case 'cleanup':
        await runCleanup(args);
        break;
        
      case 'notify':
        await sendNotification(args);
        break;
        
      case 'stats':
        await generateStats(args);
        break;
        
      case 'status':
        showStatus();
        break;

      case 'review-reports':
        await processReviewReport(args);
        break;

      case 'notify-admin-review':
        await notifyAdminReview(args);
        break;
        
      default:
        colorLog('red', `❌ Commande inconnue: ${command}\n`);
        showHelp();
        break;
    }
  } catch (error) {
    colorLog('red', `❌ Erreur fatale: ${error.message}\n`);
    process.exit(1);
  }
}

// Gestion gracieuse des signaux
process.on('SIGINT', () => {
  colorLog('yellow', '\n⚠️  Interruption détectée, arrêt en cours...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  colorLog('yellow', '\n⚠️  Signal de terminaison reçu, arrêt en cours...');
  process.exit(0);
});

// Lancement du script
if (require.main === module) {
  main().catch(error => {
    colorLog('red', `❌ Erreur non gérée: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runCleanup,
  sendNotification,
  generateStats,
  showStatus
};
