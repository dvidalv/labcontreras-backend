#!/usr/bin/env node

/**
 * Script para listar usuarios en la base de datos
 * Uso: node utils/listUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/user');

async function listUsers() {
  try {
    console.log('👥 LISTANDO USUARIOS DE LA BASE DE DATOS');
    console.log('='.repeat(50));

    // Conectar a la base de datos
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos');

    // Buscar usuarios
    const users = await User.find({}, 'email name role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    if (users.length === 0) {
      console.log('\n❌ No se encontraron usuarios en la base de datos');
      console.log(
        '💡 Crea un usuario primero para poder probar la recuperación',
      );
    } else {
      console.log(`\n📋 Encontrados ${users.length} usuarios:`);
      console.log('-'.repeat(50));

      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Nombre: ${user.name || 'No especificado'}`);
        console.log(`   Rol: ${user.role || 'user'}`);
        console.log(
          `   Creado: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'No especificado'}`,
        );
        console.log('');
      });

      console.log(
        '💡 Usa cualquiera de estos emails para probar la recuperación de contraseña',
      );
    }

    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  listUsers().catch(console.error);
}

module.exports = { listUsers };
