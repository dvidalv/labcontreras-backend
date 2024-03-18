const fs = require('fs');

async function uploadSingleImage(req, res) {
  console.log('req.file', req.file.path);
  saveFile(req.file);
  res.send('Terminada la subida de la imagen');
}

async function uploadMultipleImages(req, res) {
  console.log('req.files', req.files);
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
  console.log('newPath', newPath);
  return newPath;
}

module.exports = {
  uploadSingleImage,
  uploadMultipleImages
};