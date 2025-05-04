const SugerenciasPacientes = require('../models/sugerenciasPacientes');
const SugerenciasMedicos = require('../models/sugerenciasMedicos');
const SugerenciasEmpresas = require('../models/sugerenciasEmpresas');
const Fingerprint = require('../models/fingerprints');

// Controlador para sugerencias de pacientes
const createSugerenciaPaciente = async (req, res) => {
  try {
    console.log('Recibiendo sugerencia de paciente:', req.body);
    console.log('Fingerprint:', req.body.fingerprint);

    // Verificar si existe un fingerprint reciente para pacientes
    const existingFingerprint = await Fingerprint.findOne({
      fingerprint: req.body.fingerprint,
      type: 'pacientes',
    });

    if (existingFingerprint) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message:
          'Por favor, espere una hora antes de enviar otra sugerencia de paciente.',
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

    console.log('Sugerencia creada:', sugerencia);
    res.status(201).json({
      mensaje: '¡Sugerencia enviada con éxito!',
      sugerencia,
    });
  } catch (error) {
    console.error('Error al crear sugerencia:', error);
    res.status(400).json({
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
          'Por favor, espere una hora antes de enviar otra sugerencia de médico.',
      });
    }

    // Crear nuevo registro de fingerprint para médicos
    await Fingerprint.create({
      fingerprint: req.body.fingerprint,
      type: 'medicos',
    });

    const { fingerprint, ...sugerenciaData } = req.body;
    const sugerencia = await SugerenciasMedicos.create(sugerenciaData);
    res.status(201).json(sugerencia);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
          'Por favor, espere una hora antes de enviar otra sugerencia de empresa.',
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
    res.status(400).json({ message: error.message });
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

module.exports = {
  createSugerenciaPaciente,
  createSugerenciaMedico,
  createSugerenciaEmpresa,
  getSugerenciasPacientes,
  getSugerenciasMedicos,
  getSugerenciasEmpresas,
};
