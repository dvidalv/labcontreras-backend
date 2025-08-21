const mongoose = require('mongoose');
const { Schema } = mongoose;
const { sendEmail } = require('../api/api-mail_brevo');
require('dotenv').config();

const sugerenciasMedicosSchema = new Schema({
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
      'muy-satisfecho',
      'satisfecho',
      'poco-satisfecho',
      'nada-satisfecho',
    ],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar un nivel de satisfacción',
    },
  },
  entregaOportuna: {
    type: String,
    required: true,
    enum: ['si', 'no'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  informesClaros: {
    type: String,
    required: true,
    enum: ['si', 'no'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  utilidadDiagnosticos: {
    type: String,
    required: true,
    enum: ['utiles', 'no-concluyentes', 'sin-beneficio'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  metodosTecnicos: {
    type: String,
    required: true,
    enum: ['obsoletos', 'modernos', 'excesivos'],
    validate: {
      validator: (v) => {
        return v && v.trim().length > 0;
      },
      message: 'Debe seleccionar una opción',
    },
  },
  sugerencias: {
    type: String,
    required: false,
  },
  comentarios: {
    type: String,
    required: false,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save para asegurar que la fecha se establezca
sugerenciasMedicosSchema.pre('save', function (next) {
  if (!this.fecha) {
    this.fecha = new Date();
  }
  next();
});

// Agregar después del middleware pre-save
sugerenciasMedicosSchema.post('save', async function (doc) {
  // console.log('Nueva sugerencia de médico guardada:');
  // console.log('ID:', doc._id);

  // Función auxiliar para convertir valores enum a texto más legible
  const getUtilidadText = (valor) => {
    const textos = {
      utiles: 'Útiles',
      'no-concluyentes': 'No Concluyentes',
      'sin-beneficio': 'Sin Beneficio',
    };
    return textos[valor] || valor;
  };

  const getMetodosText = (valor) => {
    const textos = {
      obsoletos: 'Obsoletos',
      modernos: 'Modernos',
      excesivos: 'Excesivos',
    };
    return textos[valor] || valor;
  };

  // Crear contenido HTML del email usando Brevo
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
        .utilidad {
          background-color: ${
            doc.utilidadDiagnosticos === 'utiles'
              ? '#28a745'
              : doc.utilidadDiagnosticos === 'no-concluyentes'
                ? '#ffc107'
                : '#dc3545'
          };
          color: white;
        }
        .metodos {
          background-color: ${
            doc.metodosTecnicos === 'modernos'
              ? '#28a745'
              : doc.metodosTecnicos === 'excesivos'
                ? '#ffc107'
                : '#dc3545'
          };
          color: white;
        }
        .text-section {
          margin-top: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
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
          <h2>Nueva Sugerencia de Médico</h2>
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
            <span class="label">Entrega Oportuna:</span>
            <span class="indicator ${doc.entregaOportuna}">${doc.entregaOportuna.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">Informes Claros:</span>
            <span class="indicator ${doc.informesClaros}">${doc.informesClaros.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">Utilidad de Diagnósticos:</span>
            <span class="indicator utilidad">${getUtilidadText(doc.utilidadDiagnosticos)}</span>
          </div>
          <div class="info-row">
            <span class="label">Métodos Técnicos:</span>
            <span class="indicator metodos">${getMetodosText(doc.metodosTecnicos)}</span>
          </div>
          ${
            doc.sugerencias
              ? `
          <div class="text-section">
            <span class="label">Sugerencias:</span>
            <p class="value">${doc.sugerencias}</p>
          </div>
          `
              : ''
          }
          ${
            doc.comentarios
              ? `
          <div class="text-section">
            <span class="label">Comentarios:</span>
            <p class="value">${doc.comentarios}</p>
          </div>
          `
              : ''
          }
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

  // Crear contenido en texto plano
  const textContent = `Nueva sugerencia de médico recibida:
ID: ${doc._id}
Nombre: ${doc.nombre || 'Anónimo'}
Satisfacción: ${doc.satisfaccion}
Entrega Oportuna: ${doc.entregaOportuna}
Informes Claros: ${doc.informesClaros}
Utilidad de Diagnósticos: ${getUtilidadText(doc.utilidadDiagnosticos)}
Métodos Técnicos: ${getMetodosText(doc.metodosTecnicos)}
${doc.sugerencias ? `Sugerencias: ${doc.sugerencias}` : ''}
${doc.comentarios ? `Comentarios: ${doc.comentarios}` : ''}
Fecha: ${doc.fecha.toLocaleString('es-DO')}`;

  try {
    console.log(
      '📧 Enviando emails de notificación de sugerencia de médico...',
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
        subject: 'Nueva Sugerencia de Médico Recibida',
        htmlContent: htmlContent,
        textContent: textContent,
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

const SugerenciasMedicos = mongoose.model(
  'SugerenciasMedicos', // Nombre del modelo
  sugerenciasMedicosSchema, // Esquema del modelo
  'sugerencias_medicos', // Nombre de la colección
);

module.exports = SugerenciasMedicos;
