const {
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_CREDENTIALS_BASE64,
  FILEMAKER_RESULTADOSLAYOUT,
  FILEMAKER_MEDICOSLAYOUT,
} = require('../utils/constants');


// Obtener token de acceso
const getFilemakerToken = async (req, res, useRes=true) => {
  try {
    // console.log('getFilemakerToken');
    const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${FILEMAKER_CREDENTIALS_BASE64}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    // console.log('response', response);

    if (response.statusText === 'Service Unavailable') {
      return res.json({ error: 'Service Unavailable' });
    }

    const data = await response.json();
    // console.log('dataToken', data);
    if (!data.response || !data.response.token) {
      throw new Error('Token not found in response');
    }
    if (useRes) {
      return res.json(data);
    }
    return data;
  } catch (error) {
    console.log('error', error);
    if (useRes) {
      return res.json({ error: error.message });
    }
    return { error: error.message };
  }
}

// Obtener registros
const getRecords = async (req, res) => {
  const token = req.body.token;
  const medicoId = req.body.medicoId;
  // console.log('medicoId', medicoId);
  const body = {
    query: [
      {
        "MEDICO_ID_FK": medicoId
      }
    ],
    "sort": [
      {
        "fieldName": "FECHA_ENTRADA",
        "sortOrder": "descend"
      }
    ]
  };
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_RESULTADOSLAYOUT}/_find`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
  });
  // console.log('response', response);
  const data = await response.json();
  // console.log('data', data);
  return res.status(200).json(data);
}


// Obtener un registro por un nombre
const getRecordByName = async (req, res) => {
  const token = req.body.token;
  const name = req.body.name;
  const medicoId = req.body.medicoId;
  // console.log('medicoId', medicoId);
  const body = {
    query: [
      {
        "Nombre_Completo": name,
        "MEDICO_ID_FK": medicoId
      }
    ],
    "sort": [
      {
        "fieldName": "FECHA_ENTRADA",
        "sortOrder": "descend"
      }
    ]
  };
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_RESULTADOSLAYOUT}/_find`, {
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



const signinMedico = async (req, res) => {
  const dataTokenResponse = await getFilemakerToken(req, res, false);
  const token = dataTokenResponse.response.token;

  const username = String(req.body.username).trim();
  const password = String(req.body.password).trim();
  const body = {
    query: [
      {
        "usuario": username,
        "password": password,
        'ACCESSO_SISTEMA': 1,
      }
    ]
  };


  const url = `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_MEDICOSLAYOUT}/_find`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // console.log('data2', data);
    return res.json({...data, token});
  } catch (error) {
    res.json({ error: error.message });
  }
}

const logOutMedico = async (req, res) => {
  const token = req.body.token;
  const response = await fetch(`${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions/${token}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

module.exports = { getFilemakerToken, getRecords, getRecordByName, signinMedico,  };

// module.exports = { getFilemakerToken, getRecords, getRecordByName };
