#!/usr/bin/env node

/**
 * Script de prueba completa para verificar que Brevo funcione en todos los niveles
 * Uso: node utils/pruebaCompleta.js
 */

require('dotenv').config();
const http = require('http');

console.log('🧪 PRUEBA COMPLETA DE BREVO - LAB CONTRERAS');
console.log('='.repeat(50));

// Test 1: Verificar configuración
async function test1_configuracion() {
  console.log('\n📋 1. VERIFICANDO CONFIGURACIÓN...');

  const requiredVars = ['BREVO_API_KEY'];
  const optionalVars = ['BREVO_FROM_EMAIL', 'BREVO_FROM_NAME', 'TEST_EMAIL'];

  let configOK = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
    } else {
      console.log(`❌ ${varName}: NO configurada`);
      configOK = false;
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`⚠️  ${varName}: No configurada (opcional)`);
    }
  }

  return configOK;
}

// Test 2: Probar SDK directamente
async function test2_sdk() {
  console.log('\n📦 2. PROBANDO SDK DE BREVO...');

  try {
    const SibApiV3Sdk = require('sib-api-v3-sdk');
    console.log('✅ SDK importado correctamente');

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    console.log('✅ API key configurada');

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log('✅ Instancia de API creada');

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [
      { email: process.env.TEST_EMAIL || 'servicios@contrerasrobledo.com.do' },
    ];
    sendSmtpEmail.subject = 'Prueba Completa SDK - Lab Contreras';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">🧪 Prueba Completa SDK</h1>
        <p>Este email confirma que el SDK de Brevo está funcionando correctamente.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Nivel:</strong> SDK Directo</p>
      </div>
    `;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_FROM_NAME || 'Lab Contreras',
      email:
        process.env.BREVO_FROM_EMAIL || 'servicios@contrerasrobledo.com.do',
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email SDK enviado - Message ID: ${result.messageId}`);

    return true;
  } catch (error) {
    console.log(`❌ Error en SDK: ${error.message}`);
    return false;
  }
}

// Test 3: Probar API REST
async function test3_api() {
  console.log('\n🌐 3. PROBANDO API REST...');

  return new Promise((resolve) => {
    const emailData = {
      email: 'test@example.com',
      subject: 'Prueba Completa API - Lab Contreras',
      message:
        'Este email confirma que la API REST está funcionando correctamente con Brevo.',
    };

    const postData = JSON.stringify(emailData);

    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3001,
      path: '/api/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    console.log(`📡 Probando http://localhost:${options.port}/api/contact...`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.status === 'success') {
            console.log(
              `✅ API REST funcionando - Message ID: ${response.messageId}`,
            );
            resolve(true);
          } else {
            console.log(`❌ API REST falló - Status: ${res.statusCode}`);
            console.log(`   Respuesta: ${JSON.stringify(response)}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ Error parseando respuesta API: ${error.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error de conexión API: ${error.message}`);
      console.log(
        '💡 Asegúrate de que el servidor esté corriendo: npm run dev',
      );
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 4: Verificar emails en bandeja
async function test4_verificacion() {
  console.log('\n📧 4. VERIFICACIÓN MANUAL...');
  console.log('📋 Por favor verifica manualmente:');
  console.log('   1. Revisa tu bandeja de entrada');
  console.log('   2. Busca emails de "Lab Contreras"');
  console.log('   3. Verifica que llegaron 2 emails de prueba');
  console.log('   4. Confirma que el diseño HTML se ve bien');
  console.log('');
  console.log('📧 Emails enviados a:');
  console.log(
    `   - ${process.env.TEST_EMAIL || 'servicios@contrerasrobledo.com.do'} (SDK)`,
  );
  console.log(`   - servicios@contrerasrobledo.com.do (API)`);
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log(`\n🚀 Iniciando pruebas completas...`);
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);

  const results = {};

  try {
    results.config = await test1_configuracion();

    if (results.config) {
      results.sdk = await test2_sdk();
      results.api = await test3_api();
      await test4_verificacion();
    } else {
      console.log(
        '\n❌ Configuración incompleta. Corrige las variables de entorno antes de continuar.',
      );
      return;
    }

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log('='.repeat(50));

    console.log(`📋 Configuración: ${results.config ? '✅ OK' : '❌ FALLA'}`);
    console.log(`📦 SDK Brevo: ${results.sdk ? '✅ OK' : '❌ FALLA'}`);
    console.log(`🌐 API REST: ${results.api ? '✅ OK' : '❌ FALLA'}`);

    const allPassed = results.config && results.sdk && results.api;

    if (allPassed) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
      console.log('✅ Brevo está funcionando correctamente en tu sistema');
      console.log('✅ Tanto el SDK como la API REST están operativos');
      console.log('✅ Los emails se están enviando exitosamente');
      console.log('\n📋 Sistema listo para:');
      console.log('   - Emails de recuperación de contraseña');
      console.log('   - Invitaciones de usuario');
      console.log('   - Emails de contacto desde el sitio web');
      console.log('   - Notificaciones del sistema');
    } else {
      console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON');
      console.log('📞 Revisa los errores arriba y corrige los problemas');
    }
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LAS PRUEBAS:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
