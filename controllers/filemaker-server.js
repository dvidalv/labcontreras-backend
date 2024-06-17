const {
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_CREDENTIALS_BASE64,
} = require('../utils/constants');

const getFilemakerToken = async (req, res) => {
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions`, {
      method: 'POST',
      headers: {
          'Authorization': `Basic ${FILEMAKER_CREDENTIALS_BASE64}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
  });
  const data = await response.json();
  console.log('data', data);
  return res.status(200).json(data);

}


module.exports = { getFilemakerToken };
