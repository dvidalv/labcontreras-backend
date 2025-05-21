// Script de migración (puedes ejecutarlo una vez)
const { connectDB } = require('./db');
const { User } = require('../models/user');
const mongoose = require('mongoose');

const migrateUsers = async () => {
  try {
    await connectDB(); // Establecer conexión a la base de datos
    const result = await User.updateMany(
      { isDisabled: { $exists: false } },
      { $set: { isDisabled: false } },
    );
    console.log('Migración completada con éxito');
    console.log(`${result.modifiedCount} usuarios actualizados`);
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close(); // Cerrar la conexión cuando terminemos
  }
};

// Ejecutar la migración y manejar la conexión a la base de datos
const runMigration = async () => {
  try {
    await migrateUsers();
    console.log('Proceso de migración finalizado');
    process.exit(0);
  } catch (error) {
    console.error('Error al ejecutar la migración:', error);
    process.exit(1);
  }
};

runMigration();
