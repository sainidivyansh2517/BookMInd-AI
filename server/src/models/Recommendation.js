const mongoose = require('mongoose');
const { recommendationsStore } = require('../config/storage');
 const { getIsMongoConnected } = require('../config/db');

const recommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  recommendations: [{
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, default: 'Recommended' },
    reason: { type: String, required: true }
  }],
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// TTL index to auto-cleanup expired recommendations in MongoDB
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MongoRecommendation = mongoose.model('Recommendation', recommendationSchema);

class RecommendationRepo {
  static async findByUser(userId) {
    const now = new Date();
    if (getIsMongoConnected()) {
      const cached = await MongoRecommendation.findOne({
        userId,
        expiresAt: { $gt: now }
      }).lean();
      return cached;
    }

    const cached = recommendationsStore.findOne({ userId });
    if (!cached) return null;
    if (new Date(cached.expiresAt) <= now) {
      recommendationsStore.findByIdAndDelete(cached._id || cached.id);
      return null;
    }
    return cached;
  }

  static async saveRecommendations(userId, recommendations, ttlHours = 12) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    if (getIsMongoConnected()) {
      return await MongoRecommendation.findOneAndUpdate(
        { userId },
        { recommendations, generatedAt: now, expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
    }

    const existing = recommendationsStore.findOne({ userId });
    if (existing) {
      return recommendationsStore.findByIdAndUpdate(existing._id || existing.id, {
        recommendations,
        generatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      });
    }

    return recommendationsStore.create({
      userId,
      recommendations,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    });
  }

  static async invalidateUser(userId) {
    if (getIsMongoConnected()) {
      return await MongoRecommendation.deleteMany({ userId });
    }
    return recommendationsStore.deleteMany({ userId });
  }
}

module.exports = { RecommendationRepo, MongoRecommendation };
