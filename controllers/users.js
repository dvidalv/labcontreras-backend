const jwt = require('jsonwebtoken');
const httpStatus = require('http-status'); // Importamos el módulo http-status
const { User } = require('../models/user'); // Importamos el modelo de usuarios
const bcrypt = require('bcryptjs'); // Importamos bcryptjs
const { v2: cloudinary } = require('cloudinary'); // Importamos cloudinary v2

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // Buscamos el usuario por id
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User found',
      user,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
    });
  }
};

const createUser = async (req, res) => {
  // console.log(req.body);
  try {
    const { name, email, password, role, url } = req.body;
    const newUser = {
      name,
      email,
      password,
      role,
      url,
    };
    const hash = await bcrypt.hash(newUser.password, 10); // Hash password
    newUser.password = hash; // Asignamos la contraseña hasheada al usuario

    const user = await User.create(newUser); // Creamos el usuario en la base de datos

    return res.status(httpStatus.CREATED).json({
      // Devolvemos el usuario creado
      status: 'success',
      message: 'User created',
      user,
    });
  } catch (err) {
    // Si hay un error en la creación del usuario lo capturamos aquí y devolvemos un error
    console.log('Error:', err.name);
    if (err.name === 'ValidationError') {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid user data',
      });
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        status: 'error',
        message: 'Email already registered',
      });
    }
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
    });
  }
};

const generateAuthToken = async (user) => {
  const token = await jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
  return token;
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findUserByCredentials(email, password);
    const token = await generateAuthToken(user);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User logged in',
      token,
    });
  } catch (err) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: 'error',
      message: 'Invalid credentials',
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).orFail(() => {
      const error = new Error('No se ha encontrado ningún usuario');
      error.statusCode = 404;
      throw error;
    });
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Users found',
      users,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).orFail(() => {
      const error = new Error('No se ha encontrado ningun usuario con esa id');
      error.statusCode = 404;
      throw error;
    });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
      });
    }
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User found',
      user,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
      error: err.message,
    });
  }
};

const hasAdmin = async (req, res) => {
  try {
    const adminExists = await User.exists({ role: 'admin' });
    return res.status(httpStatus.OK).json({
      status: 'success',
      hasAdmin: !!adminExists,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error checking admin existence',
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id).orFail(() => {
      const error = new Error('No se ha encontrado ninguna tarjeta con esa id');
      error.statusCode = 404;
      throw error;
    });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
      });
    }
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User deleted',
      user,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, about } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, about },
      { new: true, runValidators: true },
    ).orFail(() => {
      const error = new Error('No se ha encontrado ninguna tarjeta con esa id');
      error.statusCode = 404;
      throw error;
    });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
      });
    }
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User updated',
      user,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
    });
  }
};

const updateUser = async (req, res) => {
  // console.log(req.body);
  try {
    const { name, tel, role, _id, url } = req.body;
    const user = await User.findByIdAndUpdate(
      _id,
      { name, tel, role, url },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
      });
    }
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User updated',
      user,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Unexpected error',
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true, runValidators: true },
    ).orFail(() => {
      const error = new Error('No se ha encontrado ninguna tarjeta con esa id');
      error.statusCode = 404;
      throw error;
    });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
      });
    }
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User updated',
      user,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',

      message: 'Unexpected error',
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    // Asegúrate de que el public_id incluya el prefijo 'avatars/'
    const fullPublicId = public_id.includes('avatars/')
      ? public_id
      : `avatars/${public_id}`;

    const result = await cloudinary.uploader.destroy(fullPublicId);
    console.log(result);
    if (result.result === 'ok') {
      res.json({ message: 'Imagen eliminada exitosamente' });
    } else {
      throw new Error('No se pudo eliminar la imagen');
    }
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    res
      .status(500)
      .json({ message: 'Error al eliminar imagen', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateProfile,
  updateAvatar,
  login,
  generateAuthToken,
  getCurrentUser,
  updateUser,
  deleteImage,
  hasAdmin,
};
