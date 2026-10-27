const mongoose = require('mongoose');
const { usersStore } = require('../config/storage');
const { getIsMongoConnected } = require('../config/db');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  readingGoal: { type: Number, default: 24 },
  favoriteGenres: [{ type: String }],
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', userSchema);

class UserRepo {
  static async findByEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const cleanEmail = email.toLowerCase().trim();
    if (getIsMongoConnected()) {
      return await MongoUser.findOne({ email: cleanEmail });
    }
    return usersStore.findOne({ email: cleanEmail });
  }

  static async findById(id) {
    if (!id) return null;
    if (getIsMongoConnected()) {
      return await MongoUser.findById(id).select('-passwordHash');
    }
    const user = usersStore.findById(id);
    if (user) {
      const copy = { ...user };
      delete copy.passwordHash;
      return copy;
    }
    return null;
  }

  static async create(userData) {
    const cleanData = {
      ...userData,
      email: userData.email ? userData.email.toLowerCase().trim() : ''
    };
    if (getIsMongoConnected()) {
      const u = new MongoUser(cleanData);
      return await u.save();
    }
    return usersStore.create(cleanData);
  }

  static async updateById(id, updateData) {
    // Prevent overriding sensitive auth credentials via general update
    const sanitized = { ...updateData };
    delete sanitized.passwordHash;
    delete sanitized.email;
    delete sanitized._id;
    delete sanitized.id;

    if (getIsMongoConnected()) {
      return await MongoUser.findByIdAndUpdate(id, sanitized, { new: true }).select('-passwordHash');
    }
    const updated = usersStore.findByIdAndUpdate(id, sanitized);
    if (updated) {
      delete updated.passwordHash;
    }
    return updated;
  }
}

module.exports = { UserRepo, MongoUser };
