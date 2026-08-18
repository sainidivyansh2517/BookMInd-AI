const express = require('express');
const router = express.Router();
const {
  getLibrary,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  searchBooks
} = require('../controllers/bookController');
const authMiddleware = require('../middleware/auth');

router.get('/search', authMiddleware, searchBooks);
router.get('/', authMiddleware, getLibrary);
router.get('/:id', authMiddleware, getBookById);
router.post('/', authMiddleware, addBook);
router.put('/:id', authMiddleware, updateBook);
router.delete('/:id', authMiddleware, deleteBook);

module.exports = router;
