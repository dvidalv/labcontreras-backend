const express = require('express');
require('dotenv').config();
const cors = require('cors');
const usersRouter = require('../routes/users');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const sendMail = require('./api-mail');

const app = express();
app.use(express.json());

app.use(cors());
app.options('*', cors()); //habilitar las solicitudes de todas las rutas

// MongoDB Atlas connection string
const uri = process.env.ATLAS_URI; // Asegúrate de tener esta variable en tu archivo .env

// Conexión a MongoDB Atlas
(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true });
    console.log('Conexión exitosa a MongoDB Atlas');
  } catch (e) {
    console.error('Error al conectar a MongoDB Atlas', e);
  }
})();

// app.get('/', (req, res) => {
//   res.send('Hola Mundo!');
//   console.log('Hello World!');
// });

// app.use('/api/users',(req, res) => {
//   console.log(req.body);
// });

app.use('/api/users', usersRouter);
app.post('/api/contact', sendMail);

app.use(errors());
app.use((err, req, res, next) => {
  // Verifica si el error es un error de Celebrate
  if (err.joi) {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      details: err.joi.details, // Detalles del error de validación
    });
  }

  // Para otros tipos de errores, puedes decidir cómo manejarlos
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server ready on port 3001.'));

module.exports = app;
