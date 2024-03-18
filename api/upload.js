// const formidable = require('formidable-serverless');
// const cloudinary = require('cloudinary').v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const config = {
//   api: {
//     bodyParser: false, // Deshabilita el análisis automático de bodyParser para permitir formidable manejarlo
//   },
// };

// export default async (req, res) => {
//   const form = new formidable.IncomingForm();
//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       res.status(500).json({ error: 'No se pudo procesar la carga del archivo.' });
//       return;
//     }
//     try {
//       // Suponiendo que "image" es el nombre del campo en el formulario de carga
//       const file = files.image;
//       const result = await cloudinary.uploader.upload(file.filepath);
//       res.status(200).json({ message: 'Archivo subido con éxito', url: result.secure_url });
//     } catch (error) {
//       res.status(500).json({ error: 'Error al subir el archivo a Cloudinary.' });
//     }
//   });
// };