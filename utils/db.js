const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.ATLAS_URI;
if (!uri) {
  throw new Error('Please define ATLAS_URI in your .env file');
}

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

module.exports = { connectDB };
