#!/usr/bin/env node

/**
 * Script para probar la generación de URLs de recuperación
 * Uso: node utils/testUrlGeneration.js
 */

require('dotenv').config();
const http = require('http');

async function testUrlGeneration() {
  console.log('🔗 PRUEBA DE GENERACIÓN DE URLs');
  console.log('='.repeat(50));

  console.log('\n📋 Configuración actual:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`FRONTEND_URL_PROD: ${process.env.FRONTEND_URL_PROD}`);
  console.log(`FRONTEND_URL_DEV: ${process.env.FRONTEND_URL_DEV}`);

  // Crear un usuario de prueba en la base de datos primero
  console.log('\n🔐 Probando generación de URL de recuperación...');

  const emailData = {
    email: 'admin@example.com', // Usa un email que exista en tu BD
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
      Host: 'localhost:3001', // Importante: esto hará que detecte localhost
    },
  };

  return new Promise((resolve) => {
    console.log('📡 Enviando petición de recuperación...');
    console.log(`📧 Email: ${emailData.email}`);
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

          if (res.statusCode === 200) {
            console.log('✅ ¡Recuperación exitosa!');
            console.log(
              '📧 El email debería contener un enlace hacia localhost',
            );
          } else if (res.statusCode === 404) {
            console.log(
              '⚠️  Usuario no encontrado, pero la URL se habría generado correctamente',
            );
            console.log(
              '💡 Crea un usuario con este email o usa un email existente',
            );
          } else {
            console.log('❌ Error inesperado:', response.message);
          }
        } catch (error) {
          console.log('❌ Error parseando respuesta:', error.message);
        }

        // Ahora hacer la misma prueba simulando producción
        console.log('\n' + '='.repeat(30));
        console.log('🌐 Probando como si fuera producción...');

        const prodOptions = {
          ...options,
          headers: {
            ...options.headers,
            Host: 'www.contrerasrobledo.com.do', // Simular host de producción
          },
        };

        const prodReq = http.request(prodOptions, (prodRes) => {
          let prodData = '';
          prodRes.on('data', (chunk) => {
            prodData += chunk;
          });
          prodRes.on('end', () => {
            console.log(`📊 Status (prod): ${prodRes.statusCode}`);
            console.log(
              '📧 Con host de producción, el enlace apuntaría al sitio real',
            );
            resolve();
          });
        });

        prodReq.on('error', () => resolve());
        prodReq.write(postData);
        prodReq.end();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      console.log('💡 Asegúrate de que el servidor esté corriendo');
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testUrlGeneration().catch(console.error);
}

module.exports = { testUrlGeneration };
