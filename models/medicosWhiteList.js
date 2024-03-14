const mongoose = require('mongoose');
const { Schema } = mongoose;
const { celebrate, Joi, Segments } = require('celebrate');

const medicosWhiteListSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
  },
});

const medicosWhiteListSchemaValidation = Joi.object().keys({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: true } })
    .messages({
      'string.email': 'Debe ser un email válido',
    }),
  nombre: Joi.string().required().messages({
    'string.base': 'El nombre debe ser un texto',
    'string.empty': 'El nombre no puede estar vacío',
    'any.required': 'El nombre es requerido',
  }),
});

// Celebrate middleware for medicosWhiteList validation
const validateMedicosWhiteList = celebrate({
  [Segments.BODY]: medicosWhiteListSchemaValidation,
});

medicosWhiteListSchema.statics.findMedicoByEmail = function (email) {
  return this.findOne({ email })
    .then((medico) => medico)
    .catch((err) => {
      console.error('Error al buscar medico por email:', err);
      return null;
    });
};

const MedicosWhiteList = mongoose.model(
  'MedicosWhiteList',
  medicosWhiteListSchema,
  'medicoswhitelist',
);
// console.log('Colletion Name:', MedicosWhiteList.collection.name);

module.exports = {
  MedicosWhiteList,
  validateMedicosWhiteList,
};
