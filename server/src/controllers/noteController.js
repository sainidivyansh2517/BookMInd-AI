const { NoteRepo } = require('../models/Note');
const { BookRepo } = require('../models/Book');

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, tag, search, page, limit } = req.query;

    const result = await NoteRepo.findByUser(userId, {
      bookId: typeof bookId === 'string' ? bookId.trim() : undefined,
      tag: typeof tag === 'string' ? tag.trim() : undefined,
      search: typeof search === 'string' ? search.trim().slice(0, 100) : undefined,
      page,
      limit
    });

    const isPaginated = page && limit;
    const rawNotes = isPaginated ? (result.notes || []) : (Array.isArray(result) ? result : (result.notes || []));

    // Collect unique bookIds from the returned notes
    const uniqueBookIds = [...new Set(rawNotes.map(n => n.bookId).filter(Boolean))];
    const bookMap = {};

    if (uniqueBookIds.length > 0) {
      await Promise.all(
        uniqueBookIds.map(async (bId) => {
          try {
            const b = await BookRepo.findById(bId);
            if (b && String(b.userId) === String(userId)) {
              bookMap[bId] = {
                id: b._id || b.id,
                title: b.title,
                coverUrl: b.coverUrl,
                authors: b.authors
              };
            }
          } catch (e) {
            // Ignore missing book
          }
        })
      );
    }

    const enrichedNotes = rawNotes.map(n => ({
      ...n,
      book: n.bookId ? bookMap[n.bookId] || null : null
    }));

    if (isPaginated) {
      return res.json({
        notes: enrichedNotes,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      });
    }

    return res.json({ notes: enrichedNotes });
  } catch (error) {
    console.error('getNotes error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch personal notes.' });
  }
};

const getNoteById = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    if (!noteId) {
      return res.status(400).json({ message: 'Note identifier is required.' });
    }

    const note = await NoteRepo.findById(noteId);
    if (!note || String(note.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    let book = null;
    if (note.bookId) {
      const b = await BookRepo.findById(note.bookId);
      if (b && String(b.userId) === String(userId)) {
        book = { id: b._id || b.id, title: b.title, coverUrl: b.coverUrl, authors: b.authors };
      }
    }

    return res.json({ note: { ...note, book } });
  } catch (error) {
    console.error('getNoteById error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch note.' });
  }
};

const createNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, bookId, tags } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Note title is required.' });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Note content cannot be empty.' });
    }

    const cleanTitle = title.trim().slice(0, 200);
    const cleanContent = content.trim().slice(0, 50000);

    // Verify book ownership if bookId is supplied
    let verifiedBookId = null;
    if (bookId) {
      const book = await BookRepo.findById(bookId);
      if (!book || String(book.userId) !== String(userId)) {
        return res.status(403).json({ message: 'Cannot attach note to a book you do not own.' });
      }
      verifiedBookId = bookId;
    }

    // Sanitize tags
    let tagList = [];
    if (Array.isArray(tags)) {
      tagList = tags
        .filter(t => typeof t === 'string' && t.trim())
        .map(t => t.trim().replace(/^#/, '').slice(0, 40))
        .slice(0, 20);
    } else if (typeof tags === 'string' && tags.trim()) {
      tagList = tags
        .split(',')
        .map(t => t.trim().replace(/^#/, '').slice(0, 40))
        .filter(Boolean)
        .slice(0, 20);
    }

    const newNote = await NoteRepo.create({
      userId,
      bookId: verifiedBookId,
      title: cleanTitle,
      content: cleanContent,
      tags: tagList
    });

    return res.status(201).json({
      message: 'Note created successfully.',
      note: newNote
    });
  } catch (error) {
    console.error('createNote error:', error.message);
    return res.status(500).json({ message: 'Failed to create note.' });
  }
};

const updateNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    if (!noteId) {
      return res.status(400).json({ message: 'Note identifier is required.' });
    }

    const existing = await NoteRepo.findById(noteId);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Note not found in your collection.' });
    }

    const { title, content, bookId, tags } = req.body;
    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Note title cannot be empty.' });
      }
      updateData.title = title.trim().slice(0, 200);
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ message: 'Note content cannot be empty.' });
      }
      updateData.content = content.trim().slice(0, 50000);
    }

    if (bookId !== undefined) {
      if (bookId) {
        const book = await BookRepo.findById(bookId);
        if (!book || String(book.userId) !== String(userId)) {
          return res.status(403).json({ message: 'Cannot attach note to a book you do not own.' });
        }
        updateData.bookId = bookId;
      } else {
        updateData.bookId = null;
      }
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updateData.tags = tags
          .filter(t => typeof t === 'string' && t.trim())
          .map(t => t.trim().replace(/^#/, '').slice(0, 40))
          .slice(0, 20);
      } else if (typeof tags === 'string') {
        updateData.tags = tags
          .split(',')
          .map(t => t.trim().replace(/^#/, '').slice(0, 40))
          .filter(Boolean)
          .slice(0, 20);
      }
    }

    const updated = await NoteRepo.updateById(noteId, updateData);

    return res.json({
      message: 'Note updated successfully.',
      note: updated
    });
  } catch (error) {
    console.error('updateNote error:', error.message);
    return res.status(500).json({ message: 'Failed to update note.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    if (!noteId) {
      return res.status(400).json({ message: 'Note identifier is required.' });
    }

    const existing = await NoteRepo.findById(noteId);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Note not found in your collection.' });
    }

    await NoteRepo.deleteById(noteId);
    return res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('deleteNote error:', error.message);
    return res.status(500).json({ message: 'Failed to delete note.' });
  }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote };
