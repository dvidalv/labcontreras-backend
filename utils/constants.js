
let FILEMAKER_URL = 'https://www.server-lpcr.com.do';
let FILEMAKER_USER = process.env.FILEMAKER_USER;
let FILEMAKER_PASSWORD = process.env.FILEMAKER_PASSWORD;
let FILEMAKER_DATABASE = process.env.FILEMAKER_DATABASE;
let FILEMAKER_RESULTADOSLAYOUT = 'listado_estudios_data_api';
let FILEMAKER_MEDICOSLAYOUT = 'medicos_data-api';
let FILEMAKER_PUBLICACIONESLAYOUT = 'publicaciones_data-api';
let FILEMAKER_CREDENTIALS = `${FILEMAKER_USER}:${FILEMAKER_PASSWORD}`;
let FILEMAKER_CREDENTIALS_BASE64 = Buffer.from(FILEMAKER_CREDENTIALS).toString(
  'base64',
);

module.exports = {
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_CREDENTIALS_BASE64,
  FILEMAKER_RESULTADOSLAYOUT,
  FILEMAKER_MEDICOSLAYOUT,
  FILEMAKER_PUBLICACIONESLAYOUT,
};
