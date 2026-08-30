const mongoose = require('mongoose');
const { chatsStore } = require('../config/storage');
const { getIsMongoConnected } = require('../config/db');

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  bookId: { type: String, default: null, index: true }, // Null for global assistant
  title: { type: String, default: 'New Conversation' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for user chats
chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.index({ userId: 1, bookId: 1 });

const MongoChat = mongoose.model('Chat', chatSchema);

class ChatRepo {
  static async findByUser(userId, bookId = null) {
    if (getIsMongoConnected()) {
      const filter = { userId };
      if (bookId) filter.bookId = bookId;
      return await MongoChat.find(filter)
        .sort({ updatedAt: -1 })
        .slice('messages', -30) // Bounded recent messages
        .lean();
    }
    const query = { userId };
    if (bookId) query.bookId = bookId;
    const items = chatsStore.find(query);
    return items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoChat.findById(id).lean();
    }
    return chatsStore.findById(id);
  }

  static async create(chatData) {
    if (getIsMongoConnected()) {
      const c = new MongoChat(chatData);
      return (await c.save()).toObject();
    }
    return chatsStore.create({
      ...chatData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Atomic message append
  static async appendMessages(id, newMessages) {
    const messagesArray = Array.isArray(newMessages) ? newMessages : [newMessages];
    const now = new Date();

    if (getIsMongoConnected()) {
      return await MongoChat.findByIdAndUpdate(
        id,
        {
          $push: { messages: { $each: messagesArray } },
          $set: { updatedAt: now }
        },
        { new: true }
      ).lean();
    }

    const chat = chatsStore.findById(id);
    if (!chat) return null;
    const existing = chat.messages || [];
    return chatsStore.findByIdAndUpdate(id, {
      messages: [...existing, ...messagesArray],
      updatedAt: now.toISOString()
    });
  }

  static async updateMessages(id, messages) {
    if (getIsMongoConnected()) {
      return await MongoChat.findByIdAndUpdate(
        id,
        { messages, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    return chatsStore.findByIdAndUpdate(id, {
      messages,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteById(id) {
    if (getIsMongoConnected()) {
      return await MongoChat.findByIdAndDelete(id);
    }
    return chatsStore.findByIdAndDelete(id);
  }
}

module.exports = { ChatRepo, MongoChat };
