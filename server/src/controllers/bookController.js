const { BookRepo } = require('../models/Book');
const { NoteRepo } = require('../models/Note');
const { RecommendationRepo } = require('../models/Recommendation');
const OpenLibraryService = require('../services/openLibraryService');

const VALID_STATUSES = ['want_to_read', 'currently_reading', 'completed'];

const getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search, sort, page, limit } = req.query;

    let sanitizedStatus = status;
    if (status && status !== 'all' && !VALID_STATUSES.includes(status)) {
      sanitizedStatus = undefined;
    }

    const result = await BookRepo.findByUser(userId, {
      status: sanitizedStatus,
      search: typeof search === 'string' ? search.trim().slice(0, 100) : undefined,
      sort: typeof sort === 'string' ? sort.trim() : undefined,
      page,
      limit
    });

    if (page && limit) {
      return res.json(result);
    }

    return res.json({ books: result });
  } catch (error) {
    console.error('getLibrary error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch personal library.' });
  }
};

const getBookById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;

    if (!bookId) {
      return res.status(400).json({ message: 'Book identifier is required.' });
    }

    const book = await BookRepo.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found in library.' });
    }

    // Strict resource ownership check
    if (String(book.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Access denied. You do not own this book resource.' });
    }

    // Fetch notes attached to this book (scoped to authenticated user)
    const notes = await NoteRepo.findByBook(userId, bookId);

    return res.json({ book, notes });
  } catch (error) {
    console.error('getBookById error:', error.message);
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

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Book title is required.' });
    }

    const cleanTitle = title.trim().slice(0, 250);

    // Validate status
    const initialStatus = status && VALID_STATUSES.includes(status) ? status : 'want_to_read';

    // Validate page counts
    let validTotalPages = 250;
    if (totalPages !== undefined && totalPages !== null && totalPages !== '') {
      const parsedPages = parseInt(totalPages, 10);
      if (isNaN(parsedPages) || parsedPages < 1 || parsedPages > 50000) {
        return res.status(400).json({ message: 'Total pages must be a valid positive integer.' });
      }
      validTotalPages = parsedPages;
    }

    // Validate rating
    let validRating = 0;
    if (rating !== undefined && rating !== null && rating !== '') {
      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 0 and 5.' });
      }
      validRating = parsedRating;
    }

    // Check duplicate by title or openLibraryId within user's library
    const existingBooks = await BookRepo.findByUser(userId);
    const booksList = Array.isArray(existingBooks) ? existingBooks : (existingBooks.books || []);
    const duplicate = booksList.find(b => 
      (openLibraryId && b.openLibraryId && b.openLibraryId === openLibraryId) ||
      (b.title && b.title.toLowerCase().trim() === cleanTitle.toLowerCase())
    );

    if (duplicate) {
      return res.status(400).json({ message: `"${cleanTitle}" is already in your library.` });
    }

    // Sanitize authors
    let validAuthors = ['Unknown Author'];
    if (Array.isArray(authors) && authors.length > 0) {
      validAuthors = authors.filter(a => typeof a === 'string' && a.trim()).map(a => a.trim().slice(0, 100));
    } else if (typeof authors === 'string' && authors.trim()) {
      validAuthors = [authors.trim().slice(0, 100)];
    }

    // Sanitize genres
    let validGenres = [];
    if (Array.isArray(genres)) {
      validGenres = genres.filter(g => typeof g === 'string' && g.trim()).map(g => g.trim().slice(0, 50)).slice(0, 15);
    }

    const newBook = await BookRepo.create({
      userId,
      openLibraryId: openLibraryId ? String(openLibraryId).slice(0, 50) : '',
      title: cleanTitle,
      authors: validAuthors.length ? validAuthors : ['Unknown Author'],
      coverUrl: coverUrl ? String(coverUrl).slice(0, 500) : '',
      publishYear: publishYear ? parseInt(publishYear, 10) : null,
      totalPages: validTotalPages,
      progressPages: initialStatus === 'completed' ? validTotalPages : 0,
      status: initialStatus,
      rating: validRating,
      genres: validGenres,
      description: description ? String(description).slice(0, 2000) : ''
    });

    // Invalidate recommendation cache on library change
    await RecommendationRepo.invalidateUser(userId);

    return res.status(201).json({
      message: 'Book added to library successfully.',
      book: newBook
    });
  } catch (error) {
    console.error('addBook error:', error.message);
    return res.status(500).json({ message: 'Failed to add book to library.' });
  }
};

const updateBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;

    const book = await BookRepo.findById(bookId);
    if (!book || String(book.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Book not found in your library.' });
    }

    const { status, progressPages, totalPages, rating, review, genres, description } = req.body;
    const updateData = {};
    let shouldInvalidateRecs = false;

    // Validate total pages
    let currentTotal = book.totalPages || 0;
    if (totalPages !== undefined) {
      const parsedTotal = parseInt(totalPages, 10);
      if (isNaN(parsedTotal) || parsedTotal < 1 || parsedTotal > 50000) {
        return res.status(400).json({ message: 'Total pages must be a valid positive integer.' });
      }
      updateData.totalPages = parsedTotal;
      currentTotal = parsedTotal;
    }

    // Validate progress pages (0 <= progressPages <= totalPages)
    if (progressPages !== undefined) {
      const p = parseInt(progressPages, 10);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({ message: 'Progress pages cannot be negative.' });
      }
      if (currentTotal > 0 && p > currentTotal) {
        return res.status(400).json({ message: `Progress pages (${p}) cannot exceed total pages (${currentTotal}).` });
      }
      updateData.progressPages = p;

      // Auto-complete if 100% reached
      if (currentTotal > 0 && p >= currentTotal && book.status !== 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = new Date().toISOString();
        shouldInvalidateRecs = true;
      }
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid reading status value.' });
      }
      updateData.status = status;
      if (status === 'completed' && book.status !== 'completed') {
        updateData.completedAt = new Date().toISOString();
        if (currentTotal > 0) {
          updateData.progressPages = currentTotal;
        }
        shouldInvalidateRecs = true;
      }
    }

    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 0 and 5.' });
      }
      updateData.rating = parsedRating;
      if (parsedRating !== book.rating) shouldInvalidateRecs = true;
    }

    if (review !== undefined) {
      updateData.review = typeof review === 'string' ? review.slice(0, 5000) : '';
    }

    if (genres !== undefined) {
      if (Array.isArray(genres)) {
        updateData.genres = genres.filter(g => typeof g === 'string' && g.trim()).map(g => g.trim().slice(0, 50)).slice(0, 15);
        shouldInvalidateRecs = true;
      }
    }

    if (description !== undefined) {
      updateData.description = typeof description === 'string' ? description.slice(0, 2000) : '';
    }

    const updated = await BookRepo.updateById(bookId, updateData);

    if (shouldInvalidateRecs) {
      await RecommendationRepo.invalidateUser(userId);
    }

    return res.json({
      message: 'Book updated successfully.',
      book: updated
    });
  } catch (error) {
    console.error('updateBook error:', error.message);
    return res.status(500).json({ message: 'Failed to update book.' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;

    const book = await BookRepo.findById(bookId);
    if (!book || String(book.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Book not found in your library.' });
    }

    await BookRepo.deleteById(bookId);
    // Also clean up any notes associated with this book for the user
    await NoteRepo.deleteByBook(userId, bookId);
    await RecommendationRepo.invalidateUser(userId);

    return res.json({ message: 'Book removed from library.' });
  } catch (error) {
    console.error('deleteBook error:', error.message);
    return res.status(500).json({ message: 'Failed to delete book.' });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.json({ results: [] });
    }

    const parsedLimit = Math.max(1, Math.min(30, parseInt(limit, 10) || 15));
    const results = await OpenLibraryService.searchBooks(q.trim().slice(0, 100), parsedLimit);
    return res.json({ results });
  } catch (error) {
    console.error('searchBooks error:', error.message);
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
