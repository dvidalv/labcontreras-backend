require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const sugerenciasRoutes = require('./routes/sugerencias');

const app = express();

// Configurar CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Ajusta según tu frontend
    credentials: true,
  }),
);

// Conectar a MongoDB Atlas
connectDB();

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/sugerencias', sugerenciasRoutes);

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
