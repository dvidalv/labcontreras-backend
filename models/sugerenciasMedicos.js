const mongoose = require('mongoose');
const { Schema } = mongoose;

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
    required: false,
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

const SugerenciasMedicos = mongoose.model(
  'SugerenciasMedicos',
  sugerenciasMedicosSchema,
  'sugerencias_medicos',
);

module.exports = SugerenciasMedicos;
