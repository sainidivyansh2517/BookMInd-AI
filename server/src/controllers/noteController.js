const { NoteRepo } = require('../models/Note');
const { BookRepo } = require('../models/Book');

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, tag, search, page, limit } = req.query;

    const result = await NoteRepo.findByUser(userId, {
      bookId,
      tag,
      search,
      page,
      limit
    });

    const isPaginated = page && limit;
    const rawNotes = isPaginated ? result.notes : result;

    // Collect unique bookIds from the returned notes
    const uniqueBookIds = [...new Set(rawNotes.map(n => n.bookId).filter(Boolean))];
    const bookMap = {};

    if (uniqueBookIds.length > 0) {
      await Promise.all(
        uniqueBookIds.map(async (bId) => {
          try {
            const b = await BookRepo.findById(bId);
            if (b) {
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
    console.error('getNotes error:', error);
    return res.status(500).json({ message: 'Failed to fetch personal notes.' });
  }
};

const getNoteById = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const note = await NoteRepo.findById(noteId);
    if (!note || String(note.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    let book = null;
    if (note.bookId) {
      const b = await BookRepo.findById(note.bookId);
      if (b) {
        book = { id: b._id || b.id, title: b.title, coverUrl: b.coverUrl, authors: b.authors };
      }
    }

    return res.json({ note: { ...note, book } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch note.' });
  }
};

const createNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, bookId, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Note title is required.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content cannot be empty.' });
    }

    // Verify book ownership if bookId is supplied
    if (bookId) {
      const book = await BookRepo.findById(bookId);
      if (!book || String(book.userId) !== String(userId)) {
        return res.status(403).json({ message: 'Cannot attach note to a book you do not own.' });
      }
    }

    // Sanitize tags
    let tagList = [];
    if (Array.isArray(tags)) {
      tagList = tags;
    } else if (typeof tags === 'string') {
      tagList = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    }

    const newNote = await NoteRepo.create({
      userId,
      bookId: bookId || null,
      title: title.trim(),
      content: content.trim(),
      tags: tagList
    });

    return res.status(201).json({
      message: 'Note created successfully.',
      note: newNote
    });
  } catch (error) {
    console.error('createNote error:', error);
    return res.status(500).json({ message: 'Failed to create note.' });
  }
};

const updateNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await NoteRepo.findById(noteId);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const { title, content, bookId, tags } = req.body;
    const updateData = {};

    if (title) updateData.title = title.trim();
    if (content) updateData.content = content.trim();
    if (bookId !== undefined) {
      if (bookId) {
        const book = await BookRepo.findById(bookId);
        if (!book || String(book.userId) !== String(userId)) {
          return res.status(403).json({ message: 'Cannot attach note to a book you do not own.' });
        }
      }
      updateData.bookId = bookId || null;
    }
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updateData.tags = tags;
      } else if (typeof tags === 'string') {
        updateData.tags = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      }
    }

    const updated = await NoteRepo.updateById(noteId, updateData);

    return res.json({
      message: 'Note updated successfully.',
      note: updated
    });
  } catch (error) {
    console.error('updateNote error:', error);
    return res.status(500).json({ message: 'Failed to update note.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await NoteRepo.findById(noteId);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    await NoteRepo.deleteById(noteId);
    return res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete note.' });
  }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote };
