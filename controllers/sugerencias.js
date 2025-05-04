const httpStatus = require('http-status');
const { SugerenciasPacientes } = require('../models/sugerenciasPacientes');
const { SugerenciasMedicos } = require('../models/sugerenciasMedicos');
const { SugerenciasEmpresas } = require('../models/sugerenciasEmpresas');

const createSugerenciasPacientes = async (req, res) => {
  const { nombre, opinion, mejora } = req.body;
  const sugerenciasPacientes = new SugerenciasPacientes({ nombre, opinion, mejora });
  await sugerenciasPacientes.save();
  res.status(httpStatus.CREATED).json(sugerenciasPacientes);
};

const createSugerenciasMedicos = async (req, res) => {
  const { nombre, opinion, mejora } = req.body;
  const sugerenciasMedicos = new SugerenciasMedicos({ nombre, opinion, mejora });
  await sugerenciasMedicos.save();
  res.status(httpStatus.CREATED).json(sugerenciasMedicos);
};

const createSugerenciasEmpresas = async (req, res) => {
  const { nombre, opinion, mejora } = req.body;
};

module.exports = {
  createSugerenciasPacientes,
  createSugerenciasMedicos,
  createSugerenciasEmpresas,
};
