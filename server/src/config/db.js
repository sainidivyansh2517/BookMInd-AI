const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bookmind';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB database successfully.');
  } catch (error) {
    isMongoConnected = false;
    console.log(`ℹ️ MongoDB connection fallback (Reason: ${error.message}). Using local file-backed JSON engine.`);
  }
};

const getIsMongoConnected = () => isMongoConnected;

module.exports = { connectDB, getIsMongoConnected };
