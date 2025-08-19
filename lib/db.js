const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.ATLAS_URI;
// console.log(uri);
if (!uri) {
  throw new Error('Please define ATLAS_URI in your .env file');
}

// Conexión a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10, // Número máximo de conexiones en el pool
      serverSelectionTimeoutMS: 30000, // Aumentado a 30 segundos
      socketTimeoutMS: 45000, // Timeout para operaciones de socket
      connectTimeoutMS: 30000, // Timeout para conexión inicial
      heartbeatFrequencyMS: 10000, // Frecuencia de heartbeat
      retryWrites: true, // Retry de escrituras
      w: 'majority', // Write concern
      bufferCommands: false, // Deshabilitar buffering para fallar rápido si no hay conexión
    });
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    throw err; // Lanzar el error para que el servidor no arranque
  }
};

module.exports = connectDB;
