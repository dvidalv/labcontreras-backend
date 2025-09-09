const axios = require('axios');
const {
  THEFACTORY_EMAIL_URL,
  THEFACTORY_USUARIO,
  THEFACTORY_CLAVE,
  THEFACTORY_RNC,
  THEFACTORY_AUTH_URL,
} = require('../utils/constants');

// Importar la función de autenticación existente del sistema principal
const {
  obtenerTokenTheFactory: obtenerTokenSistema,
} = require('../controllers/comprobantes');

/**
 * Obtiene un token de autenticación válido de TheFactoryHKA
 * Reutiliza la función existente del sistema principal
 * @returns {Promise<string>} Token de autenticación válido
 */
const obtenerTokenTheFactory = async () => {
  try {
    console.log(
      '🔐 Obteniendo token para email (reutilizando sistema principal)...',
    );
    return await obtenerTokenSistema();
  } catch (error) {
    console.error('❌ Error al obtener token para email:', error.message);
    throw error;
  }
};

/**
 * Envía un email a través de The Factory HKA
 * @param {Object} emailData - Datos del email
 * @param {string} emailData.documento - Número de documento (NCF)
 * @param {string[]} emailData.correos - Array de correos destinatarios
 * @param {string} [emailData.rnc] - RNC del emisor (opcional, usa el del env si no se proporciona)
 * @returns {Promise<Object>} Respuesta de la API de The Factory HKA
 */
const enviarEmailTheFactory = async (emailData) => {
  try {
    const { documento, correos, rnc = THEFACTORY_RNC } = emailData;

    // Validaciones
    if (!documento) {
      throw new Error('El número de documento (NCF) es requerido');
    }

    if (!correos || !Array.isArray(correos) || correos.length === 0) {
      throw new Error('Debe proporcionar al menos un correo destinatario');
    }

    // Validar formato de emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailsInvalidos = correos.filter((email) => !emailRegex.test(email));
    if (emailsInvalidos.length > 0) {
      throw new Error(`Emails inválidos: ${emailsInvalidos.join(', ')}`);
    }

    console.log('📧 Iniciando envío de email a través de The Factory HKA...', {
      documento,
      rnc,
      correos: correos.length,
    });

    // Obtener token de autenticación
    const token = await obtenerTokenTheFactory();

    // Construir payload según la API de The Factory HKA
    const payload = {
      token: token,
      rnc: rnc,
      correos: correos,
      documento: documento,
    };

    console.log('📤 Enviando solicitud de email a The Factory HKA...', {
      url: THEFACTORY_EMAIL_URL,
      documento,
      destinatarios: correos.length,
    });

    // Enviar solicitud
    const response = await axios.post(THEFACTORY_EMAIL_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 segundos
    });

    console.log('📨 Respuesta de The Factory HKA:', response.data);

    // Verificar respuesta
    if (!response.data) {
      throw new Error('Respuesta vacía de The Factory HKA');
    }

    const { procesado, codigo, mensaje } = response.data;

    // Interpretar resultado
    if (procesado === false && codigo === 0) {
      // Email encolado para envío (respuesta normal según documentación)
      return {
        success: true,
        status: 'queued',
        message: mensaje || 'Correo electrónico pendiente por ser enviado',
        data: {
          documento,
          correos,
          rnc,
          codigo,
          procesado,
          respuestaCompleta: response.data,
        },
      };
    } else if (procesado === true) {
      // Email procesado exitosamente
      return {
        success: true,
        status: 'processed',
        message: mensaje || 'Correo electrónico enviado exitosamente',
        data: {
          documento,
          correos,
          rnc,
          codigo,
          procesado,
          respuestaCompleta: response.data,
        },
      };
    } else {
      // Error en el procesamiento
      const errorMsg = mensaje || 'Error desconocido en el envío de email';
      return {
        success: false,
        status: 'error',
        message: errorMsg,
        error: {
          codigo,
          mensaje,
          procesado,
          respuestaCompleta: response.data,
        },
      };
    }
  } catch (error) {
    console.error('❌ Error al enviar email con The Factory HKA:', error);

    // Manejar errores de autenticación
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(
        '🔄 Token inválido, el sistema principal manejará la renovación...',
      );
    }

    throw {
      success: false,
      status: 'error',
      message: error.message || 'Error al enviar email',
      error: {
        details: error.response?.data || error.message,
        status: error.response?.status,
        code: error.code,
      },
    };
  }
};

/**
 * Controlador para la API REST - envía email de documento electrónico
 */
const enviarEmailDocumento = async (req, res) => {
  try {
    const { documento, correos, rnc } = req.body;

    // Validaciones
    if (!documento) {
      return res.status(400).json({
        status: 'error',
        message: 'El número de documento (NCF) es requerido',
        details: 'Debe proporcionar el NCF del documento a enviar por email',
      });
    }

    if (!correos || !Array.isArray(correos) || correos.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Debe proporcionar al menos un correo destinatario',
        details:
          'El campo correos debe ser un array con al menos un email válido',
      });
    }

    if (correos.length > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Máximo 10 destinatarios por solicitud',
        details:
          'Para mejores resultados, limite el envío a máximo 10 correos por llamada',
      });
    }

    console.log('📧 Solicitud de envío de email recibida:', {
      documento,
      correos: correos.length,
      rnc: rnc || 'usando RNC del sistema',
    });

    // Enviar email
    const resultado = await enviarEmailTheFactory({
      documento,
      correos,
      rnc,
    });

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data,
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: resultado.message,
        details: resultado.error,
      });
    }
  } catch (error) {
    console.error('❌ Error en controlador de envío de email:', error);

    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor al enviar email',
      details: error.message || 'Error desconocido',
    });
  }
};

module.exports = {
  enviarEmailTheFactory,
  enviarEmailDocumento,
  obtenerTokenTheFactory,
};
