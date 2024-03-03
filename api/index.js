const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
// const { ATLAS_URI } = require('../utils/constants.js');

dotenv.config();

const app = express();
// const PORT = process.env.PORT || 3011;

app.use(cors());
app.use(express.json());

// MongoDB Atlas connection string
const ATLAS_URI = process.env.ATLAS_URI; // Asegúrate de tener esta variable en tu archivo .env

mongoose
  .connect(ATLAS_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Atlas connected successfully.'))
  .catch((err) => console.error('MongoDB Atlas connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
  console.log('Hello World!');
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server ready on port 3001.'));

module.exports = app;
