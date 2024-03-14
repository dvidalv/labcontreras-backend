const httpStatus = require('http-status');
// Asegúrate de importar correctamente el modelo
const { MedicosWhiteList } = require('../models/medicosWhiteList');
const { Medico } = require('../models/medico');

const getAllMedicosWhiteList = async (req, res) => {
  try {
    const medicos = await MedicosWhiteList.find({});
    // console.log('Medicos:', medicos);
    return res.status(httpStatus.OK).json(medicos);
  } catch (error) {
    console.error('Error al obtener los médicos:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al obtener los médicos' });
  }
};

const getAllMedicos = async (req, res) => {
  try {
    const medicos = await Medico.find({});
    // console.log('Medicos:', medicos);
    return res.status(httpStatus.OK).json(medicos);
  } catch (error) {
    console.error('Error al obtener los médicos:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al obtener los médicos' });
  }
}

module.exports = {
  getAllMedicosWhiteList,
  getAllMedicos,
};
