/**
 * MongoDB Database Connection
 * 
 * This module handles the connection to MongoDB using Mongoose.
 * It uses the MONGODB_URI environment variable for the connection string.
 * 
 * Required environment variable:
 * - MONGODB_URI: MongoDB connection string (e.g., mongodb://localhost:27017/styledecor)
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB using the connection string from environment variables
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6+ and removed in Mongoose 9+
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;

