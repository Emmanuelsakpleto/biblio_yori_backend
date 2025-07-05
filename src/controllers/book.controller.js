const BookService = require('../services/book.service');
const { AppError, formatResponse, paginate } = require('../utils/helpers');
const { transformBookWithUrls, transformBooksWithUrls } = require('../utils/file-url.utils');
const path = require('path');
const fs = require('fs').promises;

class BookController {
  // Obtenir tous les livres avec filtres et pagination
  static async getAllBooks(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        author = '',
        available_only = 'false',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {
        search: search.trim(),
        category: category.trim(),
        author: author.trim(),
        available_only: available_only === 'true',
        sort_by,
        sort_order: sort_order.toUpperCase()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await BookService.getAllBooks(filters, pagination);

      // Transformer les URLs des images
      if (result.books) {
        result.books = transformBooksWithUrls(result.books);
      }

      res.json(formatResponse(true, 'Livres récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir un livre par ID
  static async getBookById(req, res, next) {
    try {
      const { id } = req.params;
      const { include_reviews = 'false' } = req.query;

      const book = await BookService.getBookById(id, {
        include_reviews: include_reviews === 'true'
      });

      if (!book) {
        throw new AppError('Livre non trouvé', 404);
      }

      // Transformer les URLs des images
      const bookWithUrls = transformBookWithUrls(book);

      res.json(formatResponse(true, 'Livre récupéré avec succès', bookWithUrls));
    } catch (error) {
      next(error);
    }
  }

  // Créer un nouveau livre (Admin seulement)
  static async createBook(req, res, next) {
    try {
      const bookData = req.body;
      
      // Ajouter les fichiers uploadés si présents
      if (req.files) {
        if (req.files.cover_image) {
          bookData.cover_image = req.files.cover_image[0].filename;
        }
        if (req.files.pdf_file) {
          bookData.pdf_file = req.files.pdf_file[0].filename;
        }
      }

      const book = await BookService.createBook(bookData);
      
      // Transformer les URLs des images
      const bookWithUrls = transformBookWithUrls(book);
      
      res.status(201).json(formatResponse(true, 'Livre créé avec succès', bookWithUrls));
    } catch (error) {
      // Supprimer les fichiers uploadés en cas d'erreur
      if (req.files) {
        try {
          if (req.files.cover_image) {
            await fs.unlink(req.files.cover_image[0].path);
          }
          if (req.files.pdf_file) {
            await fs.unlink(req.files.pdf_file[0].path);
          }
        } catch (unlinkError) {
          console.error('Erreur suppression fichiers:', unlinkError);
        }
      }
      next(error);
    }
  }

  // Mettre à jour un livre (Admin seulement)
  static async updateBook(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Récupérer le livre existant pour gérer les fichiers
      const existingBook = await BookService.getBookById(id);
      if (!existingBook) {
        throw new AppError('Livre non trouvé', 404);
      }

      // Ajouter les nouveaux fichiers uploadés si présents
      if (req.files) {
        if (req.files.cover_image) {
          updateData.cover_image = req.files.cover_image[0].filename;
          // Supprimer l'ancienne image de couverture
          if (existingBook.cover_image) {
            try {
              await fs.unlink(path.join(process.cwd(), 'uploads/books', existingBook.cover_image));
            } catch (error) {
              console.error('Erreur suppression ancienne image:', error);
            }
          }
        }
        if (req.files.pdf_file) {
          updateData.pdf_file = req.files.pdf_file[0].filename;
          // Supprimer l'ancien fichier PDF
          if (existingBook.pdf_file) {
            try {
              await fs.unlink(path.join(process.cwd(), 'uploads/books', existingBook.pdf_file));
            } catch (error) {
              console.error('Erreur suppression ancien PDF:', error);
            }
          }
        }
      }

      const book = await BookService.updateBook(id, updateData);
      
      // Transformer les URLs des images
      const bookWithUrls = transformBookWithUrls(book);
      
      res.json(formatResponse(true, 'Livre mis à jour avec succès', bookWithUrls));
    } catch (error) {
      // Supprimer les nouveaux fichiers uploadés en cas d'erreur
      if (req.files) {
        try {
          if (req.files.cover_image) {
            await fs.unlink(req.files.cover_image[0].path);
          }
          if (req.files.pdf_file) {
            await fs.unlink(req.files.pdf_file[0].path);
          }
        } catch (unlinkError) {
          console.error('Erreur suppression fichiers:', unlinkError);
        }
      }
      next(error);
    }
  }

  // Supprimer un livre (Admin seulement)
  static async deleteBook(req, res, next) {
    try {
      const { id } = req.params;

      // Récupérer le livre pour supprimer les fichiers associés
      const book = await BookService.getBookById(id);
      if (!book) {
        throw new AppError('Livre non trouvé', 404);
      }

      // Vérifier s'il y a des emprunts actifs
      const hasActiveLoans = await BookService.hasActiveLoans(id);
      if (hasActiveLoans) {
        throw new AppError('Impossible de supprimer un livre avec des emprunts actifs', 400);
      }

      await BookService.deleteBook(id);

      // Supprimer les fichiers associés
      if (book.cover_image) {
        try {
          await fs.unlink(path.join(process.cwd(), 'uploads/books', book.cover_image));
        } catch (error) {
          console.error('Erreur suppression image:', error);
        }
      }
      if (book.pdf_file) {
        try {
          await fs.unlink(path.join(process.cwd(), 'uploads/books', book.pdf_file));
        } catch (error) {
          console.error('Erreur suppression PDF:', error);
        }
      }

      res.json(formatResponse(true, 'Livre supprimé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Rechercher des livres (VERSION MODERNE FLEXIBLE)
  static async searchBooks(req, res, next) {
    try {
      const {
        q: query = '',
        page = 1,
        limit = 20,
        category = '',
        author = '',
        available_only = 'false'
      } = req.query;

      // ✨ Validation moderne: au moins un critère requis
      const hasQuery = query && query.trim();
      const hasCategory = category && category.trim();
      const hasAuthor = author && author.trim();
      
      if (!hasQuery && !hasCategory && !hasAuthor) {
        throw new AppError('Au moins un critère de recherche est requis (q, category, ou author)', 400);
      }

      const filters = {
        search: hasQuery ? query.trim() : '',
        category: hasCategory ? category.trim() : '',
        author: hasAuthor ? author.trim() : '',
        available_only: available_only === 'true'
      };

      console.log('🔍 Modern search filters:', filters);

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await BookService.searchBooks(filters, pagination);

      res.json(formatResponse(true, 'Recherche effectuée avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les livres par catégorie
  static async getBooksByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const {
        page = 1,
        limit = 20,
        available_only = 'false',
        sort_by = 'title',
        sort_order = 'ASC'
      } = req.query;

      const filters = {
        category,
        available_only: available_only === 'true',
        sort_by,
        sort_order: sort_order.toUpperCase()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await BookService.getBooksByCategory(filters, pagination);

      res.json(formatResponse(true, 'Livres de la catégorie récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les livres populaires
  static async getPopularBooks(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const books = await BookService.getPopularBooks(parseInt(limit));

      res.json(formatResponse(true, 'Livres populaires récupérés avec succès', books));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les nouveaux livres
  static async getNewBooks(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const books = await BookService.getNewBooks(parseInt(limit));

      res.json(formatResponse(true, 'Nouveaux livres récupérés avec succès', books));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les recommandations pour un utilisateur
  static async getRecommendations(req, res, next) {
    try {
      const { userId } = req.user;
      const { limit = 10 } = req.query;

      const books = await BookService.getRecommendations(userId, parseInt(limit));

      res.json(formatResponse(true, 'Recommandations récupérées avec succès', books));
    } catch (error) {
      next(error);
    }
  }

  // Vérifier la disponibilité d'un livre
  static async checkAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const availability = await BookService.checkAvailability(id);

      res.json(formatResponse(true, 'Disponibilité vérifiée', availability));
    } catch (error) {
      next(error);
    }
  }

  // Réserver un livre
  static async reserveBook(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const reservation = await BookService.reserveBook(id, userId);

      res.json(formatResponse(true, 'Livre réservé avec succès', reservation));
    } catch (error) {
      next(error);
    }
  }

  // Annuler une réservation
  static async cancelReservation(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      await BookService.cancelReservation(id, userId);

      res.json(formatResponse(true, 'Réservation annulée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les réservations d'un utilisateur
  static async getUserReservations(req, res, next) {
    try {
      const { userId } = req.user;
      const {
        page = 1,
        limit = 10,
        status = 'active'
      } = req.query;

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await BookService.getUserReservations(userId, status, pagination);

      res.json(formatResponse(true, 'Réservations récupérées avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir toutes les catégories
  static async getCategories(req, res, next) {
    try {
      const categories = await BookService.getCategories();
      res.json(formatResponse(true, 'Catégories récupérées avec succès', categories));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques d'un livre (Admin seulement)
  static async getBookStats(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await BookService.getBookStats(id);

      res.json(formatResponse(true, 'Statistiques du livre récupérées avec succès', stats));
    } catch (error) {
      next(error);
    }
  }

  // Exporter la liste des livres (Admin seulement)
  static async exportBooks(req, res, next) {
    try {
      const { format = 'csv' } = req.query;
      const result = await BookService.exportBooks(format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="books.${format}"`);
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  // Importer des livres en lot (Admin seulement)
  static async importBooks(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('Fichier requis pour l\'importation', 400);
      }

      const result = await BookService.importBooks(req.file.path);

      // Supprimer le fichier temporaire
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        console.error('Erreur suppression fichier temporaire:', error);
      }

      res.json(formatResponse(true, 'Importation effectuée avec succès', result));
    } catch (error) {
      // Supprimer le fichier temporaire en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier temporaire:', unlinkError);
        }
      }
      next(error);
    }
  }

  // Télécharger le PDF d'un livre
  static async downloadPDF(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      // Vérifier si l'utilisateur peut télécharger ce livre
      const canDownload = await BookService.canUserDownload(id, userId);
      if (!canDownload) {
        throw new AppError('Vous n\'êtes pas autorisé à télécharger ce livre', 403);
      }

      const book = await BookService.getBookById(id);
      if (!book || !book.pdf_file) {
        throw new AppError('Fichier PDF non disponible', 404);
      }

      const filePath = path.join(process.cwd(), 'uploads/books', book.pdf_file);
      
      // Vérifier que le fichier existe
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new AppError('Fichier PDF non trouvé', 404);
      }

      res.download(filePath, `${book.title}.pdf`);
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour la disponibilité d'un livre (Admin seulement)
  static async updateAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { is_available } = req.body;

      const book = await BookService.updateAvailability(id, is_available);

      res.json(formatResponse(true, 'Disponibilité mise à jour avec succès', book));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les likes d'un livre
  static async getBookLikes(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await BookService.getBookLikes(id, userId);

      res.json(formatResponse(true, 'Likes récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Toggle like d'un livre
  static async toggleLike(req, res, next) {
    try {
      const { id } = req.params;
      
      // Vérifier que l'utilisateur est authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json(formatResponse(false, 'Utilisateur non authentifié', null));
      }
      
      const userId = req.user.id;

      const result = await BookService.toggleLike(id, userId);

      res.json(formatResponse(true, result.action === 'liked' ? 'Livre liké avec succès' : 'Like retiré avec succès', result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BookController;