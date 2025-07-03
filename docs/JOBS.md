# 🕐 LECTURA - Système de Tâches Programmées (CRON Jobs)

## Vue d'ensemble

Le système LECTURA dispose d'un système complet de tâches programmées (CRON jobs) qui automatise la maintenance, les notifications et la génération de statistiques. Ce système garantit le bon fonctionnement de la plateforme 24/7.

## 🧹 Tâches de Nettoyage (Cleanup Jobs)

### CleanupJobs.js

Gère le nettoyage automatique des données obsolètes et l'optimisation système.

#### Planification des tâches

| Tâche | Planification | Description |
|-------|---------------|-------------|
| **Nettoyage Notifications** | Tous les jours à 2h | Supprime les notifications de plus de 30 jours |
| **Nettoyage Sessions** | Toutes les 6h | Supprime les sessions expirées |
| **Nettoyage Tokens** | Tous les jours à 3h | Supprime les refresh/reset/verification tokens expirés |
| **Nettoyage Fichiers** | Tous les jours à 4h | Supprime les fichiers temporaires de plus de 24h |
| **Nettoyage Logs** | Dimanches à 5h | Supprime les logs de plus de 90 jours |
| **Nettoyage Audit** | 1er du mois à 6h | Supprime les données d'audit de plus d'1 an |
| **Optimisation DB** | Dimanches à 6h | Optimise les tables de la base de données |
| **Analyse Tables** | Tous les jours à 7h | Analyse les statistiques des tables |

#### Méthodes principales

```javascript
// Démarrer toutes les tâches de nettoyage
CleanupJobs.startAllCleanupJobs();

// Exécuter un nettoyage manuel
const result = await CleanupJobs.runManualCleanup({
  notifications: true,
  sessions: true,
  tokens: true,
  files: true,
  logs: false,
  audit: false,
  optimize: false
});
```

#### Configuration

```javascript
// Options de nettoyage manuel
const cleanupOptions = {
  notifications: boolean,  // Nettoyer les anciennes notifications
  sessions: boolean,       // Nettoyer les sessions expirées
  tokens: boolean,         // Nettoyer les tokens expirés
  files: boolean,          // Nettoyer les fichiers temporaires
  logs: boolean,           // Nettoyer les anciens logs
  audit: boolean,          // Nettoyer les données d'audit
  optimize: boolean        // Optimiser la base de données
};
```

## 📧 Tâches de Notification (Notification Jobs)

### NotificationJobs.js

Gère l'envoi automatique de notifications et d'emails aux utilisateurs.

#### Planification des tâches

| Tâche | Planification | Description |
|-------|---------------|-------------|
| **Rappels d'Échéance** | Tous les jours à 9h | Rappelle les livres à retourner dans 3 jours |
| **Notifications Retard** | Tous les jours à 10h | Notifie les emprunts en retard |
| **Nouvelles Sorties** | Lundis à 11h | Annonce les nouveaux livres de la semaine |
| **Recommandations** | Vendredis à 14h | Envoie des recommandations personnalisées |
| **Résumé Mensuel** | 1er du mois à 12h | Envoie le résumé d'activité mensuel |
| **Rappels Non Lus** | Tous les jours à 23h | Rappelle les notifications non lues |

#### Méthodes principales

```javascript
// Démarrer toutes les tâches de notification
NotificationJobs.startAllNotificationJobs();

// Envoyer une notification immédiate
const users = [
  { id: 1, email: 'user@example.com', first_name: 'John', last_name: 'Doe' }
];

const data = {
  title: 'Maintenance Système',
  message: 'Le système sera en maintenance ce soir de 22h à 2h.',
  metadata: { 
    startTime: '2024-01-15T22:00:00Z',
    endTime: '2024-01-16T02:00:00Z'
  }
};

const results = await NotificationJobs.sendImmediateNotification(
  'system_maintenance',
  users,
  data
);
```

#### Types de notifications immédiates

```javascript
// Maintenance système
await NotificationJobs.sendImmediateNotification('system_maintenance', users, {
  message: 'Maintenance programmée...',
  startTime: '2024-01-15T22:00:00Z',
  endTime: '2024-01-16T02:00:00Z'
});

// Annonce urgente
await NotificationJobs.sendImmediateNotification('urgent_announcement', users, {
  title: 'Nouvelle importante',
  message: 'Message urgent...',
  metadata: { priority: 'high' }
});
```

## 📊 Tâches Statistiques (Statistics Jobs)

### StatisticsJobs.js

Génère automatiquement les statistiques et rapports du système.

#### Planification des tâches

| Tâche | Planification | Description |
|-------|---------------|-------------|
| **Statistiques Quotidiennes** | Tous les jours à 1h | Génère les stats du jour précédent |
| **Statistiques Hebdomadaires** | Lundis à 2h | Génère les stats de la semaine écoulée |
| **Statistiques Mensuelles** | 1er du mois à 3h | Génère les stats du mois écoulé |
| **Rapports Automatiques** | Vendredis à 18h | Exporte les rapports hebdomadaires |
| **Analyse des Tendances** | Dimanches à 4h | Analyse les tendances de lecture |
| **Calcul des KPIs** | Tous les jours à 5h | Calcule les indicateurs de performance |

