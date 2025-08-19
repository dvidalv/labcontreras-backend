#!/usr/bin/env node

/**
 * Script para debuggear las URLs que se generan para recuperación de contraseña
 * Uso: node utils/debugUrls.js
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

function debugUrls() {
  console.log('🔍 DEBUG DE URLs DE RECUPERACIÓN');
  console.log('='.repeat(50));

  // Mostrar variables de entorno actuales
  console.log('\n📋 Variables de entorno:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'no configurado'}`);
  console.log(
    `FRONTEND_URL_PROD: ${process.env.FRONTEND_URL_PROD || 'no configurado'}`,
  );
  console.log(
    `FRONTEND_URL_DEV: ${process.env.FRONTEND_URL_DEV || 'no configurado'}`,
  );

  // Simular la lógica del controlador
  console.log('\n🔧 Lógica de selección de URL:');
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`¿Es producción?: ${isProduction}`);

  const baseUrl = isProduction
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_DEV;

  console.log(`URL base seleccionada: ${baseUrl}`);

  // Generar token de ejemplo
  const exampleUserId = '68a3d9162f1c34fe8d81c935';
  const resetToken = jwt.sign(
    { _id: exampleUserId },
    process.env.JWT_SECRET || 'secret_temporal',
    { expiresIn: '1h' },
  );

  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

  console.log('\n🔗 URL generada:');
  console.log(`${resetUrl}`);

  // Verificar si el token es válido
  console.log('\n🧪 Verificación del token:');
  try {
    const decoded = jwt.verify(
      resetToken,
      process.env.JWT_SECRET || 'secret_temporal',
    );
    console.log('✅ Token válido');
    console.log(`User ID: ${decoded._id}`);
    console.log(`Expira: ${new Date(decoded.exp * 1000).toLocaleString()}`);
  } catch (error) {
    console.log('❌ Token inválido:', error.message);
  }

  // Sugerencias
  console.log('\n💡 Sugerencias:');
  if (isProduction && baseUrl.includes('contrerasrobledo.com.do')) {
    console.log(
      '⚠️  Estás en modo PRODUCCIÓN pero probablemente trabajando localmente',
    );
    console.log(
      '📝 Cambia NODE_ENV=development en tu .env para desarrollo local',
    );
  }

  if (!isProduction && baseUrl.includes('localhost')) {
    console.log('✅ Configuración correcta para desarrollo local');
    console.log('🌐 Asegúrate de que tu frontend esté corriendo en:', baseUrl);
  }

  console.log('\n🔧 Para cambiar el entorno:');
  console.log('1. Edita tu archivo .env');
  console.log('2. Cambia NODE_ENV=development (para desarrollo local)');
  console.log('3. O NODE_ENV=production (para producción)');
  console.log('4. Reinicia el servidor: npm run dev');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugUrls();
}

module.exports = { debugUrls };
