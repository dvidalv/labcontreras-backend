const mongoose = require('mongoose');
const { Schema } = mongoose;
const { sendEmail } = require('../api/api-mail_brevo');
require('dotenv').config();

const sugerenciasEmpresasSchema = new Schema({
  empresa: {
    type: String,
    required: true,
    validate: {
      validator: (v) => {
        return v && v.trim().length >= 2;
      },
      message: 'El nombre de la empresa debe tener al menos 2 caracteres',
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
  oportuno: {
    type: String,
    required: true,
    enum: ['si', 'no'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar si los resultados han sido oportunos',
    },
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save para asegurar que la fecha se establezca
sugerenciasEmpresasSchema.pre('save', function (next) {
  if (!this.fecha) {
    this.fecha = new Date();
  }
  next();
});

// Middleware post-save con email estilizado usando Brevo
sugerenciasEmpresasSchema.post('save', async function (doc) {
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
        .indicator {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 14px;
        }
        .si {
          background-color: #28a745;
          color: white;
        }
        .no {
          background-color: #dc3545;
          color: white;
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
          <h2>Nueva Sugerencia de Empresa</h2>
        </div>
        <div class="content">
          <div class="info-row">
            <span class="label">ID:</span>
            <span class="value">${doc._id}</span>
          </div>
          <div class="info-row">
            <span class="label">Empresa:</span>
            <span class="value">${doc.empresa}</span>
          </div>
          <div class="info-row">
            <span class="label">Satisfacción:</span>
            <span class="satisfaction">${doc.satisfaccion}</span>
          </div>
          <div class="info-row">
            <span class="label">Resultados Oportunos:</span>
            <span class="indicator ${doc.oportuno}">${doc.oportuno.toUpperCase()}</span>
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
      '📧 Enviando emails de notificación de sugerencia de empresa...',
      {
        id: doc._id,
        empresa: doc.empresa,
        satisfaccion: doc.satisfaccion,
      },
    );

    // Enviar email a cada destinatario usando Brevo
    for (const destinatario of destinatarios) {
      console.log(`📤 Enviando email a: ${destinatario}`);
      const result = await sendEmail({
        to: destinatario,
        subject: 'Nueva Sugerencia de Empresa Recibida',
        htmlContent: htmlContent,
        textContent: `Nueva sugerencia de empresa recibida:\nID: ${doc._id}\nEmpresa: ${doc.empresa}\nSatisfacción: ${doc.satisfaccion}\nResultados Oportunos: ${doc.oportuno}\nFecha: ${doc.fecha.toLocaleString('es-DO')}`,
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

const SugerenciasEmpresas = mongoose.model(
  'SugerenciasEmpresas', // Nombre del modelo
  sugerenciasEmpresasSchema, // Esquema del modelo
  'sugerencias_empresas', // Nombre de la colección
);

module.exports = SugerenciasEmpresas;
