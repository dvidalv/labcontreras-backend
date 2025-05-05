const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const key = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(key);

const sendMail = async (req, res) => {
  const { email, subject, message } = req.body;

  // Validaciones
  if (!email || !subject || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Email, asunto y mensaje son requeridos'
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Formato de email inválido'
    });
  }

  // Validar tipos y longitudes
  if (typeof subject !== 'string' || typeof message !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'El asunto y mensaje deben ser texto'
    });
  }

  if (subject.length > 100) {
    return res.status(400).json({
      status: 'error',
      message: 'El asunto no puede exceder los 100 caracteres'
    });
  }

  if (message.length > 500) {
    return res.status(400).json({
      status: 'error',
      message: 'El mensaje no puede exceder los 500 caracteres'
    });
  }

  const msg = {
    to: 'servicios@contrerasrobledo.com.do',
    from: 'servicios@contrerasrobledo.com.do',
    subject: subject,
    content: [
      {
        type: 'text/html',
        value: `Email del usuario: ${email}<br>Mensaje: ${message}`,
      },
    ],
  };
  sgMail
    .send(msg)
    .then(() => {
      res.status(200).json({ status: 'success', message: 'Email enviado' });
    })
    .catch((error) => {
      console.error(error.response.body);
      res.status(500).json({
        status: 'error',
        message: 'Error al enviar el email',
        details: error.response.body,
      });
    });
};


module.exports = { sendMail };
