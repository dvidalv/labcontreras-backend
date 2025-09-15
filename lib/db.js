const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.ATLAS_URI;
// console.log(uri);
if (!uri) {
  throw new Error('Please define ATLAS_URI in your .env file');
}

let isConnected = false;

// Conexión a la base de datos
const connectDB = async () => {
  try {
    // Si ya está conectado, no intentar conectar de nuevo
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return true;
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10, // Número máximo de conexiones en el pool
      serverSelectionTimeoutMS: 30000, // Aumentado a 30 segundos
      socketTimeoutMS: 45000, // Timeout para operaciones de socket
      connectTimeoutMS: 30000, // Timeout para conexión inicial
      heartbeatFrequencyMS: 10000, // Frecuencia de heartbeat
      retryWrites: true, // Retry de escrituras
      w: 'majority', // Write concern
      bufferCommands: true, // Cambiar a true para permitir buffering hasta que se establezca la conexión
    });

    // Esperar a que la conexión esté completamente lista
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);

        // Timeout de seguridad
        setTimeout(() => {
          reject(new Error('Connection timeout after waiting for ready state'));
        }, 10000);
      }
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.error('❌ Error connecting to MongoDB:', err.message);
    throw err; // Lanzar el error para que el servidor no arranque
  }
};

// Función para verificar si está conectado
const ensureConnection = async () => {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    console.log('🔄 Reconnecting to MongoDB...');
    await connectDB();
  }
  return true;
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('🔗 MongoDB connected event fired');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('❌ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('❌ MongoDB connection error:', err);
});

module.exports = { connectDB, ensureConnection };
