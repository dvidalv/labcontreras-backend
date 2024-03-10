const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const key = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(key);

const sendMail = async (req, res) => {
  const { email, subject, message } = req.body;
  console.log(email, subject, message)
  const msg = {
    to: email, // Change to your recipient
    from: 'dvidalv@gmail.com', // Change to your verified sender
    subject: subject,
    content: [
      {
        type: "text/html",
        value: message // Assuming 'email' variable contains the email body text.
      }
    ]
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent');
      res.status(200).json({ status: 'success', message: 'Email enviado' });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Error al enviar el email' });
    });

};

module.exports = sendMail;

