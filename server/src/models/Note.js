const mongoose = require('mongoose');
const { notesStore } = require('../config/storage');
const { getIsMongoConnected } = require('../config/db');

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  bookId: { type: String, default: null, index: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for user-scoped queries and filtering
noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, bookId: 1 });
noteSchema.index({ userId: 1, tags: 1 });

const MongoNote = mongoose.model('Note', noteSchema);

class NoteRepo {
  static async findByUser(userId, options = {}) {
    const { bookId, tag, search, page, limit } = options;

    if (getIsMongoConnected()) {
      const filter = { userId };
      if (bookId) filter.bookId = bookId;
      if (tag) {
        const cleanTag = tag.replace('#', '').trim();
        filter.tags = { $in: [new RegExp(`^${cleanTag}$`, 'i')] };
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { title: regex },
          { content: regex },
          { tags: regex }
        ];
      }

      let queryBuilder = MongoNote.find(filter).sort({ updatedAt: -1 }).lean();

      if (page && limit) {
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [notes, total] = await Promise.all([
          queryBuilder.skip(skip).limit(limitNum),
          MongoNote.countDocuments(filter)
        ]);

        return {
          notes,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        };
      }

      return await queryBuilder;
    }

    // Fallback JSON store
    let items = notesStore.find({ userId });

    if (bookId) {
      items = items.filter(n => String(n.bookId) === String(bookId));
    }
    if (tag) {
      const cleanTag = tag.replace('#', '').toLowerCase().trim();
      items = items.filter(n => n.tags && n.tags.some(t => t.toLowerCase() === cleanTag));
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    items.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
      const total = items.length;
      const skip = (pageNum - 1) * limitNum;
      const paginated = items.slice(skip, skip + limitNum);

      return {
        notes: paginated,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      };
    }

    return items;
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoNote.findById(id).lean();
    }
    return notesStore.findById(id);
  }

  static async findByBook(userId, bookId) {
    if (getIsMongoConnected()) {
      return await MongoNote.find({ userId, bookId }).sort({ updatedAt: -1 }).lean();
    }
    const items = notesStore.find({ userId, bookId });
    return items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  static async create(noteData) {
    if (getIsMongoConnected()) {
      const n = new MongoNote(noteData);
      return (await n.save()).toObject();
    }
    return notesStore.create({
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async updateById(id, updateData) {
    if (getIsMongoConnected()) {
      return await MongoNote.findByIdAndUpdate(
        id, 
        { ...updateData, updatedAt: new Date() }, 
        { new: true }
      ).lean();
    }
    return notesStore.findByIdAndUpdate(id, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteById(id) {
    if (getIsMongoConnected()) {
      return await MongoNote.findByIdAndDelete(id);
    }
    return notesStore.findByIdAndDelete(id);
  }
}

module.exports = { NoteRepo, MongoNote };
