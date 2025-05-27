const router = require('express').Router();
const {
  createSugerenciaPaciente,
  createSugerenciaMedico,
  createSugerenciaEmpresa,
  getSugerenciasPacientes,
  getSugerenciasMedicos,
  getSugerenciasEmpresas,
  getSugerenciasCount,
  getSugerenciasPacientesDetalles,
  getSugerenciasMedicosDetalles,
  getSugerenciasStats,
} = require('../controllers/sugerenciasController');

// Rutas para sugerencias de pacientes
router.post('/pacientes', createSugerenciaPaciente);
router.get('/pacientes', getSugerenciasPacientes);

// Rutas para sugerencias de médicos
router.post('/medicos', createSugerenciaMedico);
router.get('/medicos', getSugerenciasMedicos);

// Rutas para sugerencias de empresas
router.post('/empresas', createSugerenciaEmpresa);
router.get('/empresas', getSugerenciasEmpresas);

// Ruta para obtener el conteo de todas las sugerencias
router.get('/count', getSugerenciasCount);
router.get('/pacientes/detalles', getSugerenciasPacientesDetalles);
router.get('/medicos/detalles', getSugerenciasMedicosDetalles);
router.get('/stats', getSugerenciasStats);

module.exports = router;
