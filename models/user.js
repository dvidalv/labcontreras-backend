// esquemas de usuarios
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const { celebrate, Joi, Segments } = require('celebrate'); // import celebrate

const userSchemaValidation = Joi.object()
  .keys({
    name: Joi.string().required().min(2).max(30).messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre debe tener como máximo 30 caracteres',
    }),
    tel: Joi.string().required().min(10).max(12).messages({
      'string.min': 'El teléfono debe tener 10 dígitos',
      'string.max': 'El teléfono debe tener 12 dígitos',
    }),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: true } }) // Habilita la validación de TLDs
      .messages({
        'string.email': 'Debe ser un email válido',
      }),
    role: Joi.string().required().valid('admin', 'user', 'medico', 'guest').messages({
      'any.only': 'El rol debe ser uno de los siguientes: admin, user, medico, guest',
    }),
    password: Joi.string().required().min(6).messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
    }),
    url: Joi.string().uri().allow(''),
  })
  .with('email', 'password'); // Si se proporciona un email, también debe proporcionarse una contraseña

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  tel: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 12,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => {
        const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailRegex.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user', 'medico', 'guest'],
    default: 'user', // Opcional: define un valor predeterminado
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  url: {
    type: String,
    default: '',
  },
});

// Celebrate middleware for user validation
const validateUser = celebrate({
  [Segments.BODY]: userSchemaValidation,
});

userSchema.statics.findUserByCredentials = function (email, password) {
  return this.findOne({ email })
    .select('+password')
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error('Usuario o contraseña incorrectos'));
      }
      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          return Promise.reject(new Error('Usuario o contraseña incorrectos'));
        }
        return user;
      });
    });
};

// exportar el modelo
module.exports = {
  User: mongoose.model('user', userSchema, 'users'),
  validateUser: validateUser,
};
