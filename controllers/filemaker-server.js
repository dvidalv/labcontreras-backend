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

    if (response.status === 404) {
      const error = new Error('FileMaker Service Unavailable');
      error.status = 503;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    if (!data.response || !data.response.token) {
      const error = new Error('Token not found in response');
      error.status = 400;
      throw error;
    }

    if (useRes) {
      return res.json(data);
    }
    return data;
  } catch (error) {
    console.error('FileMaker connection error:', {
      message: error.message,
      cause: error.cause?.message,
      status: error.status || 500,
      code: error.cause?.code,
      syscall: error.cause?.syscall,
      address: error.cause?.address,
      port: error.cause?.port,
    });

    const errorResponse = {
      error: error.message,
      details: {
        cause: error.cause?.message,
        code: error.cause?.code,
        syscall: error.cause?.syscall,
      },
      status: error.status || 500,
    };

    if (useRes) {
      return res.status(errorResponse.status).json(errorResponse);
    }
    return errorResponse;
  }
};

const signinMedico = async (req, res) => {
  try {
    const dataTokenResponse = await getFilemakerToken(req, res, false);

    // Verificar si hay un error en la respuesta
    if (dataTokenResponse.error) {
      return res.status(dataTokenResponse.status || 500).json({
        error: 'Error de autenticación',
        details: dataTokenResponse.error,
        message: 'No se pudo obtener el token de acceso',
      });
    }

    // Verificar si la respuesta y el token existen
    if (!dataTokenResponse.response || !dataTokenResponse.response.token) {
      return res.status(500).json({
        error: 'Error de servidor',
        message: 'No se pudo obtener el token de acceso',
      });
    }

    const token = dataTokenResponse.response.token;

    // Validar datos de entrada
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Usuario y contraseña son requeridos',
      });
    }

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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.statusText}`);
    }

    const data = await response.json();
    await logOut(token);

    return res.json({ ...data, token });
  } catch (error) {
    console.error('Error en signinMedico:', error);
    return res.status(500).json({
      error: 'Error de servidor',
      message: error.message,
      details: error.cause?.message,
    });
  }
};

const logOutMedico = async (req, res) => {
  const {
    response: { token },
  } = await getFilemakerToken(req, res, false);
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

const logOut = async (token) => {
  try {
    const response = await fetch(
      `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/sessions/${token}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.log('error', error);
  }
};

// Obtener registros
const getRecords = async (req, res) => {
  try {
    // Validar datos de entrada
    if (!req.body.medicoId) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El ID del médico es requerido',
      });
    }

    const dataTokenResponse = await getFilemakerToken(req, res, false);

    // Verificar si hay un error en la respuesta
    if (dataTokenResponse.error) {
      return res.status(dataTokenResponse.status || 500).json({
        error: 'Error de autenticación',
        details: dataTokenResponse.error,
        message: 'No se pudo obtener el token de acceso',
      });
    }

    // Verificar si la respuesta y el token existen
    if (!dataTokenResponse.response || !dataTokenResponse.response.token) {
      return res.status(500).json({
        error: 'Error de servidor',
        message: 'No se pudo obtener el token de acceso',
      });
    }

    const { token } = dataTokenResponse.response;
    const medicoId = req.body.medicoId;
    const centroExterno = req.body.centroExterno || 0;

    const body = {
      query: [
        {
          [centroExterno === 0 ? 'MEDICO_ID_FK' : 'centrosExternos_ID']:
            medicoId,
        },
      ],
      sort: [
        {
          fieldName: 'FECHA_ENTRADA',
          sortOrder: 'descend',
        },
      ],
    };

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

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.statusText}`);
    }

    const data = await response.json();
    await logOut(token);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en getRecords:', error);
    return res.status(500).json({
      error: 'Error de servidor',
      message: error.message,
      details: error.cause?.message,
    });
  }
};

// Obtener un registro por un nombre
const getRecordByName = async (req, res) => {
  let body;
  const {
    response: { token },
  } = await getFilemakerToken(req, res, false);
  const name = req.body.name;
  const medicoId = req.body.medicoId;
  const centroExterno = req.body.centroExterno;
  if (centroExterno === 0) {
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
  } else {
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
  await logOut(token);
  return res.status(200).json(data);
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

const getAllPublicaciones = async (req, res) => {
  try {
    let response;
    const search = req.body.search;

    const dataTokenResponse = await getFilemakerToken(req, res, false);
    // console.log('dataTokenResponse', dataTokenResponse);
    if (!dataTokenResponse.response) {
      return res
        .status(500)
        .json({ message: 'El servidor no está disponible' });
    }

    const token = dataTokenResponse.response.token;
    const startingRecord = 1;
    // const _limit = 6;
    // console.log('token3', token);

    if (!search) {
      response = await fetch(
        `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_PUBLICACIONESLAYOUT}/records?_offset=${startingRecord}&_sort=[{"fieldName":"CreationTimestamp","sortOrder":"descend"}]`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      logOut(token);
    } else {

      response = await fetch(
        `${FILEMAKER_URL}/fmi/data/vLatest/databases/${FILEMAKER_DATABASE}/layouts/${FILEMAKER_PUBLICACIONESLAYOUT}/_find`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: [
              {
                titulo: search,
              },
            ],
          }),
        },
      );
      logOut(token);
    }
    //  console.log('response', response);

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
  // console.log('getPublicacionById');
  const id = req.params.id;
  // console.log('id', id);
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

    // if (!dataTokenResponse.response) {
    //   throw new Error(`Error en la solicitud: ${response.statusText}`);
    // }
    const data = await response.json();
    await logOut(token);
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
