const mongoose = require('mongoose');

let isMongoConnected = false;
let activeStorageMode = 'uninitialized';

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredMode = (process.env.STORAGE_MODE || '').toLowerCase().trim();

  // In production, MongoDB is strictly mandatory. Silent fallback to JSON is forbidden.
  if (configuredMode === 'json') {
    if (isProduction) {
      const errorMsg = 'FATAL SECURITY CONFIGURATION: STORAGE_MODE=json is forbidden in production. Production requires MongoDB.';
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
    isMongoConnected = false;
    activeStorageMode = 'json';
    console.log('ℹ️ STORAGE_MODE explicitly configured as "json". Using local file-backed JSON store for development.');
    return false;
  }

  const mongoUri = process.env.MONGO_URI || (!isProduction ? 'mongodb://localhost:27017/bookmind' : '');

  if (!mongoUri) {
    if (isProduction) {
      const errorMsg = 'FATAL CONFIGURATION: MONGO_URI environment variable is required in production.';
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
    // Development without MONGO_URI defaults to local json
    isMongoConnected = false;
    activeStorageMode = 'json';
    console.warn('⚠️ No MONGO_URI specified in development. Operating in explicit JSON file storage mode.');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    isMongoConnected = true;
    activeStorageMode = 'mongodb';
    console.log('✅ Connected to MongoDB database successfully.');
    return true;
  } catch (error) {
    isMongoConnected = false;
    if (isProduction || configuredMode === 'mongodb') {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      throw error;
    }

    activeStorageMode = 'json';
    console.warn(`⚠️ MongoDB connection unavailable (${error.message}). Development fallback: using local JSON storage.`);
    return false;
  }
};

const getIsMongoConnected = () => isMongoConnected;

const getStorageModeInfo = () => ({
  mode: activeStorageMode,
  isMongoConnected,
  isProduction: process.env.NODE_ENV === 'production'
});

const closeDB = async () => {
  if (isMongoConnected) {
    try {
      await mongoose.connection.close(false);
      isMongoConnected = false;
      console.log('MongoDB connection closed cleanly.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
  }
};

module.exports = {
  connectDB,
  getIsMongoConnected,
  getStorageModeInfo,
  closeDB
};
