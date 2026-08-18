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

const MongoNote = mongoose.model('Note', noteSchema);

class NoteRepo {
  static async findByUser(userId, query = {}) {
    if (getIsMongoConnected()) {
      const filter = { userId, ...query };
      return await MongoNote.find(filter).sort({ updatedAt: -1 });
    }
    const items = notesStore.find({ userId, ...query });
    return items.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoNote.findById(id);
    }
    return notesStore.findById(id);
  }

  static async findByBook(userId, bookId) {
    if (getIsMongoConnected()) {
      return await MongoNote.find({ userId, bookId }).sort({ updatedAt: -1 });
    }
    const items = notesStore.find({ userId, bookId });
    return items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  static async create(noteData) {
    if (getIsMongoConnected()) {
      const n = new MongoNote(noteData);
      return await n.save();
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
      );
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
