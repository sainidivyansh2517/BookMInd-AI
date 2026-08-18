const { BookRepo } = require('../models/Book');
const { NoteRepo } = require('../models/Note');
const OpenLibraryService = require('../services/openLibraryService');

const getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search, sort } = req.query;

    let books = await BookRepo.findByUser(userId);

    // Filter by status
    if (status && status !== 'all') {
      books = books.filter(b => b.status === status);
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      books = books.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.authors && b.authors.some(a => a.toLowerCase().includes(q))) ||
        (b.genres && b.genres.some(g => g.toLowerCase().includes(q)))
      );
    }

    // Sort
    if (sort === 'title') {
      books.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sort === 'author') {
      books.sort((a, b) => ((a.authors && a.authors[0]) || '').localeCompare((b.authors && b.authors[0]) || ''));
    } else if (sort === 'rating') {
      books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: recently added
      books.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    }

    return res.json({ books });
  } catch (error) {
    console.error('getLibrary error:', error);
    return res.status(500).json({ message: 'Failed to fetch personal library.' });
  }
};

const getBookById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;

    const book = await BookRepo.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found in library.' });
    }

    if (String(book.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Access denied. You do not own this book resource.' });
    }

    // Fetch notes attached to this book
    const notes = await NoteRepo.findByBook(userId, bookId);

    return res.json({ book, notes });
  } catch (error) {
    console.error('getBookById error:', error);
    return res.status(500).json({ message: 'Failed to retrieve book details.' });
  }
};

const addBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      openLibraryId, 
      title, 
      authors, 
      coverUrl, 
      publishYear, 
      totalPages, 
      genres, 
      description,
      status,
      rating
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Book title is required.' });
    }

    // Check if book already added by openLibraryId or title
    const existingBooks = await BookRepo.findByUser(userId);
    const duplicate = existingBooks.find(b => 
      (openLibraryId && b.openLibraryId === openLibraryId) ||
      (b.title.toLowerCase() === title.toLowerCase())
    );

    if (duplicate) {
      return res.status(400).json({ message: `"${title}" is already in your library.` });
    }

    const newBook = await BookRepo.create({
      userId,
      openLibraryId: openLibraryId || '',
      title: title.trim(),
      authors: Array.isArray(authors) ? authors : (authors ? [authors] : ['Unknown Author']),
      coverUrl: coverUrl || '',
      publishYear: publishYear ? Number(publishYear) : null,
      totalPages: totalPages ? Number(totalPages) : 250,
      progressPages: status === 'completed' ? (totalPages || 250) : 0,
      status: status || 'want_to_read',
      rating: rating ? Number(rating) : 0,
      genres: Array.isArray(genres) ? genres : [],
      description: description || ''
    });

    return res.status(201).json({
      message: 'Book added to library successfully.',
      book: newBook
    });
  } catch (error) {
    console.error('addBook error:', error);
    return res.status(500).json({ message: 'Failed to add book to library.' });
  }
};

const updateBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;

    const book = await BookRepo.findById(bookId);
    if (!book || String(book.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const { status, progressPages, totalPages, rating, review, genres, description } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();
        if (book.totalPages > 0) {
          updateData.progressPages = book.totalPages;
        }
      }
    }

    if (progressPages !== undefined) {
      const p = Math.max(0, Number(progressPages));
      updateData.progressPages = p;

      // Auto completed if progress reached 100%
      if (book.totalPages > 0 && p >= book.totalPages) {
        updateData.status = 'completed';
        updateData.completedAt = new Date().toISOString();
      }
    }

    if (totalPages !== undefined) updateData.totalPages = Number(totalPages);
    if (rating !== undefined) updateData.rating = Number(rating);
    if (review !== undefined) updateData.review = review;
    if (genres) updateData.genres = genres;
    if (description !== undefined) updateData.description = description;

    const updated = await BookRepo.updateById(bookId, updateData);

    return res.json({
      message: 'Book updated successfully.',
      book: updated
    });
  } catch (error) {
    console.error('updateBook error:', error);
    return res.status(500).json({ message: 'Failed to update book.' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;

    const book = await BookRepo.findById(bookId);
    if (!book || String(book.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    await BookRepo.deleteById(bookId);

    return res.json({ message: 'Book removed from library.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete book.' });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ results: [] });
    }

    const results = await OpenLibraryService.searchBooks(q);
    return res.json({ results });
  } catch (error) {
    return res.status(500).json({ message: 'Error searching OpenLibrary.' });
  }
};

module.exports = {
  getLibrary,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  searchBooks
};
