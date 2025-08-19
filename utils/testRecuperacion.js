#!/usr/bin/env node

/**
 * Script para probar la recuperación de contraseña en desarrollo
 * Uso: node utils/testRecuperacion.js
 */

require('dotenv').config();
const http = require('http');

async function testRecuperacion() {
  console.log('🔐 PRUEBA DE RECUPERACIÓN DE CONTRASEÑA');
  console.log('='.repeat(50));

  const emailData = {
    email: 'test@example.com', // Cambia por un email válido en tu sistema
  };

  const postData = JSON.stringify(emailData);

  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3001,
    path: '/users/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve) => {
    console.log(`📡 Enviando solicitud de recuperación...`);
    console.log(`📧 Email: ${emailData.email}`);
    console.log(`🌐 URL: http://localhost:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📊 Status: ${res.statusCode}`);

        try {
          const response = JSON.parse(data);
          console.log('📨 Respuesta:', JSON.stringify(response, null, 2));

          if (res.statusCode === 200 && response.status === 'success') {
            console.log('\n✅ ¡Solicitud de recuperación enviada!');
            console.log('📧 Revisa tu email para el enlace de recuperación');

            // Mostrar información sobre la URL que se generará
            console.log('\n🔗 El enlace debería apuntar a:');
            const isProduction = process.env.NODE_ENV === 'production';
            const baseUrl = isProduction
              ? process.env.FRONTEND_URL_PROD
              : process.env.FRONTEND_URL_DEV;
            console.log(`   ${baseUrl}/reset-password/[TOKEN]`);

            if (isProduction && baseUrl.includes('contrerasrobledo.com.do')) {
              console.log('\n⚠️  ADVERTENCIA: Estás en modo producción');
              console.log(
                '   El enlace apuntará al sitio web real, no a localhost',
              );
              console.log(
                '   Para desarrollo local, cambia NODE_ENV=development',
              );
            }
          } else {
            console.log('\n❌ Error en la recuperación');
            if (response.message) {
              console.log(`   Mensaje: ${response.message}`);
            }
          }
        } catch (error) {
          console.log('\n❌ Error parseando respuesta:', error.message);
          console.log('Raw response:', data);
        }

        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Error en la petición:', error.message);
      console.log('\n💡 Asegúrate de que el servidor esté corriendo:');
      console.log('   npm run dev');
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testRecuperacion().catch(console.error);
}

module.exports = { testRecuperacion };
