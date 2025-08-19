const jwt = require('jsonwebtoken');
const httpStatus = require('http-status'); // Importamos el módulo http-status
const { User } = require('../models/user'); // Importamos el modelo de usuarios
const bcrypt = require('bcryptjs'); // Importamos bcryptjs
const { v2: cloudinary } = require('cloudinary'); // Importamos cloudinary v2
const { sendEmail } = require('../api/api-mail_brevo');
require('dotenv').config();

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
  // console.log('🔍 Datos recibidos en createUser:', req.body);
  try {
    const { name, email, password, role, url } = req.body;
    const newUser = {
      name,
      email,
      password,
      role,
      url,
      isDisabled: false,
      isVerified: false,
      isAdmin: false,
      token: null,
      tokenExpires: null,
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
    // console.log('❌ Error completo:', err);
    // console.log('❌ Error name:', err.name);
    // console.log('❌ Error message:', err.message);
    if (err.name === 'ValidationError') {
      // Extraer errores específicos de validación de MongoDB
      const errors = Object.keys(err.errors).map((field) => ({
        field,
        message: err.errors[field].message,
        value: err.errors[field].value,
      }));

      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Error de validación en los datos del usuario',
        errors,
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

const updateStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isDisabled: status },
      { new: true },
    );

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

const generateAuthToken = async (user) => {
  const token = await jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
  return token;
};

const login = async (req, res) => {
  // console.log('🔍 Datos recibidos en login:', req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findUserByCredentials(email, password);
    // console.log('🔍 Usuario encontrado:', user);
    const token = await generateAuthToken(user);
    // console.log('🔍 Token generado:', token);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'User logged in',
      token,
      user,
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
    // console.log('🔍 Datos recibidos en forgotPassword:', req.body);
    // console.log('🔍 Email:', email);

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

    // Determinar la URL base según el entorno
    // Si hay un header Host que indica localhost, usar URL de desarrollo
    const isLocalhost =
      req.get('host') && req.get('host').includes('localhost');
    const useDevUrl = process.env.NODE_ENV !== 'production' || isLocalhost;

    const baseUrl = useDevUrl
      ? process.env.FRONTEND_URL_DEV || 'http://localhost:3000'
      : process.env.FRONTEND_URL_PROD;

    console.log(`🔗 Generando URL de recuperación para: ${baseUrl}`);

    // Enviar email con el link de recuperación (asegurando que no haya doble slash)
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #003366 0%, #0056b3 100%); padding: 30px; text-align: center; color: white;">
          <h1>🔐 Recuperación de Contraseña</h1>
          <p>Lab Contreras - Sistema de Gestión</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <p style="font-size: 16px; color: #333;">Hola,</p>
          <p style="color: #666;">Has solicitado restablecer tu contraseña en el sistema de Lab Contreras.</p>
          <p style="color: #666;">Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,123,255,0.3);">
              Restablecer Contraseña
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ <strong>Importante:</strong> Este enlace expirará en 1 hora por seguridad.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
              <strong>URL alternativa:</strong><br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; background-color: #003366; color: white;">
          <p style="margin: 0; font-size: 12px;">© Lab Contreras - Sistema de Gestión</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña - Lab Contreras',
      htmlContent,
      textContent: `Recuperación de Contraseña - Lab Contreras

Has solicitado restablecer tu contraseña.

Enlace para restablecer: ${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo.`,
    });

    return res.status(httpStatus.OK).json({
      status: 'success',
      message:
        'Se ha enviado un correo con las instrucciones para recuperar tu contraseña',
      data: {
        email: user.email,
        expiresIn: '1h',
        emailSent: true,
        resetUrl: resetUrl, // Incluimos la URL en la respuesta para debugging
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

const sendInvitationEmail = async (req, res) => {
  try {
    const { email, name, password, isExistingUser } = req.body;

    // Si es un usuario existente, no necesitamos verificar si existe
    if (!isExistingUser) {
      // Validar que el email existe solo para nuevos usuarios
      const user = await User.findOne({ email });
      if (user) {
        return res.status(httpStatus.CONFLICT).json({
          status: 'error',
          message: 'El correo electrónico ya está registrado',
        });
      }
    }

    // Determinar la URL base según el entorno
    // Si hay un header Host que indica localhost, usar URL de desarrollo
    const isLocalhost =
      req.get('host') && req.get('host').includes('localhost');
    const useDevUrl = process.env.NODE_ENV !== 'production' || isLocalhost;

    const baseUrl = useDevUrl
      ? process.env.FRONTEND_URL_DEV || 'http://localhost:3000'
      : process.env.FRONTEND_URL_PROD;

    const loginUrl = `${baseUrl.replace(/\/$/, '')}/signin`;

    console.log(`🔗 Generando URL de invitación para: ${baseUrl}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #003366 0%, #0056b3 100%); padding: 30px; text-align: center; color: white;">
          <h1>👋 Bienvenido a Lab Contreras</h1>
          <p>Sistema de Gestión Laboratorial</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <p style="font-size: 18px; color: #333;">¡Hola ${name}!</p>
          <p style="color: #666;">Has sido invitado a unirte al sistema de gestión de Lab Contreras.</p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="margin-top: 0; color: #1976d2;">📋 Tus credenciales de acceso:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>🔑 Contraseña:</strong> <code style="background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,123,255,0.3);">
              🚀 Iniciar Sesión
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              🔐 <strong>Recomendación de seguridad:</strong> Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
              <strong>URL de acceso directo:</strong><br>
              <span style="word-break: break-all;">${loginUrl}</span>
            </p>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; background-color: #003366; color: white;">
          <p style="margin: 0; font-size: 12px;">© Lab Contreras - Sistema de Gestión</p>
          <p style="margin: 5px 0 0 0; font-size: 10px; opacity: 0.8;">Bienvenido al equipo</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Invitación a Lab Contreras - Credenciales de Acceso',
      htmlContent,
      textContent: `Bienvenido a Lab Contreras

Hola ${name},

Has sido invitado a unirte al sistema de gestión de Lab Contreras.

Credenciales de acceso:
- Email: ${email}
- Contraseña: ${password}

Enlace de acceso: ${loginUrl}

Por razones de seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.

¡Bienvenido al equipo!`,
    });

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Invitación enviada exitosamente',
      data: {
        email,
        name,
        emailSent: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en sendInvitationEmail:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error al enviar la invitación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
  updateStatus,
  sendInvitationEmail,
};
