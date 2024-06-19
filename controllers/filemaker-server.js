const {
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_CREDENTIALS_BASE64,
  FILEMAKER_LAYOUT,
} = require('../utils/constants');

// Obtener token de acceso
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

// Obtener registros
const getRecords = async (req, res) => {
  const token = req.body.token;
  const limit = 50; // Cantidad de registros a obtener
  const offset = 1; // Nmero de registro desde el que se empieza a obtener
  const sort = JSON.stringify([{
    fieldName: "FECHA_ENTRADA",
    sortOrder: "descend"
  }]);
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_LAYOUT}/records?_sort=${encodeURIComponent(sort)}&_limit=${limit}&_offset=${offset}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  });
  const data = await response.json();
  // console.log('data', data);
  return res.status(200).json(data);
}

// Obtener un registro por un nombre
const getRecordByName = async (req, res) => {
  const token = req.body.token;
  const name = req.body.name;
  const body = {
    query: [
      {
        "Nombre_Completo": name
      }
    ],
    "sort": [
      {
        "fieldName": "FECHA_ENTRADA",
        "sortOrder": "descend"
      }
    ]
  };
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_LAYOUT}/_find`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
  });
  const data = await response.json();
  return res.status(200).json(data);
}

module.exports = { getFilemakerToken, getRecords, getRecordByName };
