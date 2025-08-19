#!/usr/bin/env node

/**
 * Prueba simple para verificar la configuración de Brevo
 * Uso: node utils/testBrevoSimple.js
 */

require('dotenv').config();

async function testSimple() {
  console.log('🧪 Prueba simple de Brevo...\n');

  // Verificar variables de entorno
  if (!process.env.BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY no está configurada');
    console.log('Agrega BREVO_API_KEY=tu_api_key a tu archivo .env');
    process.exit(1);
  }

  console.log('✅ BREVO_API_KEY está configurada');

  try {
    // Importar el SDK
    const SibApiV3Sdk = require('sib-api-v3-sdk');
    console.log('✅ SDK de Brevo importado correctamente');

    // Configurar la instancia
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    console.log('✅ API key configurada');

    // Crear instancia de la API
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log('✅ Instancia de API creada');

    // Crear email de prueba
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [
      {
        email: process.env.TEST_EMAIL || 'servicios@contrerasrobledo.com.do',
      },
    ];
    sendSmtpEmail.subject = 'Prueba de Brevo - Lab Contreras';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">🧪 Prueba de Brevo</h1>
        <p>Esta es una prueba simple del servicio de email de Brevo.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        <p style="color: green;">✅ La configuración de Brevo está funcionando correctamente!</p>
      </div>
    `;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_FROM_NAME || 'Lab Contreras',
      email:
        process.env.BREVO_FROM_EMAIL || 'servicios@contrerasrobledo.com.do',
    };

    console.log('\n📧 Enviando email de prueba...');

    // Enviar el email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ Email enviado exitosamente!');
    console.log(`📨 Message ID: ${result.messageId}`);
    console.log('\n🎉 Prueba completada con éxito!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Verifica tu bandeja de entrada');
    console.log('2. Ejecuta: node utils/testBrevo.js (prueba completa)');
    console.log(
      '3. Ejecuta: node scripts/migrarABrevo.js (análisis de migración)',
    );
  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    console.error('Mensaje:', error.message);

    if (error.response && error.response.body) {
      console.error('Detalles:', JSON.stringify(error.response.body, null, 2));
    }

    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que BREVO_API_KEY sea válida');
    console.log('2. Asegúrate de que tu cuenta de Brevo esté activa');
    console.log('3. Verifica que el email remitente esté verificado en Brevo');

    process.exit(1);
  }
}

// Ejecutar la prueba si el script se ejecuta directamente
if (require.main === module) {
  testSimple().catch(console.error);
}

module.exports = { testSimple };
