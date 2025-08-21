const mongoose = require('mongoose');
const { Schema } = mongoose;
const { sendEmail } = require('../api/api-mail_brevo');
require('dotenv').config();

const sugerenciasPacientesSchema = new Schema({
  nombre: {
    type: String,
    required: false,
    validate: {
      validator: (v) => {
        if (!v) return true;
        const nombreRegex = /^[a-zA-Z\s]+$/;
        return nombreRegex.test(v);
      },
      message: 'El nombre debe contener solo letras y espacios',
    },
  },
  satisfaccion: {
    type: String,
    required: true,
    enum: [
      'nada-satisfecho',
      'poco-satisfecho',
      'satisfecho',
      'muy-satisfecho',
    ],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar un nivel de satisfacción',
    },
  },
  mejora: {
    type: String,
    required: false,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save para asegurar que la fecha se establezca
sugerenciasPacientesSchema.pre('save', function (next) {
  if (!this.fecha) {
    this.fecha = new Date();
  }
  next();
});

// Middleware post-save con email estilizado usando Brevo
sugerenciasPacientesSchema.post('save', async function (doc) {
  // Crear contenido HTML del email
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .header {
          background-color: #003366;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 20px;
          border-radius: 0 0 5px 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .info-row {
          margin: 10px 0;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .label {
          font-weight: bold;
          color: #003366;
        }
        .value {
          margin-left: 10px;
          color: #333;
        }
        .satisfaction {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 15px;
          background-color: ${
            doc.satisfaccion === 'muy-satisfecho'
              ? '#28a745'
              : doc.satisfaccion === 'satisfecho'
                ? '#17a2b8'
                : doc.satisfaccion === 'poco-satisfecho'
                  ? '#ffc107'
                  : '#dc3545'
          };
          color: white;
          font-size: 14px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h2>Nueva Sugerencia de Paciente</h2>
        </div>
        <div class="content">
          <div class="info-row">
            <span class="label">ID:</span>
            <span class="value">${doc._id}</span>
          </div>
          <div class="info-row">
            <span class="label">Nombre:</span>
            <span class="value">${doc.nombre || 'Anónimo'}</span>
          </div>
          <div class="info-row">
            <span class="label">Satisfacción:</span>
            <span class="satisfaction">${doc.satisfaccion}</span>
          </div>
          <div class="info-row">
            <span class="label">Mejora:</span>
            <span class="value">${doc.mejora || 'No especificada'}</span>
          </div>
          <div class="info-row">
            <span class="label">Fecha:</span>
            <span class="value">${doc.fecha.toLocaleString('es-DO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</span>
          </div>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático del sistema de sugerencias de Contreras Robledo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Lista de destinatarios
  const destinatarios = [
    'soporte@contrerasrobledo.com.do',
    'servicios@contrerasrobledo.com.do',
    'gestiondecalidad@contrerasrobledo.com.do',
    'asistentedecalidad@contrerasrobledo.com.do',
  ];

  try {
    console.log(
      '📧 Enviando emails de notificación de sugerencia de paciente...',
      {
        id: doc._id,
        nombre: doc.nombre || 'Anónimo',
        satisfaccion: doc.satisfaccion,
      },
    );

    // Enviar email a cada destinatario usando Brevo
    for (const destinatario of destinatarios) {
      console.log(`📤 Enviando email a: ${destinatario}`);
      const result = await sendEmail({
        to: destinatario,
        subject: 'Nueva Sugerencia de Paciente Recibida',
        htmlContent: htmlContent,
        textContent: `Nueva sugerencia de paciente recibida:\nID: ${doc._id}\nNombre: ${doc.nombre || 'Anónimo'}\nSatisfacción: ${doc.satisfaccion}\nMejora: ${doc.mejora || 'No especificada'}\nFecha: ${doc.fecha.toLocaleString('es-DO')}`,
      });
      console.log(
        `✅ Email enviado exitosamente a ${destinatario}, MessageID: ${result.messageId}`,
      );
    }
    console.log('🎉 Todos los emails de notificación enviados exitosamente');
  } catch (error) {
    console.error('❌ Error al enviar email con Brevo:', error);
    console.error('❌ Detalles del error:', error.details || error.message);
  }
});

const SugerenciasPacientes = mongoose.model(
  'SugerenciasPacientes', // Nombre del modelo
  sugerenciasPacientesSchema, // Esquema del modelo
  'sugerencias_pacientes', // Nombre de la colección
);

module.exports = SugerenciasPacientes;
