#!/usr/bin/env node

/**
 * Script de prueba para verificar la configuración de Brevo
 * Uso: node utils/testBrevo.js
 */

require('dotenv').config();
// const { testBrevoConfiguration, sendEmail } = require('../api/api-mail_brevo');

async function runTests() {
  console.log('🧪 Iniciando pruebas de configuración de Brevo...\n');

  // Verificar variables de entorno
  console.log('📋 Verificando variables de entorno:');
  const requiredEnvVars = ['BREVO_API_KEY', 'BREVO_FROM_EMAIL'];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Configurada`);
    } else {
      console.log(`❌ ${envVar}: No configurada`);
      console.log(`   Agrega ${envVar} a tu archivo .env`);
    }
  }

  // Verificar variables opcionales
  const optionalEnvVars = ['BREVO_FROM_NAME', 'TEST_EMAIL'];
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: ${process.env[envVar]}`);
    } else {
      console.log(`⚠️  ${envVar}: No configurada (opcional)`);
    }
  }

  console.log('\n📧 Probando envío de email...');

  try {
    // Importar SDK directamente para pruebas
    const SibApiV3Sdk = require('sib-api-v3-sdk');

    // Configurar la instancia
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Probar envío básico
    console.log('\n📧 Enviando email de prueba básico...');

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [
      {
        email: process.env.TEST_EMAIL || 'servicios@contrerasrobledo.com.do',
      },
    ];
    sendSmtpEmail.subject = 'Prueba de configuración Brevo - Lab Contreras';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #003366 0%, #0056b3 100%); padding: 30px; text-align: center; color: white;">
          <h1>🧪 Prueba de Brevo</h1>
          <p>Integración exitosa con Lab Contreras Backend</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">Detalles de la prueba:</h2>
          <ul style="color: #666;">
            <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</li>
            <li><strong>Servidor:</strong> ${process.env.NODE_ENV || 'development'}</li>
            <li><strong>SDK:</strong> sib-api-v3-sdk</li>
          </ul>
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #155724;">
              ✅ <strong>La configuración de Brevo está funcionando correctamente!</strong>
            </p>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; background-color: #e9ecef; color: #6c757d; font-size: 12px;">
          <p>Este email fue enviado desde el sistema de pruebas de Lab Contreras</p>
        </div>
      </div>
    `;
    sendSmtpEmail.textContent = `
      Prueba de Brevo - Lab Contreras
      
      La integración con Brevo está funcionando correctamente.
      
      Detalles:
      - Fecha: ${new Date().toLocaleString('es-ES')}
      - Servidor: ${process.env.NODE_ENV || 'development'}
      - SDK: sib-api-v3-sdk
    `;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_FROM_NAME || 'Lab Contreras',
      email:
        process.env.BREVO_FROM_EMAIL || 'servicios@contrerasrobledo.com.do',
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ Email de prueba enviado exitosamente!');
    console.log(`📨 Message ID: ${result.messageId}`);

    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Verifica que los emails llegaron a tu bandeja de entrada');
    console.log(
      '2. Configura tu dominio en Brevo para mejorar la entregabilidad',
    );
    console.log('3. Actualiza tus rutas para usar el nuevo servicio de Brevo');
  } catch (error) {
    console.error('\n❌ Error en las pruebas:');
    console.error('Mensaje:', error.error || error.message);

    if (error.details) {
      console.error('Detalles:', JSON.stringify(error.details, null, 2));
    }

    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que BREVO_API_KEY esté configurada correctamente');
    console.log('2. Asegúrate de que la API key sea válida');
    console.log('3. Verifica que el email remitente esté verificado en Brevo');
    console.log('4. Revisa los límites de tu cuenta de Brevo');

    process.exit(1);
  }
}

// Ejecutar las pruebas si el script se ejecuta directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
