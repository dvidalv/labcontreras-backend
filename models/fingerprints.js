const mongoose = require('mongoose');
const { Schema } = mongoose;

const fingerprintSchema = new Schema({
  fingerprint: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['pacientes', 'medicos', 'empresas'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // TTL index: document will be automatically deleted after 1 hour (3600 seconds)
  },
});

// Crear índice compuesto para fingerprint y type
fingerprintSchema.index({ fingerprint: 1, type: 1 }, { unique: true });

const Fingerprint = mongoose.model(
  'Fingerprint', // Nombre del modelo
  fingerprintSchema,
  'fingerprints',
);

module.exports = Fingerprint;
