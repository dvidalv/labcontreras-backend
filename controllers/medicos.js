const httpStatus = require('http-status');
const { medicosWhiteListSchema } = require('../models/medico');
const { cli } = require('winston/lib/winston/config');

const getAllMedicos = (req, res) => {
  const medicos = medicosWhiteListSchema.find({}).orFail(() => {
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    });
    return res.status(200).json({
      status: 'success',
      medicos,
    });
  });
};

module.exports = {
  getAllMedicos,
};
