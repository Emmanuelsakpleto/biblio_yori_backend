const database = require('../config/database');
const { logger } = require('../utils/helpers');
const { PAGINATION } = require('../utils/constants');

/**
 * Service moderne pour les livres utilisant le pattern Builder
 */
class ModernBookService {
  
  /**
   * Builder de requête moderne
   */
  static createQueryBuilder() {
    return {
      select: ['b.*'],
      from: 'books b',
      where: [],
      params: [],
      orderBy: 'b.created_at DESC',
      limit: null,
      offset: null,
      
      addSelect(columns) {
        if (Array.isArray(columns)) {
          this.select.push(...columns);
        } else {
          this.select.push(columns);
        }
        return this;
      },
      
      addWhere(condition, ...params) {
        this.where.push(condition);
        this.params.push(...params);
        return this;
      },
      
      setOrderBy(order) {
        this.orderBy = order;
        return this;
      },
      
      setPagination(limit, offset) {
        this.limit = limit;
        this.offset = offset;
        return this;
      },
      
      build() {
        let query = `SELECT ${this.select.join(', ')} FROM ${this.from}`;
        
        if (this.where.length > 0) {
          query += ` WHERE ${this.where.join(' AND ')}`;
        }
        
        if (this.orderBy) {
          query += ` ORDER BY ${this.orderBy}`;
        }
        
        if (this.limit !== null) {
          query += ` LIMIT ?`;
          this.params.push(this.limit);
        }
        
        if (this.offset !== null) {
          query += ` OFFSET ?`;
          this.params.push(this.offset);
        }
        
        return {
          query,
          params: this.params
        };
      }
    };
  }
  
  /**
   * Obtenir tous les livres avec une approche moderne
   */
  static async getAllBooks(filters = {}, pagination = {}) {
    try {
      const {
        search = '',
        category = '',
        author = '',
        isbn = '',
        status = '',
        available = null
      } = filters;
      
      const {
        page = 1,
        limit = PAGINATION?.DEFAULT_LIMIT || 20
      } = pagination;
      
      const offset = (page - 1) * limit;
      
      // Utilisation du pattern Builder
      const builder = this.createQueryBuilder();
      
      // Toujours exclure les livres perdus
      builder.addWhere("b.status != ?", 'lost');
      
      // Filtres conditionnels
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        builder.addWhere(
          "(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)",
          searchTerm, searchTerm, searchTerm, searchTerm
        );
      }
      
      if (category && category.trim()) {
        builder.addWhere("b.category = ?", category.trim());
      }
      
      if (author && author.trim()) {
        builder.addWhere("b.author LIKE ?", `%${author.trim()}%`);
      }
      
      if (isbn && isbn.trim()) {
        builder.addWhere("b.isbn = ?", isbn.trim());
      }
      
      if (status && status.trim()) {
        builder.addWhere("b.status = ?", status.trim());
      }
      
      if (available === true) {
        builder.addWhere("b.available_copies > ?", 0);
      } else if (available === false) {
        builder.addWhere("b.available_copies = ?", 0);
      }
      
      // Pagination
      builder.setPagination(limit, offset);
      
      // Construire la requête
      const { query, params } = builder.build();
      
      // Debug moderne
      console.log('🔍 Modern Query:', query);
      console.log('🔍 Modern Params:', params);
      console.log('🔍 Param types:', params.map(p => `${typeof p}: ${p}`));
      
      // Exécution
      const books = await database.query(query, params);
      
      // Requête de comptage simplifiée
      const countBuilder = this.createQueryBuilder();
      countBuilder.select = ['COUNT(*) as total'];
      countBuilder.addWhere("b.status != ?", 'lost');
      
      // Appliquer les mêmes filtres pour le count
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        countBuilder.addWhere(
          "(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)",
          searchTerm, searchTerm, searchTerm, searchTerm
        );
      }
      
      if (category && category.trim()) {
        countBuilder.addWhere("b.category = ?", category.trim());
      }
      
      if (author && author.trim()) {
        countBuilder.addWhere("b.author LIKE ?", `%${author.trim()}%`);
      }
      
      if (isbn && isbn.trim()) {
        countBuilder.addWhere("b.isbn = ?", isbn.trim());
      }
      
      if (status && status.trim()) {
        countBuilder.addWhere("b.status = ?", status.trim());
      }
      
      if (available === true) {
        countBuilder.addWhere("b.available_copies > ?", 0);
      } else if (available === false) {
        countBuilder.addWhere("b.available_copies = ?", 0);
      }
      
      const { query: countQuery, params: countParams } = countBuilder.build();
      const [{ total }] = await database.query(countQuery, countParams);
      
      return {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
      
    } catch (error) {
      logger.error('Erreur moderne dans getAllBooks:', error);
      throw error;
    }
  }
}

module.exports = ModernBookService;
