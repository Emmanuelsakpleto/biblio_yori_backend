const database = require('../config/database');

class BookLikeService {
  // Récupérer le nombre de likes pour un livre
  static async getLikes(bookId) {
    const [row] = await database.query('SELECT likes FROM book_likes WHERE book_id = ?', [bookId]);
    return row ? row.likes : 0;
  }

  // Incrémenter le nombre de likes pour un livre
  static async addLike(bookId) {
    // Si la ligne existe, on incrémente, sinon on l'insère
    await database.query(
      'INSERT INTO book_likes (book_id, likes) VALUES (?, 1) ON DUPLICATE KEY UPDATE likes = likes + 1',
      [bookId]
    );
    const [row] = await database.query('SELECT likes FROM book_likes WHERE book_id = ?', [bookId]);
    return row ? row.likes : 1;
  }
}

module.exports = BookLikeService;
