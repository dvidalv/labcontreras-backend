const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

// Configurar la instancia de la API de Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Envía un email transaccional usando Brevo
 * @param {Object} emailData - Datos del email
 * @param {string} emailData.to - Email del destinatario
 * @param {string} emailData.subject - Asunto del email
 * @param {string} emailData.htmlContent - Contenido HTML del email
 * @param {string} emailData.textContent - Contenido en texto plano (opcional)
 * @param {string} emailData.fromEmail - Email del remitente (opcional)
 * @param {string} emailData.fromName - Nombre del remitente (opcional)
 * @returns {Promise<Object>} Respuesta de la API de Brevo
 */
const sendEmail = async (emailData) => {
  try {
    const {
      to,
      subject,
      htmlContent,
      textContent = '',
      fromEmail = process.env.BREVO_FROM_EMAIL ||
        'servicios@contrerasrobledo.com.do',
      fromName = process.env.BREVO_FROM_NAME || 'Lab Contreras',
    } = emailData;

    // Crear el objeto de email según la estructura de Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = { name: fromName, email: fromEmail };
    sendSmtpEmail.to = [{ email: to }];

    // Enviar el email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('Email enviado exitosamente:', result);
    return {
      success: true,
      messageId: result.messageId,
      data: result,
    };
  } catch (error) {
    console.error('Error al enviar email con Brevo:', error);
    throw {
      success: false,
      error: error.message || 'Error desconocido al enviar email',
      details: error.response?.body || error,
    };
  }
};

/**
 * Controlador para enviar emails desde la API REST
 * Mantiene la misma interfaz que el controlador de SendGrid
 */
const sendMail = async (req, res) => {
  const { email, subject, message } = req.body;

  // Validaciones
  if (!email || !subject || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Email, asunto y mensaje son requeridos',
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Formato de email inválido',
    });
  }

  // Validar tipos y longitudes
  if (typeof subject !== 'string' || typeof message !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'El asunto y mensaje deben ser texto',
    });
  }

  if (subject.length > 100) {
    return res.status(400).json({
      status: 'error',
      message: 'El asunto no puede exceder los 100 caracteres',
    });
  }

  if (message.length > 500) {
    return res.status(400).json({
      status: 'error',
      message: 'El mensaje no puede exceder los 500 caracteres',
    });
  }

  try {
    // Crear contenido HTML del email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nuevo mensaje desde el sitio web</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email del usuario:</strong> ${email}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <div style="margin-top: 15px;">
            <strong>Mensaje:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 3px; margin-top: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
        <p style="color: #666; font-size: 12px;">
          Este mensaje fue enviado desde el formulario de contacto del sitio web.
        </p>
      </div>
    `;

    // Enviar el email usando Brevo
    const result = await sendEmail({
      to: 'servicios@contrerasrobledo.com.do',
      subject: `Contacto Web: ${subject}`,
      htmlContent: htmlContent,
      textContent: `Email del usuario: ${email}\nAsunto: ${subject}\nMensaje: ${message}`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Email enviado exitosamente',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error al enviar email:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar el email',
      details: error.error || error.message,
    });
  }
};

/**
 * Función de utilidad para enviar emails de notificación del sistema
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del email
 * @param {string} content - Contenido del email
 * @param {Object} options - Opciones adicionales
 */
const sendNotificationEmail = async (to, subject, content, options = {}) => {
  try {
    const htmlContent = options.isHtml
      ? content
      : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          ${content.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    return await sendEmail({
      to,
      subject,
      htmlContent,
      textContent: options.isHtml ? '' : content,
      ...options,
    });
  } catch (error) {
    console.error('Error al enviar email de notificación:', error);
    throw error;
  }
};

/**
 * Función para probar la configuración de Brevo
 */
const testBrevoConfiguration = async () => {
  try {
    const testResult = await sendEmail({
      to: process.env.TEST_EMAIL || 'servicios@contrerasrobledo.com.do',
      subject: 'Prueba de configuración Brevo',
      htmlContent: `
        <h2>✅ Configuración de Brevo exitosa</h2>
        <p>Este es un email de prueba para verificar que la integración con Brevo está funcionando correctamente.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      `,
      textContent: 'Prueba de configuración Brevo - Email enviado exitosamente',
    });

    console.log('✅ Prueba de Brevo exitosa:', testResult);
    return testResult;
  } catch (error) {
    console.error('❌ Error en prueba de Brevo:', error);
    throw error;
  }
};

module.exports = {
  sendMail,
  sendEmail,
  sendNotificationEmail,
  testBrevoConfiguration,
};
