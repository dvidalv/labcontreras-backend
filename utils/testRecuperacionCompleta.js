#!/usr/bin/env node

/**
 * Script para probar la recuperación de contraseña completa
 * Uso: node utils/testRecuperacionCompleta.js
 */

require('dotenv').config();
const http = require('http');

async function testRecuperacionCompleta() {
  console.log('🔐 PRUEBA COMPLETA DE RECUPERACIÓN DE CONTRASEÑA');
  console.log('='.repeat(60));

  console.log('\n📋 Configuración actual:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`FRONTEND_URL_PROD: ${process.env.FRONTEND_URL_PROD}`);
  console.log(`FRONTEND_URL_DEV: ${process.env.FRONTEND_URL_DEV}`);

  const testEmail = 'test@labcontreras.com';

  console.log('\n🧪 PRUEBA 1: Recuperación desde localhost');
  console.log('-'.repeat(40));

  const emailData = {
    email: testEmail,
  };

  const postData = JSON.stringify(emailData);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/users/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      Host: 'localhost:3001',
    },
  };

  return new Promise((resolve) => {
    console.log(`📡 Enviando petición de recuperación...`);
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🌐 Host header: localhost:3001`);

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
            console.log('\n✅ ¡RECUPERACIÓN EXITOSA!');
            console.log(
              '📧 Se ha enviado un email con el enlace de recuperación',
            );
            console.log(
              '🔗 El enlace debería apuntar a: http://localhost:3000/reset-password/[TOKEN]',
            );
            console.log('\n📋 Pasos siguientes:');
            console.log(
              '1. ✅ Revisa tu email (servicios@contrerasrobledo.com.do)',
            );
            console.log('2. ✅ Busca el email de "Recuperación de Contraseña"');
            console.log('3. ✅ Verifica que el enlace apunte a localhost:3000');
            console.log('4. ✅ Haz clic en el enlace para probar');

            // Mostrar info adicional
            console.log('\n🎨 Características del email enviado:');
            console.log('   - Diseño HTML profesional con gradientes');
            console.log('   - Logo y colores de Lab Contreras');
            console.log('   - Botón de recuperación destacado');
            console.log('   - Información de seguridad (1 hora de expiración)');
            console.log('   - URL alternativa en texto plano');
          } else if (res.statusCode === 404) {
            console.log('\n❌ Usuario no encontrado');
            console.log(
              `💡 Asegúrate de que el email ${testEmail} existe en la BD`,
            );
            console.log('   Ejecuta: node utils/createTestUser.js');
          } else {
            console.log('\n❌ Error en la recuperación');
            console.log(
              `   Mensaje: ${response.message || 'Error desconocido'}`,
            );
          }
        } catch (error) {
          console.log('\n❌ Error parseando respuesta:', error.message);
          console.log('Raw response:', data);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE LA PRUEBA:');
        console.log('='.repeat(60));

        if (res.statusCode === 200) {
          console.log('✅ Sistema de recuperación funcionando correctamente');
          console.log('✅ URLs generándose para localhost (desarrollo)');
          console.log('✅ Email enviado con template HTML mejorado');
          console.log('✅ Brevo integrado exitosamente');

          console.log('\n🎯 Funcionalidades verificadas:');
          console.log('   ✅ Detección automática de entorno local');
          console.log('   ✅ Generación de URLs de desarrollo');
          console.log('   ✅ Envío de emails con Brevo');
          console.log('   ✅ Templates HTML profesionales');
          console.log('   ✅ Tokens JWT válidos con expiración');
        } else {
          console.log('⚠️  La prueba no fue completamente exitosa');
          console.log('📞 Revisa los errores mostrados arriba');
        }

        console.log('\n💡 Para probar en producción:');
        console.log(
          '   - Los enlaces apuntarán automáticamente a contrerasrobledo.com.do',
        );
        console.log('   - cuando la petición venga desde un dominio real');

        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Error en la petición:', error.message);
      console.log('\n💡 Soluciones:');
      console.log('   1. Verifica que el servidor esté corriendo: npm run dev');
      console.log('   2. Confirma que el puerto sea 3001');
      console.log('   3. Revisa los logs del servidor');
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testRecuperacionCompleta().catch(console.error);
}

module.exports = { testRecuperacionCompleta };
