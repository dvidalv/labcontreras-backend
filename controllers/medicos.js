const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
// Asegúrate de importar correctamente el modelo
const { MedicosWhiteList } = require('../models/medicosWhiteList');
const { Medico } = require('../models/medico');
const { cli } = require('winston/lib/winston/config');

// const bcrypt = require('bcryptjs');
// const { Medico } = require('../models/medico');

const getAllMedicosWhiteList = async (req, res) => {
  try {
    const medicos = await MedicosWhiteList.find({});
    return res.status(httpStatus.OK).json(medicos);
  } catch (error) {
    console.error('Error al obtener los médicos:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error al obtener los médicos' });
  }
};

const getAllMedicos = async (req, res) => {
  try {
    const medicos = await Medico.find({});
    return res.status(httpStatus.OK).json(medicos);
  } catch (error) {
    console.error('Error al obtener los médicos:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error al obtener los médicos' });
  }
};

const getMedicoById = async (req, res) => {
  try {
    const { id } = req.params;
    const medico = await Medico.findById(id);
    if (!medico) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Medico no encontrado' });
    }
    return res.status(httpStatus.OK).json(medico);
  } catch (error) {
    console.error('Error al obtener el médico:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error al obtener el médico' });
  }
};

const createMedico = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      especialidad,
      telefono,
      celular,
      email,
      url,
    } = req.body;
    const medico = new Medico({
      nombre,
      apellido,
      especialidad,
      telefono,
      celular,
      email,
      url,
    });
    console.log(medico);

    await medico.save();
    return res
      .status(httpStatus.CREATED)
      .json({ message: 'Medico creado correctamente', medico });
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message, error: 'E11000' });
  }
};

// Middleware para verificar la identidad del médico
async function verifyIdentity(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const medico = await Medico.findById(id).select('+password');
    if (!medico) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, medico.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    //   // Si la contraseña coincide, procede al siguiente middleware
    next();
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Error al verificar la identidad del médico',
        error: error.message,
      });
  }
}

// Función para actualizar un médico
async function editMedico(req, res) {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    delete updateData.password; // Excluye la contraseña de los datos de actualización

    const medico = await Medico.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!medico) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }
    res.status(200).json({ message: 'Médico actualizado con éxito', medico });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error al actualizar el médico', error: error.message });
  }
}

const deleteMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const medico = await Medico.findByIdAndDelete(id);
    if (!medico) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Medico no encontrado' });
    }
    return res.status(httpStatus.OK).json({ message: 'Medico eliminado' });
  } catch (error) {
    console.error('Error al eliminar el médico:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error al eliminar el médico' });
  }
};

module.exports = {
  getAllMedicosWhiteList,
  getAllMedicos,
  getMedicoById,
  createMedico,
  deleteMedico,
  editMedico,
  verifyIdentity,
};