#### Méthodes principales

```javascript
// Démarrer toutes les tâches statistiques
StatisticsJobs.startAllStatisticsJobs();

// Générer un rapport personnalisé
const report = await StatisticsJobs.generateCustomReport(
  'user_activity',
  '2024-01-01',
  '2024-01-31',
  {
    includeCategories: ['Fiction', 'Science'],
    format: 'json',
    details: 'full'
  }
);
```

#### Types de rapports personnalisés

```javascript
// Rapport d'activité utilisateur
await StatisticsJobs.generateCustomReport('user_activity', startDate, endDate, {
  includeInactive: false,
  groupBy: 'category'
});

// Rapport de performance des livres
await StatisticsJobs.generateCustomReport('book_performance', startDate, endDate, {
  sortBy: 'popularity',
  includeRatings: true
});

// Rapport financier
await StatisticsJobs.generateCustomReport('financial_summary', startDate, endDate, {
  includePenalties: true,
  currency: 'EUR'
});

// Rapport d'efficacité opérationnelle
await StatisticsJobs.generateCustomReport('operational_efficiency', startDate, endDate, {
  includeMetrics: ['return_rate', 'overdue_rate', 'user_satisfaction']
});
```

## 🚀 Intégration et Configuration

### Configuration d'environnement

```env
# Variables d'environnement pour les jobs
NODE_ENV=production              # Active les jobs en production uniquement
ENABLE_CRON_JOBS=true           # Active/désactive les jobs
CLEANUP_RETENTION_DAYS=90       # Rétention des logs (jours)
NOTIFICATION_BATCH_SIZE=100     # Taille des lots pour notifications
STATS_RETENTION_MONTHS=12       # Rétention des statistiques (mois)
```

### Démarrage automatique

Les tâches sont automatiquement démarrées en mode production :

```javascript
// Dans app.js
if (process.env.NODE_ENV === 'production') {
  logger.info('🚀 Démarrage des tâches programmées...');
  
  CleanupJobs.startAllCleanupJobs();
  NotificationJobs.startAllNotificationJobs();
  StatisticsJobs.startAllStatisticsJobs();
  
  logger.info('✅ Toutes les tâches programmées sont démarrées');
}
```

### Surveillance et logs

Tous les jobs génèrent des logs détaillés :

```javascript
// Exemples de logs
logger.info('📊 Génération des statistiques quotidiennes...');
logger.info('✅ Statistiques quotidiennes générées pour 2024-01-15');
logger.error('❌ Erreur génération statistiques:', error);
```

## 🛡️ Sécurité et Gestion d'Erreurs

### Gestion des erreurs

- Chaque job capture et log ses erreurs sans interrompre les autres
- Les erreurs sont tracées avec contexte complet
- Système de retry automatique pour les opérations critiques

### Prévention des conflits

- Horaires échelonnés pour éviter la surcharge
- Vérifications avant exécution
- Mécanismes de verrouillage pour les opérations critiques

### Monitoring

```javascript
// Vérification de l'état des jobs
GET /health          // État général du système
GET /metrics         // Métriques de performance

// Les jobs exposent leurs métriques dans les logs :
// - Nombre d'éléments traités
// - Temps d'exécution
// - Taux de succès/échec
```

## 📈 KPIs et Métriques

### Indicateurs calculés quotidiennement

- **Taux d'engagement utilisateur** : % d'utilisateurs actifs sur 30 jours
- **Taux de rétention** : % d'utilisateurs actifs sur 7 jours / 30 jours
- **Taux d'utilisation des livres** : % de livres empruntés
- **Taux de completion des emprunts** : % d'emprunts retournés à temps
- **Taux de retard** : % d'emprunts en retard
- **Durée moyenne d'emprunt** : Jours moyens de possession
- **Satisfaction client** : Note moyenne des évaluations

### Rapports générés

- **Quotidiens** : Activité du jour, nouveaux utilisateurs, emprunts
- **Hebdomadaires** : Tendances, livres populaires, utilisateurs actifs
- **Mensuels** : Croissance, rétention, analyse des catégories
- **Personnalisés** : Sur demande avec paramètres spécifiques

## 🔧 Maintenance et Administration

### Commandes utiles

```bash
# Exécuter un nettoyage manuel
npm run cleanup

# Générer des statistiques à la demande
npm run stats:generate

# Vérifier l'état des jobs
npm run jobs:status

# Redémarrer tous les jobs
npm run jobs:restart
```

### API d'administration

Les administrateurs peuvent contrôler les jobs via l'API :

```javascript
// Endpoints d'administration (authentification admin requise)
POST /api/admin/jobs/cleanup        // Nettoyage manuel
POST /api/admin/jobs/notify         // Notification immédiate
POST /api/admin/jobs/stats          // Génération de stats
GET  /api/admin/jobs/status         // État des jobs
```

Ce système de jobs garantit une maintenance automatique optimale de la plateforme LECTURA et une expérience utilisateur enrichie par des notifications pertinentes et des analyses approfondies.
