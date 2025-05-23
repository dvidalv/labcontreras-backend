const mongoose = require('mongoose');
const { Schema } = mongoose;

const sugerenciasPacientesSchema = new Schema({
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
    enum: ['nada-satisfecho', 'poco-satisfecho', 'satisfecho', 'muy-satisfecho'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar un nivel de satisfacción',
    },
  },
  mejora: {
    type: String,
    required: false,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save para asegurar que la fecha se establezca
sugerenciasPacientesSchema.pre('save', function (next) {
  if (!this.fecha) {
    this.fecha = new Date();
  }
  next();
});

const SugerenciasPacientes = mongoose.model(
  'SugerenciasPacientes', // Nombre del modelo
  sugerenciasPacientesSchema, // Esquema del modelo
  'sugerencias_pacientes', // Nombre de la colección
);

module.exports = SugerenciasPacientes;
