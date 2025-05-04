const SugerenciasPacientes = require('../models/sugerenciasPacientes');
const SugerenciasMedicos = require('../models/sugerenciasMedicos');
const SugerenciasEmpresas = require('../models/sugerenciasEmpresas');

// Controlador para sugerencias de pacientes
const createSugerenciaPaciente = async (req, res) => {
  try {
    console.log('Recibiendo sugerencia de paciente:', req.body);
    const sugerencia = await SugerenciasPacientes.create(req.body);
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
    const sugerencia = await SugerenciasMedicos.create(req.body);
    res.status(201).json(sugerencia);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para sugerencias de empresas
const createSugerenciaEmpresa = async (req, res) => {
  try {
    const sugerencia = await SugerenciasEmpresas.create(req.body);
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
