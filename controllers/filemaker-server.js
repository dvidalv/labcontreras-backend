const axios = require('axios');
const {
  FILEMAKER_URL,
  FILEMAKER_DATABASE,
  FILEMAKER_CREDENTIALS_BASE64,
  FILEMAKER_RESULTADOSLAYOUT,
  FILEMAKER_MEDICOSLAYOUT,
  FILEMAKER_PUBLICACIONESLAYOUT,
} = require('../utils/constants');

// Obtener token de acceso
const getFilemakerToken = async (req, res, useRes = true) => {
  try {
    // console.log('getFilemakerToken');
    const response = await fetch(
      `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${FILEMAKER_CREDENTIALS_BASE64}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
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
};

// Obtener registros
const getRecords = async (req, res) => {
  let body;
  const token = req.body.token;
  const medicoId = req.body.medicoId;
  const centroExterno = req.body.centroExterno;
  if (centroExterno === 0) {
    body = {
      query: [
        {
          MEDICO_ID_FK: medicoId,
        },
      ],
      sort: [
        {
          fieldName: 'FECHA_ENTRADA',
          sortOrder: 'descend',
        },
      ],
    };
  } else {
    body = {
      query: [
        {
          centrosExternos_ID: medicoId,
        },
      ],
      sort: [
        {
          fieldName: 'FECHA_ENTRADA',
          sortOrder: 'descend',
        },
      ],
    };
  }
  const response = await fetch(
    `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_RESULTADOSLAYOUT}/_find`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const data = await response.json();
  return res.status(200).json(data);
};

// Obtener un registro por un nombre
const getRecordByName = async (req, res) => {
  let body;
  const token = req.body.token;
  const name = req.body.name;
  const medicoId = req.body.medicoId;
  const centroExterno = req.body.centroExterno;
   if(centroExterno === 0){
    body = {
      query: [
        {
          Nombre_Completo: name,
          MEDICO_ID_FK: medicoId,
        },
      ],
      sort: [
        {
          fieldName: 'FECHA_ENTRADA',
          sortOrder: 'descend',
        },
      ],
    };
   }else{
    body = {
      query: [
        {
          Nombre_Completo: name,
          centrosExternos_ID: medicoId,
        },
      ],
      sort: [
        {
          fieldName: 'FECHA_ENTRADA',
          sortOrder: 'descend',
        },
      ],
    };
   }
  const response = await fetch(
    `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_RESULTADOSLAYOUT}/_find`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  // console.log('response', response);
  const data = await response.json();
  return res.status(200).json(data);
};

const signinMedico = async (req, res) => {
  const dataTokenResponse = await getFilemakerToken(req, res, false);
  const token = dataTokenResponse.response.token;

  const username = String(req.body.username).trim();
  const password = String(req.body.password).trim();
  const body = {
    query: [
      {
        usuario: username,
        password: password,
        ACCESSO_SISTEMA: 1,
      },
    ],
  };

  const url = `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_MEDICOSLAYOUT}/_find`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    // console.log('data2', data);
    return res.json({ ...data, token });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const logOutMedico = async (req, res) => {
  const token = req.body.token;
  const response = await fetch(
    `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions/${token}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  if (response.messages[0].code === 0) {
    return res.status(200).json({ message: 'Logout exitoso' });
  }
  return res.status(500).json({ message: 'Logout fallido' });
};

const getMail = async (req, res) => {
  // console.log('getMail');
  const token = req.body.token;
  const response = await fetch(
    `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_MEDICOSLAYOUT}/_find`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// const getPublicaciones = async (req, res) => {
//   const dataTokenResponse = await getFilemakerToken(req, res, false);
//   const token = dataTokenResponse.response.token;
//   console.log('token3', token);

//   const body = {
//     query: [{}], // Consulta vacía para coincidir con todos los registros
//     sort: [
//       {
//         sortOrder: 'descend',
//       },
//     ],
//     limit: 1, // Limitar los resultados a 3
//   };

//   try {
//     const response = await fetch(
//       `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_PUBLICACIONESLAYOUT}/_find`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(body),
//       },
//     );
//     // console.log('response2', response);

//     if (!response.ok) {
//       throw new Error(`Error en la solicitud: ${response.statusText}`);
//     }

//     const data = await response.json();
//     // console.log('data', data);

//     return res.status(200).json(data);
//   } catch (error) {
//     console.error('Error al obtener publicaciones:', error);
//     return res.status(500).json({ error: error.message });
//   }
// };

const getAllPublicaciones = async (req, res) => {
  try {
    const dataTokenResponse = await getFilemakerToken(req, res, false);
    // console.log('dataTokenResponse', dataTokenResponse);
    if (!dataTokenResponse.response) {
      return res
        .status(500)
        .json({ message: 'El servidor no está disponible' });
    }

    const token = dataTokenResponse.response.token;
    const startingRecord = 1;
    const _limit = 3;
    // console.log('token3', token);

    const response = await fetch(
      `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_PUBLICACIONESLAYOUT}/records?_offset=${startingRecord}&_limit=${_limit}&_sort=[{"fieldName":"CreationTimestamp","sortOrder":"descend"}]`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!dataTokenResponse.response) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('data3', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
  }
};

const getPublicacionById = async (req, res) => {
  console.log('getPublicacionById');
  const id = req.params.id;
  console.log('id', id);
  try {
    const dataTokenResponse = await getFilemakerToken(req, res, false);
    // console.log('dataTokenResponse', dataTokenResponse);

    if (!dataTokenResponse.response) {
      return res
        .status(500)
        .json({ message: 'El servidor no está disponible' });
    }

    const token = dataTokenResponse.response.token;
    // console.log('token3', token);

    const response = await fetch(
      `${FILEMAKER_URL}/fmi/data/v2/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_PUBLICACIONESLAYOUT}/_find`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: [
            {
              primaryKey: id,
            },
          ],
        }),
      },
    );
    // console.log('response', response);

    if (!dataTokenResponse.response) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }
    const data = await response.json();
    // console.log('data', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
  }
};

const getPdf = async (req, res) => {
  try {
    const pdfUrl = req.body.url; // Reemplaza con la URL de tu PDF
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(response.data, 'binary');

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer); //
  } catch (error) {
    console.error('Error al cargar el PDF:', error);
    res
      .status(500)
      .json({ status: 'error', message: 'Error al cargar el PDF' });
  }
};

const runFilemakerScript = async (req, res) => {
  try {
    const scriptName = 'makePDF';
    const token = await getFilemakerToken();

    const response = await fetch(
      `${FILEMAKER_URL}/fmi/data/v2/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_PUBLICACIONESLAYOUT}/script/${scriptName}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('data', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al ejecutar el script:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = {
  getFilemakerToken,
  getRecords,
  getRecordByName,
  signinMedico,
  getMail,
  getAllPublicaciones,
  getPdf,
  getPublicacionById,
};

// module.exports = { getFilemakerToken, getRecords, getRecordByName };
