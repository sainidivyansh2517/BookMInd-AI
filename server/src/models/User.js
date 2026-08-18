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
    if (getIsMongoConnected()) {
      return await MongoUser.findOne({ email: email.toLowerCase() });
    }
    return usersStore.findOne({ email: email.toLowerCase() });
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoUser.findById(id);
    }
    return usersStore.findById(id);
  }

  static async create(userData) {
    if (getIsMongoConnected()) {
      const u = new MongoUser(userData);
      return await u.save();
    }
    return usersStore.create(userData);
  }

  static async updateById(id, updateData) {
    if (getIsMongoConnected()) {
      return await MongoUser.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
    }
    const updated = usersStore.findByIdAndUpdate(id, updateData);
    if (updated) {
      delete updated.passwordHash;
    }
    return updated;
  }
}

module.exports = { UserRepo, MongoUser };
