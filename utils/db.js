const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.ATLAS_URI;
if (!uri) {
  throw new Error('Please define ATLAS_URI in your .env file');
}

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10, // Número máximo de conexiones en el pool
      serverSelectionTimeoutMS: 5000, // Timeout para selección de servidor
      socketTimeoutMS: 45000, // Timeout para operaciones de socket
    });
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

module.exports = { connectDB };
