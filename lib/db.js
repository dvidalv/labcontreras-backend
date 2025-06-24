const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.ATLAS_URI.replace(
  '<password>',
  process.env.ATLAS_PASSWORD,
);

// Conexión a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Número máximo de conexiones en el pool
      serverSelectionTimeoutMS: 5000, // Timeout para selección de servidor
      socketTimeoutMS: 45000, // Timeout para operaciones de socket
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
