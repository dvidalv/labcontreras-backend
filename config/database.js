const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.ATLAS_URI;
    if (!uri) {
      throw new Error('No se encontró la variable de entorno ATLAS_URI');
    }

    await mongoose.connect(uri, {
      wtimeoutMS: 2500,
    });
    console.log('Conexión exitosa a MongoDB Atlas');
  } catch (error) {
    console.error('Error conectando a MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
