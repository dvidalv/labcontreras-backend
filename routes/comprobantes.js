const { Router } = require('express');
const authenticateToken = require('../middlewares/auth');
const {
  createComprobante,
  getAllComprobantes,
  getComprobanteById,
  updateComprobante,
  updateComprobanteEstado,
  deleteComprobante,
  getComprobantesStats,
  consumirNumero,
  consumirNumeroPorRnc,
} = require('../controllers/comprobantes');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales
router
  .route('/')
  .get(getAllComprobantes) // GET /comprobantes - Obtener todos los rangos del usuario
  .post(createComprobante); // POST /comprobantes - Crear nuevo rango de numeración

// Ruta para estadísticas
router.get('/stats', getComprobantesStats); // GET /comprobantes/stats - Obtener estadísticas de rangos

// Ruta para consumir número por RNC y tipo de comprobante
router.post('/consumir', consumirNumeroPorRnc); // POST /comprobantes/consumir - Consumir número por RNC y tipo

// Rutas específicas por ID
router
  .route('/:id')
  .get(getComprobanteById) // GET /comprobantes/:id - Obtener rango por ID
  .put(updateComprobante) // PUT /comprobantes/:id - Actualizar rango
  .delete(deleteComprobante); // DELETE /comprobantes/:id - Eliminar rango

// Ruta para cambiar solo el estado
router.patch('/:id/estado', updateComprobanteEstado); // PATCH /comprobantes/:id/estado - Cambiar estado del rango

// Ruta para consumir un número del rango (usando ID)
router.post('/:id/consumir', consumirNumero); // POST /comprobantes/:id/consumir - Consumir número

module.exports = router;
