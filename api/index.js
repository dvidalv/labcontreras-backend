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
const { sendMail } = require('./api-mail_brevo');

const app = express();
app.use(express.json());

// Middleware para logging de todas las peticiones
// app.use((req, res, next) => {
//   console.log(
//     `📥 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`,
//   );
//   console.log('📦 Body:', req.body);
//   console.log('🔗 Headers:', req.headers);
//   next();
// });

// Reemplazo temporal de la configuración de CORS para permitir todos los orígenes
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

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
    // console.log('🚫 Error de validación Celebrate:', err.joi.details);

    // Crear un mensaje más amigable basado en los errores
    const errors = err.joi.details.map((detail) => {
      const field = detail.context.label || detail.path[0];
      let message = detail.message;

      // Personalizar mensajes específicos
      switch (detail.type) {
        case 'any.required':
          if (field === 'role') {
            message = `El campo '${field}' es obligatorio. Valores válidos: admin, user, medico, guest`;
          } else {
            message = `El campo '${field}' es obligatorio`;
          }
          break;
        case 'string.min':
          message = `El campo '${field}' debe tener al menos ${detail.context.limit} caracteres`;
          break;
        case 'string.max':
          message = `El campo '${field}' debe tener como máximo ${detail.context.limit} caracteres`;
          break;
        case 'string.email':
          message = `El campo '${field}' debe ser un email válido`;
          break;
        case 'any.only':
          if (field === 'role') {
            message = `El campo 'role' debe ser uno de los siguientes: admin, user, medico, guest`;
          }
          break;
        default:
          message = detail.message;
      }

      return {
        field,
        message,
        value: detail.context.value,
      };
    });

    return res.status(400).json({
      status: 'error',
      message: 'Error de validación en los datos enviados',
      errors,
      details: err.joi.details, // Mantener detalles técnicos para debugging
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
// console.log(process.env.PORT);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');

    // Intentar conectar a MongoDB antes de iniciar el servidor
    console.log('🔌 Attempting to connect to MongoDB...');
    await connectDB();

    // Solo iniciar el servidor si la conexión a MongoDB es exitosa
    app.listen(PORT, () => {
      console.log(`✅ Server ready on port ${PORT}.`);
      console.log(`🌐 MongoDB connection established successfully`);
    });
  } catch (error) {
    console.error('❌ Failed to start server due to MongoDB connection error:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('💡 Possible solutions:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify your IP is whitelisted in MongoDB Atlas');
    console.error('   3. Check your MongoDB credentials in .env file');
    console.error('   4. Ensure your MongoDB Atlas cluster is running');
    console.error('');
    console.error(
      '🔄 Server will not start until MongoDB connection is established',
    );
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

module.exports = app;
