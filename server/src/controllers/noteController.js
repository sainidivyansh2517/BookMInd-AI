const { NoteRepo } = require('../models/Note');
const { BookRepo } = require('../models/Book');

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, tag, search } = req.query;

    let notes = await NoteRepo.findByUser(userId);

    if (bookId) {
      notes = notes.filter(n => String(n.bookId) === String(bookId));
    }

    if (tag) {
      const cleanTag = tag.replace('#', '').toLowerCase();
      notes = notes.filter(n => n.tags && n.tags.some(t => t.toLowerCase() === cleanTag));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      notes = notes.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Attach book title & cover preview if bookId is present
    const userBooks = await BookRepo.findByUser(userId);
    const bookMap = {};
    userBooks.forEach(b => {
      bookMap[b._id || b.id] = {
        id: b._id || b.id,
        title: b.title,
        coverUrl: b.coverUrl,
        authors: b.authors
      };
    });

    const enrichedNotes = notes.map(n => ({
      ...n,
      book: n.bookId ? bookMap[n.bookId] || null : null
    }));

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
    if (bookId !== undefined) updateData.bookId = bookId || null;
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
