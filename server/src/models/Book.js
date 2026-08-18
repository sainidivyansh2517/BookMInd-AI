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

const MongoBook = mongoose.model('Book', bookSchema);

class BookRepo {
  static async findByUser(userId, query = {}) {
    if (getIsMongoConnected()) {
      const filter = { userId, ...query };
      return await MongoBook.find(filter).sort({ addedAt: -1 });
    }
    const items = booksStore.find({ userId, ...query });
    return items.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoBook.findById(id);
    }
    return booksStore.findById(id);
  }

  static async create(bookData) {
    if (getIsMongoConnected()) {
      const b = new MongoBook(bookData);
      return await b.save();
    }
    return booksStore.create({
      ...bookData,
      addedAt: new Date().toISOString()
    });
  }

  static async updateById(id, updateData) {
    if (getIsMongoConnected()) {
      return await MongoBook.findByIdAndUpdate(id, updateData, { new: true });
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
