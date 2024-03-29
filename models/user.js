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
    email: Joi.string()
      .required()
      .email({ tlds: { allow: true } }) // Habilita la validación de TLDs
      .messages({
        'string.email': 'Debe ser un email válido',
      }),
    password: Joi.string()
      .required()
      .min(6)
      .messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
      }),
  })
  .with('email', 'password'); // Si se proporciona un email, también debe proporcionarse una contraseña

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
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
  User: mongoose.model('user', userSchema, 'users'),
  validateUser: validateUser,
};
