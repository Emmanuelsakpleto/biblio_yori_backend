// Constantes de l'application YORI

// Rôles utilisateurs
const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  LIBRARIAN: 'librarian'
};

// Statuts des emprunts
const LOAN_STATUS = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  RESERVED: 'reserved'
};

// Statuts des livres
const BOOK_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
  LOST: 'lost'
};

// Types de notifications
const NOTIFICATION_TYPES = {
  LOAN_REMINDER: 'loan_reminder',
  OVERDUE_NOTICE: 'overdue_notice',
  RESERVATION_READY: 'reservation_ready',
  BOOK_RETURNED: 'book_returned',
  ACCOUNT_CREATED: 'account_created',
  PASSWORD_RESET: 'password_reset'
};

// Durées
const DURATIONS = {
  LOAN_PERIOD_DAYS: 14,
  RESERVATION_HOLD_DAYS: 3,
  MAX_RENEWALS: 2,
  OVERDUE_GRACE_DAYS: 3
};

// Limites
const LIMITS = {
  MAX_BOOKS_PER_USER: 5,
  MAX_RESERVATIONS_PER_USER: 3,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  PASSWORD_MIN_LENGTH: 8
};

// Types de fichiers autorisés
const ALLOWED_FILE_TYPES = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif'],
  DOCUMENTS: ['pdf', 'doc', 'docx'],
  ALL: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
};

// Messages d'erreur
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Erreur de validation',
  INTERNAL_ERROR: 'Erreur interne du serveur',
  DATABASE_ERROR: 'Erreur de base de données',
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  INVALID_FILE_TYPE: 'Type de fichier non autorisé',
  EMAIL_EXISTS: 'Cet email est déjà utilisé',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  BOOK_NOT_AVAILABLE: 'Livre non disponible',
  LOAN_LIMIT_EXCEEDED: 'Limite d\'emprunts atteinte',
  ALREADY_BORROWED: 'Livre déjà emprunté par cet utilisateur'
};

// Messages de succès
const SUCCESS_MESSAGES = {
  USER_CREATED: 'Utilisateur créé avec succès',
  LOGIN_SUCCESS: 'Connexion réussie',
  BOOK_CREATED: 'Livre ajouté avec succès',
  BOOK_UPDATED: 'Livre mis à jour avec succès',
  BOOK_DELETED: 'Livre supprimé avec succès',
  LOAN_CREATED: 'Emprunt enregistré avec succès',
  BOOK_RETURNED: 'Livre retourné avec succès',
  PROFILE_UPDATED: 'Profil mis à jour avec succès'
};

// Configuration email
const EMAIL_CONFIG = {
  TEMPLATES: {
    WELCOME: 'welcome',
    LOAN_REMINDER: 'loan_reminder',
    OVERDUE_NOTICE: 'overdue_notice',
    PASSWORD_RESET: 'password_reset'
  }
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Regex patterns
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  ISBN: /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/
};

module.exports = {
  USER_ROLES,
  LOAN_STATUS,
  BOOK_STATUS,
  NOTIFICATION_TYPES,
  DURATIONS,
  LIMITS,
  ALLOWED_FILE_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  EMAIL_CONFIG,
  PAGINATION,
  REGEX_PATTERNS
};