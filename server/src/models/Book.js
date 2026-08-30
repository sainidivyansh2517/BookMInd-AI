const mongoose = require('mongoose');
const { booksStore } = require('../config/storage');
const { getIsMongoConnected } = require('../config/db');

const bookSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  openLibraryId: { type: String, default: '' },
  title: { type: String, required: true },
  authors: [{ type: String }],
  coverUrl: { type: String, default: '' },
  publishYear: { type: Number },
  totalPages: { type: Number, default: 0 },
  progressPages: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['want_to_read', 'currently_reading', 'completed'], 
    default: 'want_to_read' 
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  review: { type: String, default: '' },
  genres: [{ type: String }],
  description: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Compound indexes for high-frequency user-scoped queries
bookSchema.index({ userId: 1, status: 1 });
bookSchema.index({ userId: 1, addedAt: -1 });
bookSchema.index({ userId: 1, rating: -1 });

const MongoBook = mongoose.model('Book', bookSchema);

class BookRepo {
  static async findByUser(userId, options = {}) {
    // If options is plain query object (legacy usage) or advanced options
    const { status, search, sort, page, limit, projection } = options;

    if (getIsMongoConnected()) {
      const filter = { userId };
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { title: regex },
          { authors: regex },
          { genres: regex }
        ];
      }

      let sortOption = { addedAt: -1 };
      if (sort === 'title') sortOption = { title: 1 };
      else if (sort === 'author') sortOption = { 'authors.0': 1 };
      else if (sort === 'rating') sortOption = { rating: -1, addedAt: -1 };

      let queryBuilder = MongoBook.find(filter, projection || null).sort(sortOption).lean();

      if (page && limit) {
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [books, total] = await Promise.all([
          queryBuilder.skip(skip).limit(limitNum),
          MongoBook.countDocuments(filter)
        ]);

        return {
          books,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        };
      }

      return await queryBuilder;
    }

    // Fallback JSON store
    let items = booksStore.find({ userId });

    if (status && status !== 'all') {
      items = items.filter(b => b.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.authors && b.authors.some(a => a.toLowerCase().includes(q))) ||
        (b.genres && b.genres.some(g => g.toLowerCase().includes(q)))
      );
    }

    if (sort === 'title') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sort === 'author') {
      items.sort((a, b) => ((a.authors && a.authors[0]) || '').localeCompare((b.authors && b.authors[0]) || ''));
    } else if (sort === 'rating') {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      items.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
      const total = items.length;
      const skip = (pageNum - 1) * limitNum;
      const paginated = items.slice(skip, skip + limitNum);

      return {
        books: paginated,
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
      return await MongoBook.findById(id).lean();
    }
    return booksStore.findById(id);
  }

  static async create(bookData) {
    if (getIsMongoConnected()) {
      const b = new MongoBook(bookData);
      return (await b.save()).toObject();
    }
    return booksStore.create({
      ...bookData,
      addedAt: new Date().toISOString()
    });
  }

  static async updateById(id, updateData) {
    if (getIsMongoConnected()) {
      return await MongoBook.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
    return booksStore.findByIdAndUpdate(id, updateData);
  }

  static async deleteById(id) {
    if (getIsMongoConnected()) {
      return await MongoBook.findByIdAndDelete(id);
    }
    return booksStore.findByIdAndDelete(id);
  }
}

module.exports = { BookRepo, MongoBook };
