const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.ATLAS_URI.replace('<password>', process.env.ATLAS_PASSWORD);


// Conexión a la base de datos
const connectDB = async () => {
    try {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      process.exit(1);
    }
  };

module.exports = connectDB;
