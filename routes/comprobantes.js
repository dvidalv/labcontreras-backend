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
  enviarFacturaElectronica,
  consultarEstatusDocumento,
  generarCodigoQR,
  limpiarTokenCache,
  enviarEmailFactura,
  anularComprobantes,
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

// Ruta para enviar factura electrónica a TheFactoryHKA
router.post('/enviar-electronica', enviarFacturaElectronica); // POST /comprobantes/enviar-electronica - Enviar factura a TheFactoryHKA

// Ruta para consultar estatus de documento electrónico
router.post('/consultar-estatus', consultarEstatusDocumento); // POST /comprobantes/consultar-estatus - Consultar estatus en TheFactoryHKA

// Ruta para enviar email de documento electrónico vía The Factory HKA
router.post('/enviar-email', enviarEmailFactura); // POST /comprobantes/enviar-email - Enviar email de documento electrónico

// Ruta para anular comprobantes fiscales
router.post('/anular', anularComprobantes); // POST /comprobantes/anular - Anular secuencias de NCF

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

// Ruta para generar código QR según especificaciones DGII
router.post('/generar-qr', generarCodigoQR); // POST /comprobantes/generar-qr - Generar QR Code versión 8

// Ruta para limpiar cache del token (útil para debugging de problemas de autenticación)
router.post('/limpiar-token', limpiarTokenCache); // POST /comprobantes/limpiar-token - Limpiar cache del token

module.exports = router;
