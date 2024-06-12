const {
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_LAYOUT,
  FILEMAKER_CREDENTIALS_BASE64,
  FILEMAKER_USERNAME,
  FILEMAKER_PASSWORD,
} = require('../utils/constants');

const getFilemakerData = async () => {
  const response = await fetch(
    `${FILEMAKER_URL}/fmi/data/v1/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_LAYOUT}/sessions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${FILEMAKER_CREDENTIALS_BASE64}`,
      },
    },
  );
  const data = await response.json();
  return data;
};

// const getFilemakerToken = async () => {
//   const response = await fetch(
//     `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions`,
//     {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Basic ${FILEMAKER_CREDENTIALS_BASE64}`,
//       },
//       body: JSON.stringify({
//         fmDataSource: [
//           {
//             databaseName: FILEMAKER_DATABASE,
//             username: FILEMAKER_USERNAME,
//             password: FILEMAKER_PASSWORD,
//           },
//         ],
//       }),
//     },
//   );
//   const data = await response.json();
//   return data;
// };
async function getFilemakerToken() {
  try {
    const credentials = btoa(`${FILEMAKER_USERNAME}:${FILEMAKER_PASSWORD}`);
    const response = await fetch(
      `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fmDataSource: [
            {
              database: FILEMAKER_DATABASE,
              username: FILEMAKER_USERNAME,
              password: FILEMAKER_PASSWORD,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response.token;
  } catch (error) {
    console.error('Error fetching token:', error);
  }
}

module.exports = { getFilemakerData, getFilemakerToken };
