const jwt = require('jsonwebtoken');
const httpStatus = require('http-status'); // Importamos el módulo http-status
const { User } = require('../models/user'); // Importamos el modelo de usuarios
const bcrypt = require('bcryptjs'); // Importamos bcryptjs
const { v2: cloudinary } = require('cloudinary'); // Importamos cloudinary v2
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar que el email existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'No existe un usuario con ese correo electrónico',
      });
    }

    // Generar token de recuperación (expira en 1 hora)
    const resetToken = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    console.log(process.env.NODE_ENV);
    console.log(process.env.FRONTEND_URL_PROD);
    console.log(process.env.FRONTEND_URL_DEV);

    // Determinar la URL base según el entorno
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL_PROD
        : process.env.FRONTEND_URL_DEV;

    console.log('baseUrl', baseUrl);

    // Enviar email con el link de recuperación
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    const msg = {
      to: email,
      from: 'servicios@contrerasrobledo.com.do',
      subject: 'Recuperación de Contraseña',
      content: [
        {
          type: 'text/html',
          value: `
          <h1>Recuperación de Contraseña</h1>
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="${resetUrl}">Restablecer Contraseña</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `,
        },
      ],
    };

    await sgMail.send(msg);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message:
        'Se ha enviado un correo con las instrucciones para recuperar tu contraseña',
      data: {
        email: user.email,
        expiresIn: '1h',
        emailSent: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error al procesar la solicitud de recuperación de contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verificar token y obtener id del usuario
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id;

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    );

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Usuario no encontrado',
      });
    }

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: 'error',
        message: 'El enlace de recuperación ha expirado',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: 'error',
        message: 'Token inválido',
      });
    }
    console.error('Error en resetPassword:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error al restablecer la contraseña',
    });
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
  forgotPassword,
  resetPassword,
};
