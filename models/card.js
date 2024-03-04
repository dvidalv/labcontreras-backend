// squema cards
const mongoose = require('mongoose');

const { Schema } = mongoose;

const cardSchema = new Schema({
  name: {
    type: String, // Tipo de dato
    required: true, // Requerido
    minlength: 2, // Mínimo de caracteres
    maxlength: 30, // Máximo de caracteres
  },
  link: {
    type: String, // Tipo de dato
    required: true, // Requerido
    validate: {
      validator(v) {
        // eslint-disable-next-line no-useless-escape
        const urlRegex =
          /(http|https):\/\/(www\.)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        return urlRegex.test(v);
      },
      message: (props) => `${props.value} no es una URL válida`,
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  likes: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// exportar el modelo
module.exports = mongoose.model('card', cardSchema);
