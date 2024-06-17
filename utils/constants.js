let BASE_URL;
let ATLAS_URI;

// if (window.location.hostname === 'localhost') {
//   BASE_URL = 'http://localhost:3000';
//   ATLAS_URI =
//     'mongodb+srv://dvidalv:00Pht4CqHMxaKzP4@cluster0.m2ufsic.mongodb.net/';
// } else {
//   BASE_URL = 'https://api.alrededorusa.mooo.com';
//   ATLAS_URI = process.env.ATLAS_URI;
// }

let FILEMAKER_URL = 'https://www.server-lpcr.com.do';
let FILEMAKER_USER = process.env.FILEMAKER_USER;
let FILEMAKER_PASSWORD = process.env.FILEMAKER_PASSWORD;
let FILEMAKER_DATABASE = process.env.FILEMAKER_DATABASE;
let FILEMAKER_LAYOUT = 'listado_estudios_data_api';
let FILEMAKER_CREDENTIALS = `${FILEMAKER_USER}:${FILEMAKER_PASSWORD}`;
let FILEMAKER_CREDENTIALS_BASE64 = Buffer.from(FILEMAKER_CREDENTIALS).toString(
  'base64',
);

module.exports = {
  BASE_URL,
  ATLAS_URI,
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_CREDENTIALS_BASE64,
  FILEMAKER_LAYOUT,
};
