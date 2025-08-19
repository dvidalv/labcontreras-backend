#!/usr/bin/env node

/**
 * Script para probar el endpoint de email de la API
 * Uso: node utils/testEmailAPI.js
 */

const http = require('http');

const testEmailAPI = async () => {
  console.log('🧪 Probando API de contacto con Brevo...\n');

  const emailData = {
    email: 'test@example.com',
    subject: 'Prueba API - Lab Contreras',
    message: 'Este es un mensaje de prueba desde la API REST usando Brevo.',
  };

  const postData = JSON.stringify(emailData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/contact',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    console.log('📡 Enviando petición a http://localhost:3000/api/contact...');
    console.log('📦 Datos:', emailData);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📊 Status: ${res.statusCode}`);
        console.log('📨 Respuesta:', data);

        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.status === 'success') {
            console.log('\n✅ Prueba de API exitosa!');
            console.log(`📧 Message ID: ${response.messageId || 'N/A'}`);
            console.log(
              '\n🎉 El endpoint de email está funcionando correctamente con Brevo!',
            );
          } else {
            console.log('\n❌ Prueba de API falló');
            console.log('Respuesta:', response);
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
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// Ejecutar la prueba si el script se ejecuta directamente
if (require.main === module) {
  testEmailAPI().catch(console.error);
}

module.exports = { testEmailAPI };
