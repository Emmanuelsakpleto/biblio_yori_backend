/**
 * Utilitaires pour les URLs et fichiers statiques
 */

const path = require('path');

/**
 * Construire l'URL complète pour un fichier uploadé
 * @param {string} filePath - Chemin relatif du fichier
 * @param {string} baseUrl - URL de base du serveur (optionnel)
 * @returns {string|null} - URL complète ou null si pas de fichier
 */
const buildFileUrl = (filePath, baseUrl = null) => {
  if (!filePath) return null;
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Construire l'URL de base si non fournie
  if (!baseUrl) {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    baseUrl = serverUrl;
  }
  
  // Nettoyer le chemin et construire l'URL
  const cleanPath = filePath.replace(/\\/g, '/');
  const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  return `${baseUrl}${finalPath}`;
};

/**
 * Construire l'URL pour une image de couverture de livre
 * @param {string} coverImage - Nom du fichier de couverture ou URL complète
 * @returns {string|null} - URL complète ou null
 */
const buildBookCoverUrl = (coverImage) => {
  if (!coverImage) return null;
  
  // Si c'est déjà une URL complète (http ou https), la retourner telle quelle
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return coverImage;
  }
  
  // Sinon, construire l'URL locale
  return buildFileUrl(`/uploads/books/${coverImage}`);
};

/**
 * Construire l'URL pour une image de profil utilisateur
 * @param {string} profileImage - Nom du fichier de profil
 * @returns {string|null} - URL complète ou null
 */
const buildProfileImageUrl = (profileImage) => {
  if (!profileImage) return null;
  return buildFileUrl(`/uploads/users/${profileImage}`);
};

/**
 * Construire l'URL pour un fichier PDF de livre
 * @param {string} pdfFile - Nom du fichier PDF
 * @returns {string|null} - URL complète ou null
 */
const buildBookPdfUrl = (pdfFile) => {
  if (!pdfFile) return null;
  return buildFileUrl(`/uploads/books/pdf/${pdfFile}`);
};

/**
 * Transformer un objet livre pour inclure les URLs complètes
 * @param {Object} book - Objet livre
 * @returns {Object} - Livre avec URLs complètes
 */
const transformBookWithUrls = (book) => {
  if (!book) return book;
  
  return {
    ...book,
    cover_image: buildBookCoverUrl(book.cover_image) || book.cover_image,
    pdf_file: buildBookPdfUrl(book.pdf_file) || book.pdf_file
  };
};

/**
 * Transformer un objet utilisateur pour inclure les URLs complètes
 * @param {Object} user - Objet utilisateur
 * @returns {Object} - Utilisateur avec URLs complètes
 */
const transformUserWithUrls = (user) => {
  if (!user) return user;
  
  return {
    ...user,
    profile_image_url: buildProfileImageUrl(user.profile_image)
  };
};

/**
 * Transformer une liste de livres pour inclure les URLs complètes
 * @param {Array} books - Liste de livres
 * @returns {Array} - Liste de livres avec URLs complètes
 */
const transformBooksWithUrls = (books) => {
  if (!Array.isArray(books)) return books;
  return books.map(transformBookWithUrls);
};

module.exports = {
  buildFileUrl,
  buildBookCoverUrl,
  buildProfileImageUrl,
  buildBookPdfUrl,
  transformBookWithUrls,
  transformUserWithUrls,
  transformBooksWithUrls
};
