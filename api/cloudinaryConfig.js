const sharp = require('sharp');
const crypto = require('crypto');
require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const imagen = async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).send('No se encontró el archivo para subir.');
    }

    const compressedImage = await sharp(file.buffer)
      .resize({ width: 400, height: 400 })
      .png({ quality: 80 })
      .toBuffer();

    // Convertir el buffer a Data URI
    const dataUri = `data:image/png;base64,${compressedImage.toString('base64')}`;

    const hash = crypto.createHash('sha256').update(compressedImage).digest('hex');

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: hash,
      folder: 'avatars',
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'thumb' },   // Miniatura de 400x400
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    res.status(200).json({ message: 'Imagen subida con éxito', url: result.secure_url });
  } catch (error) {
    console.error('Error al subir archivo a Cloudinary:', error);
    res.status(500).json({ 
      message: 'Error al subir imagen', 
      error: error.message || error,
      stack: error.stack // <-- agrega esto para ver el stacktrace
    });
  }
};



module.exports = { imagen };