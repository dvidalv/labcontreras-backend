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
  console.log('req.body', req.body);
  console.log('name', name);
  console.log('token', token);
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
  // console.log('response', response);
  const data = await response.json();
  return res.status(200).json(data);
}

// Descargar archivo PDF de un contenedor
const downloadPDF = async (req, res) => {
  const token = req.body.token; // Asegúrate de que el token es válido y está activo
  const recordId = req.body.id; // ID del registro donde se encuentra el contenedor
  const fieldName = "Url_Resultado"; // Nombre del campo contenedor

  const url = `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_LAYOUT}/records/${recordId}/containers/${fieldName}/1`;

  try {
    const response = await fetch(url, {
      method: 'GET', // Usando GET para descargar
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('response', response);
    if (response.ok) {
      const blob = await response.blob();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="downloaded.pdf"');
      blob.stream().pipe(res);
    } else {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getFilemakerToken, getRecords, getRecordByName, downloadPDF };

// module.exports = { getFilemakerToken, getRecords, getRecordByName };
