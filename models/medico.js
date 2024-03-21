const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema, model } = require('mongoose');
const { celebrate, Joi, Segments } = require('celebrate'); // import celebrate

const medicoSchemaValidation = Joi.object().keys({
  nombre: Joi.string().required().min(2).max(30).messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre debe tener como máximo 30 caracteres',
  }),
  apellido: Joi.string().required().min(2).max(30).messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido debe tener como máximo 30 caracteres',
  }),
  url: Joi.string().empty(''),
  especialidad: Joi.string().required().min(2).max(30).messages({
    'string.min': 'La especialidad debe tener al menos 2 caracteres',
    'string.max': 'La especialidad debe tener como máximo 30 caracteres',
  }),
  telefono: Joi.string().required().min(6).max(30).messages({
    'string.min': 'El teléfono debe tener al menos 6 caracteres',
    'string.max': 'El teléfono debe tener como máximo 30 caracteres',
  }),
  celular: Joi.string().required().min(6).max(30).messages({
    'string.min': 'El celular debe tener al menos 6 caracteres',
    'string.max': 'El celular debe tener como máximo 30 caracteres',
  }),
  email: Joi.string()
    .required()
    .email({ tlds: { allow: true } }) // Habilita la validación de TLDs
    .messages({
      'string.email': 'Debe ser un email válido',
    }),
  password: Joi.string().required().min(6).max(30).messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'string.max': 'La contraseña debe tener como máximo 30 caracteres',
  }),
})
  .with('email', 'password') // Si se proporciona un email, también debe proporcionarse una contraseña

const medicoSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  apellido: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  url: {
    type: String,
  },
  especialidad: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  telefono: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 30,
  },
  celular: {
    type: String,
    required: true,
    minlength: 6,
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
const validateMedico = celebrate({
  [Segments.BODY]: medicoSchemaValidation,
});

medicoSchema.statics.findMedicoByCredentials = function (email, password) {
  return this.findOne({ email })
    .select('+password')
    .then((medico) => {
      if (!medico) {
        return Promise.reject(new Error('Usuario o contraseña incorrectos'));
      }
      return bcrypt.compare(password, medico.password).then((matched) => {
        if (!matched) {
          return Promise.reject(new Error('Usuario o contraseña incorrectos'));
        }
        return medico;
      });
    });
};

medicoSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) {
      return next(err);
    }
    this.password = hash;
    next();
  });
});

module.exports = {
  Medico: model('Medico', medicoSchema, 'medicos'),
  validateMedico,
};
