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

const getMedicoById = async (req, res) => {
  try {
    const { id } = req.params;
    const medico = await Medico.findById(id);
    if (!medico) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Medico no encontrado' });
    }
    return res.status(httpStatus.OK).json(medico);
  } catch (error) {
    console.error('Error al obtener el médico:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al obtener el médico' });
  }
};

const createMedico = async (req, res) => {
  try {
    const { nombre, apellido, especialidad, telefono, celular, email, password, url } = req.body;
    const medico = new Medico({ nombre, apellido, especialidad, telefono, celular, email, password, url });
    await medico.save();
    return res.status(httpStatus.CREATED).json({ message: 'Medico creado correctamente', medico });
  } catch (error) {
    console.log(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message});
  }
};

const updateMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('updateData:', updateData);
    const medico = await Medico.findByIdAndUpdate(id, updateData, { new: true });
    console.log('Medico actualizado:', medico);
    if (!medico) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Medico no encontrado' });
    }
    return res.status(httpStatus.OK).json(medico);
  } catch (error) {
    console.error('Error al actualizar el médico:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al actualizar el médico' });
  }
};

const deleteMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const medico = await Medico.findByIdAndDelete(id);
    if (!medico) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Medico no encontrado' });
    }
    return res.status(httpStatus.OK).json({ message: 'Medico eliminado' });
  } catch (error) {
    console.error('Error al eliminar el médico:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al eliminar el médico' });
  }
};

module.exports = {
  getAllMedicosWhiteList,
  getAllMedicos,
  getMedicoById,
  createMedico,
  updateMedico,
  deleteMedico,
};
