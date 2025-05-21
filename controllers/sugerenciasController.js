const SugerenciasPacientes = require('../models/sugerenciasPacientes');
const SugerenciasMedicos = require('../models/sugerenciasMedicos');
const SugerenciasEmpresas = require('../models/sugerenciasEmpresas');
const Fingerprint = require('../models/fingerprints');

// Controlador para sugerencias de pacientes
const createSugerenciaPaciente = async (req, res) => {
  try {
    // Verificar si existe un fingerprint reciente para pacientes
    const existingFingerprint = await Fingerprint.findOne({
      fingerprint: req.body.fingerprint,
      type: 'pacientes',
    });

    if (existingFingerprint) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message:
          'Por favor, espere una hora antes de responder otra encuesta de satisfacción.',
      });
    }

    // Crear nuevo registro de fingerprint para pacientes
    await Fingerprint.create({
      fingerprint: req.body.fingerprint,
      type: 'pacientes',
    });

    // Crear la sugerencia
    const { fingerprint, ...sugerenciaData } = req.body;
    const sugerencia = await SugerenciasPacientes.create(sugerenciaData);

    res.status(201).json({
      mensaje: '¡Sugerencia enviada con éxito!',
      sugerencia,
    });
  } catch (error) {
    console.error('Error al crear sugerencia:', error);
    res.status(400).json({
      error: 'BAD_REQUEST',
      message: error.message || 'Error al crear la sugerencia',
    });
  }
};

// Controlador para sugerencias de médicos
const createSugerenciaMedico = async (req, res) => {
  try {
    // Verificar si existe un fingerprint reciente para médicos
    const existingFingerprint = await Fingerprint.findOne({
      fingerprint: req.body.fingerprint,
      type: 'medicos',
    });

    if (existingFingerprint) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message:
          'Por favor, espere una hora antes de responder otra encuesta de satisfacción.',
      });
    }

    // Crear nuevo registro de fingerprint para médicos
    await Fingerprint.create({
      fingerprint: req.body.fingerprint,
      type: 'medicos',
    });

    const { fingerprint, ...sugerenciaData } = req.body;
    console.log('sugerenciaData', sugerenciaData);
    const sugerencia = await SugerenciasMedicos.create(sugerenciaData);
    res.status(201).json({
      mensaje: '¡Sugerencia enviada con éxito!',
      sugerencia,
    });
  } catch (error) {
    res.status(400).json({
      error: 'BAD_REQUEST',
      message: error.message || 'Error al crear la sugerencia',
    });
  }
};

// Controlador para sugerencias de empresas
const createSugerenciaEmpresa = async (req, res) => {
  try {
    // Verificar si existe un fingerprint reciente para empresas
    const existingFingerprint = await Fingerprint.findOne({
      fingerprint: req.body.fingerprint,
      type: 'empresas',
    });

    if (existingFingerprint) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message:
          'Por favor, espere una hora antes de responder otra encuesta de satisfacción.',
      });
    }

    // Crear nuevo registro de fingerprint para empresas
    await Fingerprint.create({
      fingerprint: req.body.fingerprint,
      type: 'empresas',
    });

    const { fingerprint, ...sugerenciaData } = req.body;
    const sugerencia = await SugerenciasEmpresas.create(sugerenciaData);
    res.status(201).json(sugerencia);
  } catch (error) {
    res.status(400).json({
      error: 'BAD_REQUEST',
      message: error.message || 'Error al crear la sugerencia',
    });
  }
};

// Obtener todas las sugerencias por tipo
const getSugerenciasPacientes = async (req, res) => {
  try {
    const sugerencias = await SugerenciasPacientes.find();
    res.json(sugerencias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSugerenciasMedicos = async (req, res) => {
  try {
    const sugerencias = await SugerenciasMedicos.find();
    res.json(sugerencias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSugerenciasEmpresas = async (req, res) => {
  try {
    const sugerencias = await SugerenciasEmpresas.find();
    res.json(sugerencias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener el conteo de todas las sugerencias
const getSugerenciasCount = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const query = {};

    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      if (fechaDesde) query.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fecha.$lte = new Date(fechaHasta);
    }

    const counts = {
      pacientes: await SugerenciasPacientes.countDocuments(query),
      medicos: await SugerenciasMedicos.countDocuments(query),
      empresas: await SugerenciasEmpresas.countDocuments(query),
    };

    res.json(counts);
  } catch (error) {
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error al obtener el conteo de sugerencias',
    });
  }
};

const getSugerenciasPacientesDetalles = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const query = {};

    if (fechaDesde || fechaHasta) {
      const desde = new Date(fechaDesde);
      const hasta = new Date(fechaHasta);
      hasta.setDate(hasta.getDate() + 1);

      query.fecha = {
        $gte: desde,
        $lt: hasta,
      };
    }

    const sugerencias = await SugerenciasPacientes.find(query);
    res.json(sugerencias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSugerenciasMedicosDetalles = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const query = {};

    if (fechaDesde || fechaHasta) {
      const desde = new Date(fechaDesde);
      const hasta = new Date(fechaHasta);
      hasta.setDate(hasta.getDate() + 1);

      query.fecha = {
        $gte: desde,
        $lt: hasta,
      };
    }

    const sugerencias = await SugerenciasMedicos.find(query);
    res.json(sugerencias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSugerenciaPaciente,
  createSugerenciaMedico,
  createSugerenciaEmpresa,
  getSugerenciasPacientes,
  getSugerenciasMedicos,
  getSugerenciasEmpresas,
  getSugerenciasCount,
  getSugerenciasPacientesDetalles,
  getSugerenciasMedicosDetalles,
};
