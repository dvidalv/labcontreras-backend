require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


const uploadCloudinary = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se encontró el archivo para subir.');
  }

  try {
    // Envuelve la carga en una promesa para usar async/await
    const result = await new Promise((resolve, reject) => {
      const streamUpload = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const readStream = bufferToStream(req.file.buffer);
      readStream.pipe(streamUpload);
    });

    // Si la carga es exitosa, envía la URL segura de la imagen
    res.status(200).json({ message: 'Imagen subida con éxito', url: result.secure_url });
  } catch (error) {
    console.error('Error al subir archivo a Cloudinary:', error);
    res.status(500).json({ message: 'Error al subir imagen', error });
  }
};

function bufferToStream(buffer) {
  const stream = new require('stream').Readable();
  stream.push(buffer);
  stream.push(null); // Indica el fin del stream
  return stream;
}

module.exports = uploadCloudinary;