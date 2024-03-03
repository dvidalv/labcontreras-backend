// esquemas de usuarios
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const { Schema } = mongoose;

const { celebrate, Segments } = require('celebrate'); // import celebrate

const userSchemaValidation = Joi.object()
  .keys({
    name: Joi.string().empty('').default('Jacques Cousteau').min(2).max(30),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: true } }) // Habilita la validación de TLDs
      .messages({
        'string.email': 'Debe ser un email válido',
      }),
    password: Joi.string()
      .required()
      .min(6)
      .custom((value, helpers) => {
        if (value.length < 6) {
          return helpers.message(
            'La contraseña debe tener al menos 8 caracteres',
          );
        }
        return value;
      }, 'custom validation for password'),
  })
  .with('email', 'password'); // Si se proporciona un email, también debe proporcionarse una contraseña

const userSchema = new Schema({
  name: {
    type: String,
    default: 'Jacques Cousteau',
    minlength: 2,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
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
  User: mongoose.model('user', userSchema),
  validateUser: validateUser,
};
