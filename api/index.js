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
const comprobantesRouter = require('../routes/comprobantes');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { imagen } = require('./cloudinaryConfig');

const { errors } = require('celebrate');
const { sendMail } = require('./api-mail');

const app = express();
app.use(express.json());

// Reemplazo temporal de la configuración de CORS para permitir todos los orígenes
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Conexión a MongoDB Atlas
connectDB();

app.use('/users', usersRouter);
app.post('/api/contact', sendMail);
app.use('/medicos', medicosRouter);
app.post('/upload', upload.single('image'), imagen);
app.use('/resultados', filemakerRouter);
app.use('/publicaciones', filemakerRouter);

app.use('/api/sugerencias', sugerenciasRouter);
app.use('/comprobantes', comprobantesRouter);
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
