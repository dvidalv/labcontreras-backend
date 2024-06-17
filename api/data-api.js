const { FILEMAKER_URL, FILEMAKER_DATABASE, FILEMAKER_LAYOUT } = require('../utils/constants');

const FILEMAKER_USER = process.env.FILEMAKER_USER;
const FILEMAKER_PASSWORD = process.env.FILEMAKER_PASSWORD;
const FILEMAKER_CREDENTIALS_BASE64 = Buffer.from(`${FILEMAKER_USER}:${FILEMAKER_PASSWORD}`).toString('base64');
console.log(FILEMAKER_CREDENTIALS_BASE64);

const getFileMakerData = async () => {
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions`, {
      method: 'POST',
      headers: {
          'Authorization': `Basic ${FILEMAKER_CREDENTIALS_BASE64}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
  });
  return response.json();
}