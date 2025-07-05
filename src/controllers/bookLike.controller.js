const BookLikeService = require('../services/bookLike.service');

// Récupérer le nombre de likes d'un livre
exports.getLikes = async (req, res) => {
  try {
    const { bookId } = req.params;
    const likes = await BookLikeService.getLikes(Number(bookId));
    res.json({ success: true, likes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Incrémenter le nombre de likes d'un livre
exports.addLike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const likes = await BookLikeService.addLike(Number(bookId));
    res.json({ success: true, likes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
