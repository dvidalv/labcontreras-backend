const fs = require('fs');

async function uploadSingleImage(req, res) {
  saveFile(req.file);
  res.send('Terminada la subida de la imagen');
}

async function uploadMultipleImages(req, res) {
  const files = req.files.map((file) => saveFile(file));
  res.send('Terminada la subida de las imagenes');
}

function saveFile(file) {
  const newPath = `uploads/${file.originalname}`;
  fs.rename(file.path, newPath, (error) => {
    if (error) {
      console.log('error', error);
    }
  });
  return newPath;
}

module.exports = {
  uploadSingleImage,
  uploadMultipleImages
};