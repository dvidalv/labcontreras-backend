const mongoose = require('mongoose');
const { Schema } = mongoose;

const sugerenciasEmpresasSchema = new Schema({
  empresa: {
    type: String,
    required: true,
    validate: {
      validator: (v) => {
        return v && v.trim().length >= 2;
      },
      message: 'El nombre de la empresa debe tener al menos 2 caracteres',
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
  oportuno: {
    type: String,
    required: true,
    enum: ['si', 'no'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar si los resultados han sido oportunos',
    },
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save para asegurar que la fecha se establezca
sugerenciasEmpresasSchema.pre('save', function (next) {
  if (!this.fecha) {
    this.fecha = new Date();
  }
  next();
});

const SugerenciasEmpresas = mongoose.model(
  'SugerenciasEmpresas',
  sugerenciasEmpresasSchema,
  'sugerencias_empresas',
);

module.exports = SugerenciasEmpresas;
