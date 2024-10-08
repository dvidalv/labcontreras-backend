const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const key = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(key);

const sendMail = async (req, res) => {
  const { email, subject, message } = req.body;
  const msg = {
    to: 'servicios@contrerasrobledo.com.do', // Change to your recipient
    from: 'servicios@contrerasrobledo.com.do', // Change to your verified sender
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

module.exports = sendMail;
