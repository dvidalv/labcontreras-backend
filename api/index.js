const express = require('express');
const connectDB = require('../lib/db');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config(); // Carga .env
dotenv.config({ path: '.env.local' }); // Carga .env.local (sobrescribe valores de .env)

const cors = require('cors');
const usersRouter = require('../routes/users');
const medicosRouter = require('../routes/medicos');
const filemakerRouter = require('../routes/fileMaker');
const sugerenciasRouter = require('../routes/sugerencias');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { imagen } = require('./cloudinaryConfig');

const { errors } = require('celebrate');
const { sendMail } = require('./api-mail');

const app = express();
app.use(express.json());

const allowedOrigins = [
  'https://www.contrerasrobledo.com',
  'https://contrerasrobledo.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como las aplicaciones móviles o postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Agregar después de app.use(cors(corsOptions))
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS Error: Origin not allowed',
      origin: req.headers.origin,
    });
  }
  next(err);
});

// Habilita pre-flight requests para todas las rutas
app.options('*', cors(corsOptions));

// Conexión a MongoDB Atlas
connectDB();

app.use('/users', usersRouter);
app.post('/api/contact', sendMail);
app.use('/medicos', medicosRouter);
app.post('/upload', upload.single('image'), imagen);
app.use('/resultados', filemakerRouter);
app.use('/publicaciones', filemakerRouter);

app.use('/api/sugerencias', sugerenciasRouter);
app.use('/api/contact', sendMail);

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
console.log(process.env.PORT);
app.listen(PORT, () => console.log(`Server ready on port ${PORT}.`));

module.exports = app;
