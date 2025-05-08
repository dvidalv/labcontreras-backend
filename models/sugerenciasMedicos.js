const mongoose = require('mongoose');
const { Schema } = mongoose;
const connection = require('../config/databaseSugerencias');

const sugerenciasMedicosSchema = new Schema({
  nombre: {
    type: String,
    required: false,
    validate: {
      validator: (v) => {
        if (!v) return true;
        const nombreRegex = /^[a-zA-Z\s]+$/;
        return nombreRegex.test(v);
      },
      message: 'El nombre debe contener solo letras y espacios',
    },
  },
  satisfaccion: {
    type: String,
    required: true,
    enum: [
      'muy-satisfecho',
      'satisfecho',
      'poco-satisfecho',
      'nada-satisfecho',
    ],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar un nivel de satisfacción',
    },
  },
  entregaOportuna: {
    type: String,
    required: true,
    enum: ['si', 'no'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  informesClaros: {
    type: String,
    required: true,
    enum: ['si', 'no'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  utilidadDiagnosticos: {
    type: String,
    required: true,
    enum: ['utiles', 'no-concluyentes', 'sin-beneficio'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  metodosTecnicos: {
    type: String,
    required: true,
    enum: ['obsoletos', 'modernos', 'excesivos'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  sugerencias: {
    type: String,
    required: true,
    minlength: [10, 'El mensaje debe tener al menos 10 caracteres'],
    maxlength: [500, 'El mensaje no puede exceder los 500 caracteres'],
    validate: {
      validator: (v) => {
        return v && v.trim().length >= 10 && v.trim().length <= 500;
      },
      message: 'La sugerencia debe tener entre 10 y 500 caracteres',
    },
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save para asegurar que la fecha se establezca
sugerenciasMedicosSchema.pre('save', function (next) {
  if (!this.fecha) {
    this.fecha = new Date();
  }
  next();
});

const SugerenciasMedicos = connection.model(
  'SugerenciasMedicos',
  sugerenciasMedicosSchema,
  'sugerencias_medicos',
);

module.exports = SugerenciasMedicos;
