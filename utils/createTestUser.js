#!/usr/bin/env node

/**
 * Script para crear un usuario de prueba
 * Uso: node utils/createTestUser.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/user');

async function createTestUser() {
  try {
    console.log('👤 CREANDO USUARIO DE PRUEBA');
    console.log('='.repeat(50));

    // Conectar a la base de datos
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos');

    const testEmail = 'test@labcontreras.com';

    // Verificar si ya existe
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`⚠️  El usuario ${testEmail} ya existe`);
      console.log('✅ Puedes usar este email para probar la recuperación');
      await mongoose.connection.close();
      return testEmail;
    }

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('password123', 12);

    const testUser = new User({
      email: testEmail,
      password: hashedPassword,
      name: 'Usuario de Prueba',
      role: 'user',
    });

    await testUser.save();

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Contraseña: password123`);
    console.log('👤 Nombre: Usuario de Prueba');
    console.log('🏷️  Rol: user');

    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');

    return testEmail;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUser()
    .then((email) => {
      console.log('\n🎯 Ahora puedes probar la recuperación con:');
      console.log(`   Email: ${email}`);
      console.log('\n🧪 Comandos para probar:');
      console.log('   node utils/testRecuperacionCompleta.js');
    })
    .catch(console.error);
}

module.exports = { createTestUser };
