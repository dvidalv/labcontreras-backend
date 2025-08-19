// test-sugerencias.js
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const SugerenciasPacientes = require('../models/sugerenciasPacientes');

dotenv.config();
dotenv.config({ path: '.env.local' });

// Reemplaza esto con tu URL de conexión de MongoDB Atlas
// Debería verse algo así:
// mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // console.log('Conectado a MongoDB Atlas');

    // Crear una nueva sugerencia
    const nuevaSugerencia = new SugerenciasPacientes({
      nombre: 'Juan',
      satisfaccion: 'satisfecho',
      mejora: 'Todo muy bien',
    });

    // Guardar la sugerencia
    return nuevaSugerencia.save();
  })
  .then((doc) => {
    // console.log('Sugerencia guardada exitosamente');
    // Cerrar la conexión después de guardar
    return mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error:', err);
    mongoose.connection.close();
  });
