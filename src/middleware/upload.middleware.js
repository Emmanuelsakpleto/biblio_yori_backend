const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateSecureFileName, logger } = require('../utils/helpers');
const { LIMITS, ALLOWED_FILE_TYPES } = require('../utils/constants');
const { validationError } = require('./error.middleware');

/**
 * Configuration de stockage pour les uploads
 */
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, `../../uploads/${destination}`);
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const secureFileName = generateSecureFileName(file.originalname);
      cb(null, secureFileName);
    }
  });
};

/**
 * Filtre de validation des fichiers
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    const mimeType = file.mimetype.toLowerCase();
    
    // Vérifier l'extension
    if (!allowedTypes.includes(fileExtension)) {
      return cb(new Error(`Type de fichier non autorisé. Extensions acceptées: ${allowedTypes.join(', ')}`), false);
    }
    
    // Vérifier le MIME type pour plus de sécurité
    const allowedMimes = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
    
    const validMimes = allowedMimes[fileExtension] || [];
    if (!validMimes.includes(mimeType)) {
      return cb(new Error('Type MIME non autorisé'), false);
    }
    
    cb(null, true);
  };
};

/**
 * Configuration d'upload pour les images de couverture de livres
 */
const bookCoverUpload = multer({
  storage: createStorage('books'),
  limits: {
    fileSize: LIMITS.MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: createFileFilter(ALLOWED_FILE_TYPES.IMAGES)
});

/**
 * Configuration d'upload pour les fichiers PDF des livres
 */
const bookPdfUpload = multer({
  storage: createStorage('books/pdf'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les PDF
    files: 1
  },
  fileFilter: createFileFilter(['pdf'])
});

/**
 * Configuration d'upload pour les images de profil
 */
const profileImageUpload = multer({
  storage: createStorage('users'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB pour les images de profil
    files: 1
  },
  fileFilter: createFileFilter(ALLOWED_FILE_TYPES.IMAGES)
});

/**
 * Configuration d'upload générique
 */
const genericUpload = multer({
  storage: createStorage('general'),
  limits: {
    fileSize: LIMITS.MAX_FILE_SIZE,
    files: 5
  },
  fileFilter: createFileFilter(ALLOWED_FILE_TYPES.ALL)
});

/**
 * Middleware d'upload avec gestion d'erreurs
 */
const handleUpload = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        let message = 'Erreur lors de l\'upload';
        
        switch (error.code) {
          case 'LIMIT_FILE_SIZE':
            message = 'Fichier trop volumineux';
            break;
          case 'LIMIT_FILE_COUNT':
            message = 'Trop de fichiers';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            message = 'Champ de fichier inattendu';
            break;
          case 'LIMIT_PART_COUNT':
            message = 'Trop de parties dans le formulaire';
            break;
          case 'LIMIT_FIELD_KEY':
            message = 'Nom de champ trop long';
            break;
          case 'LIMIT_FIELD_VALUE':
            message = 'Valeur de champ trop longue';
            break;
          case 'LIMIT_FIELD_COUNT':
            message = 'Trop de champs';
            break;
        }
        
        logger.error('Erreur Multer:', error);
        return next(validationError(message));
      } else if (error) {
        logger.error('Erreur upload:', error);
        return next(validationError(error.message));
      }
      
      next();
    });
  };
};

/**
 * Middleware de traitement post-upload
 */
const processUploadedFile = (req, res, next) => {
  if (req.file) {
    // Ajouter des métadonnées utiles
    req.file.relativePath = req.file.path.replace(path.join(__dirname, '../../'), '');
    req.file.url = `/${req.file.relativePath.replace(/\\/g, '/')}`;
    
    logger.info('Fichier uploadé:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      path: req.file.relativePath
    });
  }
  
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      file.relativePath = file.path.replace(path.join(__dirname, '../../'), '');
      file.url = `/${file.relativePath.replace(/\\/g, '/')}`;
    });
    
    logger.info(`${req.files.length} fichiers uploadés`);
  }
  
  next();
};

/**
 * Middleware de nettoyage des fichiers en cas d'erreur
 */
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const cleanup = () => {
    if (res.statusCode >= 400) {
      const filesToDelete = [];
      
      if (req.file) {
        filesToDelete.push(req.file.path);
      }
      
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => filesToDelete.push(file.path));
      }
      
      filesToDelete.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error('Erreur lors de la suppression du fichier:', err);
            } else {
              logger.info('Fichier supprimé après erreur:', filePath);
            }
          });
        }
      });
    }
  };
  
  res.send = function(...args) {
    cleanup();
    return originalSend.apply(this, args);
  };
  
  res.json = function(...args) {
    cleanup();
    return originalJson.apply(this, args);
  };
  
  next();
};

/**
 * Middleware de validation de l'image
 */
const validateImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (!allowedImageTypes.includes(req.file.mimetype)) {
    return next(validationError('Type d\'image non autorisé'));
  }
  
  // Optionnel: Valider les dimensions de l'image
  // Vous pourriez utiliser une bibliothèque comme 'sharp' ou 'jimp' ici
  
  next();
};

/**
 * Middleware de redimensionnement d'image (optionnel)
 */
const resizeImage = (options = {}) => {
  const { width = 800, height = 600, quality = 85 } = options;
  
  return (req, res, next) => {
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return next();
    }
    
    // Cette fonction nécessiterait une bibliothèque comme 'sharp'
    // const sharp = require('sharp');
    // 
    // sharp(req.file.path)
    //   .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    //   .jpeg({ quality })
    //   .toFile(req.file.path + '_resized')
    //   .then(() => {
    //     // Remplacer le fichier original
    //     fs.unlinkSync(req.file.path);
    //     fs.renameSync(req.file.path + '_resized', req.file.path);
    //     next();
    //   })
    //   .catch(next);
    
    // Pour l'instant, on passe directement
    next();
  };
};

/**
 * Suppression d'un fichier
 */
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, '../../', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return resolve();
    }
    
    fs.unlink(fullPath, (err) => {
      if (err) {
        logger.error('Erreur lors de la suppression du fichier:', err);
        reject(err);
      } else {
        logger.info('Fichier supprimé:', fullPath);
        resolve();
      }
    });
  });
};

/**
 * Middleware d'upload pour couverture de livre
 */
const uploadBookCover = [
  handleUpload(bookCoverUpload.single('cover_image')),
  validateImage,
  processUploadedFile,
  cleanupOnError
];

/**
 * Middleware d'upload pour PDF de livre
 */
const uploadBookPdf = [
  handleUpload(bookPdfUpload.single('pdf_file')),
  processUploadedFile,
  cleanupOnError
];

/**
 * Middleware d'upload pour image de profil
 */
const uploadProfileImage = [
  handleUpload(profileImageUpload.single('profile_image')),
  validateImage,
  resizeImage({ width: 300, height: 300 }),
  processUploadedFile,
  cleanupOnError
];

/**
 * Middleware d'upload multiple
 */
const uploadMultiple = [
  handleUpload(genericUpload.array('files', 5)),
  processUploadedFile,
  cleanupOnError
];

module.exports = {
  uploadBookCover,
  uploadBookPdf,
  uploadProfileImage,
  uploadMultiple,
  deleteFile,
  validateImage,
  resizeImage,
  processUploadedFile,
  cleanupOnError
};