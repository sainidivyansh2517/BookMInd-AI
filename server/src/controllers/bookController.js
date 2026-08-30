const { BookRepo } = require('../models/Book');
const { NoteRepo } = require('../models/Note');
const { RecommendationRepo } = require('../models/Recommendation');
const OpenLibraryService = require('../services/openLibraryService');

const getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search, sort, page, limit } = req.query;

    const result = await BookRepo.findByUser(userId, {
      status,
      search,
      sort,
      page,
      limit
    });

    if (page && limit) {
      return res.json(result);
    }

    return res.json({ books: result });
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

    // Check duplicate by title or openLibraryId
    const existingBooks = await BookRepo.findByUser(userId);
    const booksList = Array.isArray(existingBooks) ? existingBooks : (existingBooks.books || []);
    const duplicate = booksList.find(b => 
      (openLibraryId && b.openLibraryId === openLibraryId) ||
      (b.title.toLowerCase() === title.trim().toLowerCase())
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

    // Invalidate recommendation cache on library change
    await RecommendationRepo.invalidateUser(userId);

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
    let shouldInvalidateRecs = false;

    if (status) {
      updateData.status = status;
      if (status === 'completed' && book.status !== 'completed') {
        updateData.completedAt = new Date().toISOString();
        if (book.totalPages > 0) {
          updateData.progressPages = book.totalPages;
        }
        shouldInvalidateRecs = true;
      }
    }

    if (progressPages !== undefined) {
      const p = Math.max(0, Number(progressPages));
      updateData.progressPages = p;

      // Auto completed if progress reached 100%
      if (book.totalPages > 0 && p >= book.totalPages && book.status !== 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = new Date().toISOString();
        shouldInvalidateRecs = true;
      }
    }

    if (totalPages !== undefined) updateData.totalPages = Number(totalPages);
    if (rating !== undefined) {
      updateData.rating = Number(rating);
      if (Number(rating) !== book.rating) shouldInvalidateRecs = true;
    }
    if (review !== undefined) updateData.review = review;
    if (genres) {
      updateData.genres = genres;
      shouldInvalidateRecs = true;
    }
    if (description !== undefined) updateData.description = description;

    const updated = await BookRepo.updateById(bookId, updateData);

    if (shouldInvalidateRecs) {
      await RecommendationRepo.invalidateUser(userId);
    }

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
    await RecommendationRepo.invalidateUser(userId);

    return res.json({ message: 'Book removed from library.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete book.' });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || !q.trim()) {
      return res.json({ results: [] });
    }

    const results = await OpenLibraryService.searchBooks(q.trim(), limit ? parseInt(limit, 10) : 15);
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
