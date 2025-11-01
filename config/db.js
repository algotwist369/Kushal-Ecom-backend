const mongoose = require('mongoose');
require('colors');
require('dotenv').config();

console.log("MONGODB_URI --> ", process.env.MONGODB_URI);
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB;