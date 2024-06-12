const express = require('express');
require('dotenv').config();
const cors = require('cors');
const usersRouter = require('../routes/users');
const medicosRouter = require('../routes/medicos');
const filemakerRouter = require('../routes/fileMaker');
const { getFilemakerToken } = require('../controllers/filemaker-server');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { imagen } = require('./cloudinaryConfig');

const mongoose = require('mongoose');
const { errors } = require('celebrate');
const sendMail = require('./api-mail');

const app = express();
app.use(express.json());

const corsOptions = {
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://www.contrerasrobledo.com',
    'https://contrerasrobledo.com',
    'https://www.server-lpcr.com.do',
    'server-lpcr.local',
  ], // Permite solicitudes de cualquier origen
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
  preflightContinue: false,
  optionsSuccessStatus: 204, // Algunos navegadores antiguos (IE11, varios SmartTVs) se bloquean en 204
};

app.use(cors(corsOptions));

// Habilita pre-flight requests para todas las rutas
app.options('*', cors(corsOptions));

// MongoDB Atlas connection string
const uri = process.env.ATLAS_URI; // Asegúrate de tener esta variable en tu archivo .env

// Conexión a MongoDB Atlas
(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true });
    console.log('Conexión exitosa a MongoDB Atlas');
    console.log(mongoose.connection.name);
  } catch (e) {
    console.error('Error al conectar a MongoDB Atlas', e);
  }
})();

const token = getFilemakerToken();
console.log(token);

app.use('/users', usersRouter);
app.post('/api/contact', sendMail);
app.use('/medicos', medicosRouter);
app.post('/upload', upload.single('image'), imagen);
app.use('/filemaker', filemakerRouter);

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
