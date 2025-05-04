const mongoose = require('mongoose');

// Crear una conexión específica para la base de datos de sugerencias
const connectSugerenciasDB = () => {
  const uri = process.env.ATLAS_URI;
  if (!uri) {
    throw new Error('No se encontró la variable de entorno ATLAS_URI');
  }

  // Extraer la parte base de la URI (sin la base de datos)
  const baseUri = uri.split('/').slice(0, -1).join('/');
  const sugerenciasUri = `${baseUri}/sugerencias`;

  const connection = mongoose.createConnection(sugerenciasUri, {
    wtimeoutMS: 2500,
  });

  connection.on('connected', () => {
    console.log('Conectado a la base de datos: sugerencias');
  });

  connection.on('error', (err) => {
    console.error('Error conectando a la base de datos sugerencias:', err);
  });

  return connection;
};

// Exportar la conexión
const sugerenciasConnection = connectSugerenciasDB();
module.exports = sugerenciasConnection;
