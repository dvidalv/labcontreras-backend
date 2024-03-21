const httpStatus = require('http-status');
const bcrypt = require('bcrypt');
// Asegúrate de importar correctamente el modelo
const { MedicosWhiteList } = require('../models/medicosWhiteList');
const { Medico } = require('../models/medico');
const { cli } = require('winston/lib/winston/config');

const getAllMedicosWhiteList = async (req, res) => {
  try {
    const medicos = await MedicosWhiteList.find({});
    // console.log('Medicos:', medicos);
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
    // console.log('Medicos:', medicos);
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

// const createMedico = async (req, res) => {
//   try {
//     const { nombre, apellido, especialidad, telefono, celular, email, password, url } = req.body;
//     const medico = new Medico({ nombre, apellido, especialidad, telefono, celular, email, password, url });
//     await medico.save();
//     return res.status(httpStatus.CREATED).json({ message: 'Medico creado correctamente', medico });
//   } catch (error) {
//     console.log(error);
//     return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message});
//   }
// };

const createMedico = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      especialidad,
      telefono,
      celular,
      email,
      password,
      url,
    } = req.body;
    // Encriptar el password antes de guardarlo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const medico = new Medico({
      nombre,
      apellido,
      especialidad,
      telefono,
      celular,
      email,
      password: hashedPassword,
      url,
    });
    await medico.save();
    return res
      .status(httpStatus.CREATED)
      .json({ message: 'Medico creado correctamente', medico });
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const updateMedico = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body }; //
    delete updateData.password; // Excluye la contraseña de los datos de actualización

    const medico = await Medico.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!medico) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Médico no encontrado' });
    }
    return res.status(httpStatus.OK).json(medico);
  } catch (error) {
    console.error('Error al actualizar el médico:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error al actualizar el médico' });
  }
};

const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body; // La contraseña proporcionada por el usuario en el formulario

    const medico = await Medico.findById(id).select('+password');
    if (!medico) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Médico no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, medico.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({
          message: 'Contraseña incorrecta',
          status: httpStatus.UNAUTHORIZED,
        });
    }

    // Si la contraseña coincide, procede con la actualización
    next();
  } catch (error) {
    console.error('Error al verificar el usuario:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error al verificar el usuario' });
  }
};

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
  updateMedico,
  deleteMedico,
  verifyUser,
};
