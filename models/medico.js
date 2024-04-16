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
})
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
});

// Celebrate middleware for user validation
const validateMedico = celebrate({
  [Segments.BODY]: medicoSchemaValidation,
});


module.exports = {
  Medico: model('Medico', medicoSchema, 'medicos'),
  validateMedico,
};
