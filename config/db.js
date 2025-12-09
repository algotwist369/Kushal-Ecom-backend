const mongoose = require('mongoose');
require('colors');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    // Configure connection pool for better performance and reliability
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB;