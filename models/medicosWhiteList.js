const mongoose = require('mongoose');
const { Schema } = mongoose;
const { celebrate, Joi, Segments } = require('celebrate'); // import celebrate

const medicosWhiteListSchemaValidation = Joi.object().keys({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: true } }) // Habilita la validación de TLDs
    .messages({
      'string.email': 'Debe ser un email válido',
    }),
})

module.exports = mongoose.model('MedicosWhiteList', medicosWhiteListSchema);

const medicosWhiteListSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

// Celebrate middleware for medicosWhiteList validation
const validateMedicosWhiteList = celebrate({
  [Segments.BODY]: medicosWhiteListSchemaValidation,
});

medicosWhiteListSchema.static.find({ email: email }, (err, medicosWhiteList) => {
  if (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    });
  }
  if (medicosWhiteList.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'El email ya está en la lista blanca',
    });
  }
  next();
});

medicosWhiteListSchema.statics.findByEmail = (email, callback) => {
  const query = { email };
  medicosWhiteListSchema.findOne(query, (err, medicosWhiteList) => {
    if (err) {
      return 'Error interno del servidor';
    }
    return 'El email ya está en la lista blanca';
  });
};

module.exports = {
  medicosWhiteListSchema: mongoose.model('MedicosWhiteList', medicosWhiteList),
  validateMedicosWhiteList,
};

