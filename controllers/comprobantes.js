const httpStatus = require('http-status');
const { Comprobante } = require('../models/comprobante');
const axios = require('axios');
const QRCode = require('qrcode');
const {
  THEFACTORY_AUTH_URL,
  THEFACTORY_ENVIAR_URL,
  THEFACTORY_ESTATUS_URL,
  THEFACTORY_USUARIO,
  THEFACTORY_CLAVE,
  THEFACTORY_RNC,
} = require('../utils/constants');

// Cache del token de TheFactoryHKA
let tokenCache = {
  token: null,
  fechaExpiracion: null,
};

// Función para obtener token de autenticación de TheFactoryHKA
const obtenerTokenTheFactory = async () => {
  try {
    // Verificar si tenemos un token válido en cache
    if (tokenCache.token && tokenCache.fechaExpiracion) {
      const ahora = new Date();
      const expiracion = new Date(tokenCache.fechaExpiracion);

      // Si el token expira en menos de 5 minutos, renovarlo
      const cincoMinutos = 5 * 60 * 1000; // 5 minutos en ms
      if (expiracion.getTime() - ahora.getTime() > cincoMinutos) {
        console.log(
          'Usando token desde cache:',
          tokenCache.token.substring(0, 20) + '...',
        );
        return tokenCache.token;
      }
    }

    console.log('Obteniendo nuevo token de TheFactoryHKA...');

    // Realizar petición de autenticación
    const authRequest = {
      usuario: THEFACTORY_USUARIO,
      clave: THEFACTORY_CLAVE,
      rnc: THEFACTORY_RNC,
    };

    const response = await axios.post(THEFACTORY_AUTH_URL, authRequest, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 segundos para auth
    });

    console.log('Respuesta de autenticación:', response.data);

    // Verificar que la autenticación fue exitosa
    if (response.data.codigo !== 0) {
      throw new Error(`Error de autenticación: ${response.data.mensaje}`);
    }

    // Actualizar cache
    tokenCache.token = response.data.token;
    tokenCache.fechaExpiracion = response.data.fechaExpiracion;

    console.log(
      'Token obtenido exitosamente, expira:',
      tokenCache.fechaExpiracion,
    );

    return tokenCache.token;
  } catch (error) {
    console.error('Error al obtener token de TheFactoryHKA:', error);

    if (error.response) {
      throw new Error(
        `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout al conectar con el servicio de autenticación');
    }

    throw new Error(`Error de autenticación: ${error.message}`);
  }
};

// Función para determinar si la fecha de vencimiento es obligatoria según el tipo de NCF
const esFechaVencimientoObligatoria = (tipoDocumento) => {
  // Según la documentación de la DGII, estos tipos requieren fecha de vencimiento:
  const tiposObligatorios = [
    '31',
    '33',
    '34',
    '41',
    '43',
    '44',
    '45',
    '46',
    '47',
  ];

  // Tipos opcionales: '32' (Factura de Consumo)
  const esObligatorio = tiposObligatorios.includes(tipoDocumento);

  console.log(
    `📅 Fecha vencimiento para tipo ${tipoDocumento}: ${esObligatorio ? 'OBLIGATORIA' : 'OPCIONAL'}`,
  );

  return esObligatorio;
};

// Función para generar URL del QR Code para la DGII según el monto
const generarUrlQR = (responseData, facturaOriginal) => {
  try {
    const montoTotal = parseFloat(facturaOriginal.factura.total || 0);
    const LIMITE_MONTO = 250000; // RD$250,000

    // URLs oficiales según informe técnico DGII - diferentes endpoints según monto
    const esMontoAlto = montoTotal >= LIMITE_MONTO;
    const baseUrl = esMontoAlto
      ? 'https://ecf.dgii.gov.do/ecf/ConsultaTimbre' // ≥ RD$250,000
      : 'https://fc.dgii.gov.do/eCF/ConsultaTimbreFC'; // < RD$250,000

    // Parámetros según especificación DGII
    const params = new URLSearchParams({
      rnc: facturaOriginal.emisor.rnc,
      ncf: facturaOriginal.factura.ncf,
      codigo: responseData.codigoSeguridad,
      fecha: responseData.fechaEmision.substring(0, 10), // Solo fecha DD-MM-YYYY
    });

    // Agregar monto solo para facturas de alto valor (≥ RD$250,000)
    if (esMontoAlto) {
      params.append('monto', montoTotal.toFixed(2));
    }

    const urlCompleta = `${baseUrl}?${params.toString()}`;

    console.log(
      `📱 URL QR oficial DGII para monto RD$${montoTotal.toLocaleString()}: ${urlCompleta}`,
    );
    console.log(
      `📊 Endpoint: ${esMontoAlto ? 'ALTO VALOR (≥$250K)' : 'ESTÁNDAR (<$250K)'} - ${baseUrl}`,
    );

    return urlCompleta;
  } catch (error) {
    console.error('❌ Error al generar datos del QR:', error);
    return null;
  }
};

// Función para generar código QR según especificaciones de la DGII
const generarCodigoQR = async (req, res) => {
  try {
    const {
      url,
      rnc,
      ncf,
      codigo,
      fecha,
      monto,
      formato = 'png',
      tamaño = 300,
    } = req.body;

    let urlParaQR;

    // Opción 1: URL completa proporcionada (método anterior)
    if (url) {
      urlParaQR = url;
    }
    // Opción 2: Parámetros individuales (método mejorado)
    else if (rnc && ncf && codigo && fecha) {
      // URLs oficiales según informe técnico DGII - diferentes endpoints según monto
      const montoTotal = parseFloat(monto || 0);
      const LIMITE_MONTO = 250000; // RD$250,000

      const esMontoAlto = montoTotal >= LIMITE_MONTO;
      const baseUrl = esMontoAlto
        ? 'https://ecf.dgii.gov.do/ecf/ConsultaTimbre' // ≥ RD$250,000
        : 'https://fc.dgii.gov.do/eCF/ConsultaTimbreFC'; // < RD$250,000

      // Parámetros según especificación DGII
      const params = new URLSearchParams({
        rnc: rnc,
        ncf: ncf,
        codigo: codigo,
        fecha: fecha.substring(0, 10), // Solo fecha DD-MM-YYYY
      });

      // Agregar monto solo para facturas de alto valor (≥ RD$250,000)
      if (esMontoAlto) {
        params.append('monto', montoTotal.toFixed(2));
      }

      urlParaQR = `${baseUrl}?${params.toString()}`;

      console.log(
        `📱 URL QR oficial DGII para monto RD$${montoTotal.toLocaleString()}: ${urlParaQR}`,
      );
      console.log(
        `📊 Endpoint: ${esMontoAlto ? 'ALTO VALOR (≥$250K)' : 'ESTÁNDAR (<$250K)'} - ${baseUrl}`,
      );
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Parámetros insuficientes para generar el código QR',
        details:
          'Debe proporcionar: url completa O (rnc + ncf + codigo + fecha + monto opcional)',
      });
    }

    // Configuración según recomendaciones de la DGII
    const opcionesQR = {
      version: 8, // Versión 8 recomendada por la DGII
      errorCorrectionLevel: 'M', // Nivel medio de corrección de errores
      type: formato === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: 1, // Margen recomendado (4 módulos para mejor lectura)
      color: {
        dark: '#000000', // Color negro para el QR
        light: '#FFFFFF', // Fondo blanco
      },
      width: Math.max(parseInt(tamaño) || 300, 150), // Mínimo 150px (~2.5cm a 150 DPI)
    };

    console.log(`📱 Generando QR Code versión 8 para URL: ${urlParaQR}`);
    console.log(`📏 Configuración: ${formato.toUpperCase()}, ${tamaño}px`);

    // Generar el código QR
    let qrData;
    if (formato === 'svg') {
      qrData = await QRCode.toString(urlParaQR, { ...opcionesQR, type: 'svg' });
    } else {
      qrData = await QRCode.toDataURL(urlParaQR, opcionesQR);
    }

    // Respuesta exitosa
    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Código QR generado exitosamente',
      data: {
        url: urlParaQR,
        qrCode: qrData,
        formato: formato,
        tamaño: tamaño,
        version: 8,
        parametrosUsados: url ? 'URL completa' : 'Parámetros individuales',
        especificaciones: {
          errorCorrection: 'M',
          cumpleNormativaDGII: true,
          versionRecomendada: 8,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error al generar código QR:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno al generar el código QR',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Función para normalizar el estado de la factura devuelto por TheFactoryHKA
const normalizarEstadoFactura = (estadoOriginal, datosCompletos) => {
  // Convertir a mayúsculas para comparación
  const estado = (estadoOriginal || '').toString().toUpperCase();

  // PRIORIDAD 1: Verificar campo 'procesado' y código numérico primero
  if (datosCompletos.procesado === true) {
    // Si está procesado y tiene código exitoso
    if (datosCompletos.codigo === 0 || datosCompletos.codigo === 1) {
      return 'APROBADA';
    }
    // Si está procesado pero tiene código de error o estado especial
    if (datosCompletos.codigo !== undefined && datosCompletos.codigo > 1) {
      switch (datosCompletos.codigo) {
        // ⏳ Estados en proceso
        case 2:
        case 10:
        case 15:
        case 95:
          return 'EN_PROCESO';

        // ❌ Errores de NCF
        case 108:
          return 'NCF_INVALIDO'; // NCF ya presentado
        case 109:
          return 'NCF_VENCIDO'; // NCF vencido o fuera de rango

        // ❌ Errores de autorización
        case 110:
          return 'RNC_NO_AUTORIZADO'; // RNC no autorizado

        // ❌ Errores de validación de datos
        case 111:
        case 112:
        case 113:
        case 114:
          return 'DATOS_INVALIDOS'; // Datos/estructura/totales inválidos

        // ❌ Estados de rechazo DGII
        case 200:
        case 201:
        case 202:
        case 203:
          return 'RECHAZADA'; // Rechazado por DGII

        // 🚫 Estados de cancelación
        case 300:
        case 301:
          return 'ANULADA'; // Documento anulado/cancelado

        default:
          console.warn(
            `⚠️ Código de TheFactoryHKA no mapeado: ${datosCompletos.codigo}`,
          );
          return 'ERROR';
      }
    }
  }

  // PRIORIDAD 2: Estados exitosos por mensaje/texto
  if (
    estado.includes('APROBADA') ||
    estado.includes('ACEPTADA') ||
    estado.includes('ACEPTADO') ||
    estado.includes('PROCESADA') ||
    estado.includes('EXITOSA') ||
    estado.includes('SUCCESS') ||
    estado === 'OK'
  ) {
    return 'APROBADA';
  }

  // Estados de procesamiento
  if (
    estado.includes('PROCESO') ||
    estado.includes('PROCESANDO') ||
    estado.includes('VALIDANDO') ||
    estado.includes('PENDING')
  ) {
    return 'EN_PROCESO';
  }

  // Estados de error específicos
  if (
    estado.includes('NCF') &&
    (estado.includes('INVALIDO') || estado.includes('USADO'))
  ) {
    return 'NCF_INVALIDO';
  }

  if (estado.includes('RNC') && estado.includes('NO_AUTORIZADO')) {
    return 'RNC_NO_AUTORIZADO';
  }

  // Estados de error generales
  if (
    estado.includes('RECHAZADA') ||
    estado.includes('ERROR') ||
    estado.includes('FAILED') ||
    estado.includes('INVALID')
  ) {
    return 'RECHAZADA';
  }

  // Estados de cancelación
  if (
    estado.includes('ANULADA') ||
    estado.includes('CANCELADA') ||
    estado.includes('CANCELLED')
  ) {
    return 'ANULADA';
  }

  // PRIORIDAD 3: Verificar código numérico independiente (si no se verificó arriba)
  if (datosCompletos.codigo !== undefined) {
    switch (datosCompletos.codigo) {
      // ✅ Estados exitosos
      case 0:
      case 1:
        return 'APROBADA';

      // ⏳ Estados en proceso
      case 2:
      case 10:
      case 15:
      case 95:
        return 'EN_PROCESO';

      // ❌ Errores de NCF
      case 108:
        return 'NCF_INVALIDO';
      case 109:
        return 'NCF_VENCIDO';

      // ❌ Errores de autorización
      case 110:
        return 'RNC_NO_AUTORIZADO';

      // ❌ Errores de validación de datos
      case 111:
      case 112:
      case 113:
      case 114:
        return 'DATOS_INVALIDOS';

      // ❌ Estados de rechazo DGII
      case 200:
      case 201:
      case 202:
      case 203:
        return 'RECHAZADA';

      // 🚫 Estados de cancelación
      case 300:
      case 301:
        return 'ANULADA';

      default:
        console.warn(
          `⚠️ Código de TheFactoryHKA no mapeado: ${datosCompletos.codigo}`,
        );
        return 'ERROR';
    }
  }

  // Si no coincide con ningún patrón conocido
  return estado || 'DESCONOCIDO';
};

// Función para consultar el estatus de un documento en TheFactoryHKA
const consultarEstatusInmediato = async (ncf) => {
  try {
    console.log(`🔍 Consultando estatus inmediato para NCF: ${ncf}`);

    const token = await obtenerTokenTheFactory();

    const payload = {
      token: token,
      rnc: THEFACTORY_RNC,
      documento: ncf,
    };

    console.log('Payload para consulta de estatus:', payload);

    const response = await axios.post(THEFACTORY_ESTATUS_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos
    });

    console.log('Respuesta de estatus TheFactoryHKA:', response.data);

    return {
      consultaExitosa: true,
      datosEstatus: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error al consultar estatus (no crítico):', error.message);

    // No lanzamos error, solo devolvemos información de que falló
    return {
      consultaExitosa: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Crear un nuevo rango de numeración de e-CF
const createComprobante = async (req, res) => {
  try {
    // Agregar el ID del usuario autenticado al rango
    const rangoData = {
      ...req.body,
      usuario: req.user._id,
    };

    const rango = await Comprobante.create(rangoData);

    return res.status(httpStatus.CREATED).json({
      status: 'success',
      message: 'Rango de numeración creado exitosamente',
      data: rango,
    });
  } catch (err) {
    console.error('Error al crear rango de numeración:', err);

    if (err.name === 'ValidationError') {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Datos del rango inválidos',
        details: err.message,
      });
    }

    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        status: 'error',
        message:
          'Ya existe un rango con esos números para este RNC y tipo de comprobante',
      });
    }

    // Manejar error de superposición de rangos
    if (err.message.includes('Ya existe un rango con números superpuestos')) {
      return res.status(httpStatus.CONFLICT).json({
        status: 'error',
        message: err.message,
      });
    }

    if (err.message.includes('El número final debe ser mayor')) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: err.message,
      });
    }

    if (err.message.includes('La fecha de vencimiento debe ser posterior')) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: err.message,
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al crear el rango de numeración',
    });
  }
};

// Obtener todos los rangos de numeración del usuario
const getAllComprobantes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      estado,
      tipo_comprobante,
      rnc,
      vencimiento_proximo,
    } = req.query;

    console.log('estado', estado);
    console.log('tipo_comprobante', tipo_comprobante);
    console.log('rnc', rnc);
    console.log('vencimiento_proximo', vencimiento_proximo);

    const skip = (page - 1) * limit;

    // Construir filtros - REMOVIDO filtro por usuario para mostrar todos los comprobantes
    const filters = {};
    if (estado) filters.estado = estado;
    if (tipo_comprobante) filters.tipo_comprobante = tipo_comprobante;
    if (rnc) filters.rnc = new RegExp(rnc, 'i');

    // Filtro para rangos que vencen pronto (próximos 30 días)
    if (vencimiento_proximo === 'true') {
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() + 30);
      filters.fecha_vencimiento = { $lte: treintaDias };
    }

    const rangos = await Comprobante.find(filters)
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('usuario', 'name email');

    const total = await Comprobante.countDocuments(filters);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Rangos de numeración encontrados',
      data: rangos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error al obtener rangos:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al obtener rangos de numeración',
    });
  }
};

// Obtener un rango por ID
const getComprobanteById = async (req, res) => {
  try {
    const { id } = req.params;

    const rango = await Comprobante.findOne({
      _id: id,
      usuario: req.user._id,
    }).populate('usuario', 'name email');

    if (!rango) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Rango de numeración no encontrado',
      });
    }

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Rango de numeración encontrado',
      data: rango,
    });
  } catch (err) {
    console.error('Error al obtener rango:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al obtener el rango',
    });
  }
};

// Actualizar un rango de numeración
const updateComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el rango existente
    const existingRango = await Comprobante.findOne({
      _id: id,
      usuario: req.user._id,
    });

    if (!existingRango) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Rango de numeración no encontrado',
      });
    }

    // Solo permitir actualización de ciertos campos si ya se han utilizado números
    if (existingRango.numeros_utilizados > 0) {
      const camposPermitidos = [
        'comentario',
        'alerta_minima_restante',
        'estado',
      ];
      const camposEnviados = Object.keys(req.body);
      const camposNoPermitidos = camposEnviados.filter(
        (campo) => !camposPermitidos.includes(campo),
      );

      if (camposNoPermitidos.length > 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `No se pueden modificar estos campos cuando ya se han utilizado números: ${camposNoPermitidos.join(', ')}`,
        });
      }
    }

    // Para evitar problemas con validaciones en findByIdAndUpdate,
    // actualizamos campo por campo en el documento existente
    Object.assign(existingRango, req.body);
    existingRango.fechaActualizacion = Date.now();

    const rango = await existingRango.save();

    // Populate el usuario para mantener la consistencia con otras respuestas
    await rango.populate('usuario', 'name email');

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Rango de numeración actualizado exitosamente',
      data: rango,
    });
  } catch (err) {
    console.error('Error al actualizar rango:', err);

    if (err.name === 'ValidationError') {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Datos del rango inválidos',
        details: err.message,
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al actualizar el rango',
    });
  }
};

// Cambiar estado de un rango
const updateComprobanteEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validEstados = ['activo', 'vencido', 'agotado'];
    if (!validEstados.includes(estado)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Estado inválido. Debe ser: activo, vencido o agotado',
      });
    }

    const rango = await Comprobante.findOneAndUpdate(
      { _id: id, usuario: req.user._id },
      { estado, fechaActualizacion: Date.now() },
      { new: true },
    ).populate('usuario', 'name email');

    if (!rango) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Rango de numeración no encontrado',
      });
    }

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Estado del rango actualizado exitosamente',
      data: rango,
    });
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al actualizar el estado',
    });
  }
};

// Eliminar un rango (solo si no se han utilizado números)
const deleteComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    const rango = await Comprobante.findOne({
      _id: id,
      usuario: req.user._id,
    });

    if (!rango) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Rango de numeración no encontrado',
      });
    }

    if (rango.numeros_utilizados > 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message:
          'No se puede eliminar un rango que ya tiene números utilizados',
      });
    }

    await Comprobante.findByIdAndDelete(id);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Rango de numeración eliminado exitosamente',
    });
  } catch (err) {
    console.error('Error al eliminar rango:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al eliminar el rango',
    });
  }
};

// Obtener estadísticas de rangos del usuario
const getComprobantesStats = async (req, res) => {
  try {
    const stats = await Comprobante.aggregate([
      { $match: { usuario: req.user._id } },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          totalNumeros: { $sum: '$cantidad_numeros' },
          numerosUtilizados: { $sum: '$numeros_utilizados' },
          numerosDisponibles: { $sum: '$numeros_disponibles' },
        },
      },
    ]);

    const totalRangos = await Comprobante.countDocuments({
      usuario: req.user._id,
    });

    // Rangos que vencen en los próximos 30 días
    const treintaDias = new Date();
    treintaDias.setDate(treintaDias.getDate() + 30);

    const vencenProximamente = await Comprobante.countDocuments({
      usuario: req.user._id,
      fecha_vencimiento: { $lte: treintaDias },
      estado: 'activo',
    });

    // Rangos con alertas (números disponibles <= alerta_minima_restante)
    const conAlertas = await Comprobante.countDocuments({
      usuario: req.user._id,
      $expr: { $lte: ['$numeros_disponibles', '$alerta_minima_restante'] },
      estado: 'activo',
    });

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        totalRangos,
        vencenProximamente,
        conAlertas,
        porEstado: stats,
      },
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al obtener estadísticas',
    });
  }
};

// Consumir un número de un rango específico
const consumirNumero = async (req, res) => {
  try {
    const { id } = req.params;

    const rango = await Comprobante.findOne({
      _id: id,
      usuario: req.user._id,
    });

    if (!rango) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Rango de numeración no encontrado',
      });
    }

    if (!rango.esValido()) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El rango no está disponible (vencido, agotado o inactivo)',
      });
    }

    await rango.consumirNumero();

    // Calcular el número que se acaba de consumir
    const numeroConsumido = rango.numero_inicial + rango.numeros_utilizados - 1;

    // Formatear el número según estructura e-CF
    const numeroFormateado = rango.formatearNumeroECF(numeroConsumido);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Número consumido exitosamente',
      data: {
        numeroConsumido: numeroConsumido,
        numeroFormateado: numeroFormateado,
        numerosDisponibles: rango.numeros_disponibles,
        estadoRango: rango.estado,
      },
    });
  } catch (err) {
    console.error('Error al consumir número:', err);

    if (err.message.includes('No hay números disponibles')) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: err.message,
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al consumir número',
    });
  }
};

// Consumir un número por RNC y tipo de comprobante
const consumirNumeroPorRnc = async (req, res) => {
  try {
    const { rnc, tipo_comprobante } = req.body;
    console.log('🔍 Datos recibidos en consumirNumeroPorRnc:', req.body);

    // Validar que se proporcionen los datos requeridos
    if (!rnc || !tipo_comprobante) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'RNC y tipo de comprobante son requeridos',
      });
    }

    // console.log(rnc, tipo_comprobante);

    // Buscar un rango activo y válido para este RNC y tipo de comprobante (SIN filtrar por usuario)
    const rango = await Comprobante.findOne({
      rnc: rnc,
      tipo_comprobante: tipo_comprobante,
      estado: 'activo',
      numeros_disponibles: { $gt: 0 }, // Agregado para verificar que haya números disponibles
      fecha_vencimiento: { $gte: new Date() }, // Agregado para verificar que el rango no haya vencido
    }).sort({ fecha_creacion: 1 }); // Usar el rango más antiguo primero

    if (!rango) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message:
          'No se encontró un rango activo disponible para este RNC y tipo de comprobante',
      });
    }

    // Verificar que el rango sea válido
    if (!rango.esValido()) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El rango no está disponible (vencido, agotado o inactivo)',
      });
    }

    await rango.consumirNumero(); // Consumir el número

    // Calcular el número que se acaba de consumir
    const numeroConsumido = rango.numero_inicial + rango.numeros_utilizados - 1;

    // Formatear el número según estructura e-CF
    const numeroFormateado = rango.formatearNumeroECF(numeroConsumido);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Número consumido exitosamente',
      data: {
        numeroConsumido: numeroConsumido,
        numeroFormateado: numeroFormateado,
        numerosDisponibles: rango.numeros_disponibles,
        fechaVencimiento: rango.fecha_vencimiento,
        estadoRango: rango.estado,
        rnc: rango.rnc,
        tipoComprobante: rango.tipo_comprobante,
        prefijo: rango.prefijo || '',
        rangoId: rango._id,
      },
    });
  } catch (err) {
    console.error('Error al consumir número por RNC:', err);

    if (err.message === 'No hay números disponibles en este rango') {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'No hay números disponibles en el rango',
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor',
    });
  }
};

// Función para convertir strings vacíos a null (requerido por TheFactoryHKA)
const stringVacioANull = (valor) => {
  if (valor === '' || valor === undefined || valor === null) {
    return null;
  }
  return typeof valor === 'string' ? valor.trim() || null : valor;
};

// Función para transformar JSON simplificado al formato de TheFactoryHKA
const transformarFacturaParaTheFactory = (facturaSimple, token) => {
  const { comprador, emisor, factura, items } = facturaSimple;

  // Validar que tenemos los datos básicos necesarios
  if (
    !comprador?.rnc ||
    !emisor?.rnc ||
    !factura?.ncf ||
    !factura?.tipo ||
    !items?.length
  ) {
    throw new Error('Faltan datos obligatorios en la factura');
  }

  // 📅 Formatear y validar fecha de vencimiento del NCF
  // Calcular dinámicamente una fecha de vencimiento segura como fallback
  const fechaActual = new Date();
  const añoActual = fechaActual.getFullYear();
  const mesActual = fechaActual.getMonth() + 1; // getMonth() retorna 0-11

  // Si estamos en diciembre, usar el próximo año para evitar vencimiento inmediato
  const añoVencimiento = mesActual === 12 ? añoActual + 1 : añoActual;
  let fechaVencimientoFormateada = `31-12-${añoVencimiento}`; // Fecha segura y dinámica
  if (factura.fechaVencNCF) {
    try {
      // Validar formato de fecha (puede venir como DD-MM-YYYY o YYYY-MM-DD)
      const fecha = factura.fechaVencNCF;
      if (fecha.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // Ya está en formato DD-MM-YYYY
        fechaVencimientoFormateada = fecha;
      } else if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Convertir de YYYY-MM-DD a DD-MM-YYYY
        const [year, month, day] = fecha.split('-');
        fechaVencimientoFormateada = `${day}-${month}-${year}`;
      } else {
        console.warn(
          `⚠️ Formato de fecha NCF no reconocido: ${fecha}, usando fecha calculada: ${fechaVencimientoFormateada}`,
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ Error al procesar fecha de vencimiento NCF: ${error.message}, usando fecha calculada: ${fechaVencimientoFormateada}`,
      );
    }
  } else {
    console.log(
      `📅 fechaVencNCF no proporcionada, usando fecha calculada: ${fechaVencimientoFormateada} (año actual: ${añoActual}, mes: ${mesActual})`,
    );
  }

  console.log(`📅 Fecha vencimiento NCF final: ${fechaVencimientoFormateada}`);

  // Calcular totales PRIMERO
  const montoTotal = parseFloat(factura.total).toFixed(2);

  // Función para limpiar y parsear montos con comas
  const parsearMonto = (monto) => {
    if (!monto) return 0;
    // Remover comas y parsear como número
    const montoLimpio = monto.toString().replace(/,/g, '');
    return parseFloat(montoLimpio) || 0;
  };

  // 🧮 Calcular montoExento basado en los items (con parsing correcto)
  // Lógica de cálculo de montos según el tipo de comprobante
  let montoExentoCalculado, montoGravadoCalculado;

  if (factura.tipo === '45') {
    // Tipo 45 (Gubernamental): Por defecto todos los items son GRAVADOS
    // Solo si se marca explícitamente como exento, se considera exento
    montoExentoCalculado = items
      .reduce((suma, item) => {
        const precio = parsearMonto(item.precio);
        // Solo si específicamente se marca como exento
        if (
          item.itbis === false ||
          item.exento === true ||
          item.gravado === false
        ) {
          return suma + precio;
        }
        return suma; // Por defecto gravado para tipo 45
      }, 0)
      .toFixed(2);

    montoGravadoCalculado = items
      .reduce((suma, item) => {
        const precio = parsearMonto(item.precio);
        // Si específicamente se marca como exento, no lo incluimos en gravado
        if (
          item.itbis === false ||
          item.exento === true ||
          item.gravado === false
        ) {
          return suma;
        }
        // Por defecto gravado para tipo 45
        return suma + precio;
      }, 0)
      .toFixed(2);
  } else {
    // Para otros tipos: servicios médicos generalmente son exentos de ITBIS
    // Si un item tiene .itbis = false o .exento = true, se considera exento
    // Si no tiene esas propiedades, asumimos que es exento (servicios médicos)
    montoExentoCalculado = items
      .reduce((suma, item) => {
        const precio = parsearMonto(item.precio);
        // Si específicamente se marca como gravado, no lo incluimos en exento
        if (item.itbis === true || item.gravado === true) {
          return suma; // No sumarlo al exento
        }
        // Por defecto, servicios médicos son exentos
        return suma + precio;
      }, 0)
      .toFixed(2);

    // Calcular monto gravado (lo que no es exento)
    montoGravadoCalculado = items
      .reduce((suma, item) => {
        const precio = parsearMonto(item.precio);
        // Solo si específicamente se marca como gravado
        if (item.itbis === true || item.gravado === true) {
          return suma + precio;
        }
        return suma;
      }, 0)
      .toFixed(2);
  }

  console.log(`💰 Cálculo de totales:`, {
    tipoComprobante: factura.tipo,
    montoTotalFactura: montoTotal,
    montoExentoCalculado: montoExentoCalculado,
    montoGravadoCalculado: montoGravadoCalculado,
    sumaCalculada: (
      parseFloat(montoExentoCalculado) + parseFloat(montoGravadoCalculado)
    ).toFixed(2),
    diferencia: (
      parseFloat(montoTotal) -
      parseFloat(montoExentoCalculado) -
      parseFloat(montoGravadoCalculado)
    ).toFixed(2),
  });

  // Construir los detalles de items DESPUÉS de calcular los montos - camelCase según ejemplo oficial
  const detallesItems = items.map((item, index) => {
    // Determinar si este item específico es gravado o exento
    let itemEsGravado = false;

    if (factura.tipo === '45') {
      // Tipo 45 (Gubernamental): Servicios médicos son EXENTOS por defecto
      // Solo gravado si se marca explícitamente con itbis=true o gravado=true
      itemEsGravado = item.itbis === true || item.gravado === true;
    } else {
      // Otros tipos: Por defecto exento (servicios médicos), solo gravado si se marca explícitamente
      itemEsGravado = item.itbis === true || item.gravado === true;
    }

    const itemCompleto = {
      NumeroLinea: (index + 1).toString(),
      IndicadorFacturacion: itemEsGravado ? '1' : '4', // 1=gravado, 4=exento
    };

    // Para tipos 41, 46, 47: incluir sección retencion OBLIGATORIA
    // NOTA: Tipos 43, 44 y 45 NO incluyen retención según validación de TheFactoryHKA
    if (
      factura.tipo === '41' ||
      factura.tipo === '46' ||
      factura.tipo === '47'
    ) {
      itemCompleto.retencion = {
        indicadorAgente: '1',
        montoITBIS: itemEsGravado
          ? (parsearMonto(item.precio) * 0.18).toFixed(2)
          : '0.00',
        montoISR: '0.00',
      };
    }

    // Campos comunes para todos los tipos (PascalCase según ejemplo oficial)
    return {
      ...itemCompleto,
      Nombre: stringVacioANull(item.nombre),
      IndicadorBienoServicio: item.indicadorBienoServicio || '1', // 1=Bien, 2=Servicio
      Descripcion: item.descripcion || null,
      Cantidad: item.cantidad || '1.00',
      UnidadMedida: item.unidadMedida || '43', // 43 = Unidad
      PrecioUnitario: parsearMonto(item.precio).toFixed(2),
      Monto: parsearMonto(item.precio).toFixed(2),
    };
  });

  // 🔍 Debug: Verificar suma individual de items vs totales calculados
  let sumaItemsGravados = detallesItems
    .filter((item) => item.IndicadorFacturacion === '1')
    .reduce((suma, item) => suma + parseFloat(item.Monto), 0)
    .toFixed(2);

  let sumaItemsExentos = detallesItems
    .filter((item) => item.IndicadorFacturacion === '4')
    .reduce((suma, item) => suma + parseFloat(item.Monto), 0)
    .toFixed(2);

  // 🔧 Para tipo 45: Ajustar montos de items si hay diferencia con total declarado
  if (factura.tipo === '45') {
    const totalDeclarado = parseFloat(montoTotal);
    const detalleCalculado = parseFloat(sumaItemsGravados);
    const diferencia = Math.abs(totalDeclarado - detalleCalculado);

    // Si hay diferencia mínima, ajustar los montos de los items proporcionalmente
    if (diferencia <= 1.0 && diferencia > 0) {
      const factorAjuste = totalDeclarado / detalleCalculado;

      console.log(`🔧 Ajustando montos de items para tipo 45:`, {
        totalDeclarado: totalDeclarado,
        detalleCalculado: detalleCalculado,
        diferencia: diferencia.toFixed(2),
        factorAjuste: factorAjuste.toFixed(4),
      });

      // Ajustar cada item gravado proporcionalmente
      detallesItems.forEach((item) => {
        if (item.IndicadorFacturacion === '1') {
          const montoOriginal = parseFloat(item.Monto);
          const montoAjustado = (montoOriginal * factorAjuste).toFixed(2);
          item.Monto = montoAjustado;
          item.PrecioUnitario = montoAjustado; // También ajustar precio unitario

          console.log(`  Item ajustado: ${montoOriginal} → ${montoAjustado}`);
        }
      });

      // Recalcular sumas después del ajuste
      sumaItemsGravados = detallesItems
        .filter((item) => item.IndicadorFacturacion === '1')
        .reduce((suma, item) => suma + parseFloat(item.Monto), 0)
        .toFixed(2);
    }
  }

  console.log(`🔍 Verificación detalle vs totales:`, {
    tipoComprobante: factura.tipo,
    itemsGravadosDetalle: sumaItemsGravados,
    montoGravadoCalculado: montoGravadoCalculado,
    diferenciaGravado: (
      parseFloat(sumaItemsGravados) - parseFloat(montoGravadoCalculado)
    ).toFixed(2),
    itemsExentosDetalle: sumaItemsExentos,
    montoExentoCalculado: montoExentoCalculado,
    diferenciaExento: (
      parseFloat(sumaItemsExentos) - parseFloat(montoExentoCalculado)
    ).toFixed(2),
  });

  // Formatear fecha (DD-MM-YYYY)
  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    // Si viene en formato DD-MM-YYYY, lo mantenemos
    if (fecha.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return fecha;
    }
    // Si viene en otro formato, lo convertimos
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  // Estructura completa para TheFactoryHKA - CORREGIDA según ejemplo oficial
  const documentoCompleto = {
    Token: token,
    DocumentoElectronico: {
      Encabezado: {
        IdentificacionDocumento: (() => {
          const baseIdDoc = {
            TipoDocumento: factura.tipo,
            NCF: factura.ncf,
            FechaVencimientoSecuencia: esFechaVencimientoObligatoria(
              factura.tipo,
            )
              ? fechaVencimientoFormateada
              : null,
          };

          // Configuración específica por tipo de comprobante
          if (
            factura.tipo === '31' ||
            factura.tipo === '32' ||
            factura.tipo === '33'
          ) {
            // Tipos 31, 32, 33: Facturas y Notas de Débito - incluyen indicadorEnvioDiferido
            return {
              ...baseIdDoc,
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              IndicadorEnvioDiferido: '1',
              TipoIngresos: '01',
              TipoPago: '1',
              TablaFormasPago: [
                {
                  Forma: '1',
                  Monto: montoTotal,
                },
              ],
            };
          } else if (factura.tipo === '34') {
            // Tipo 34: Nota de Crédito - estructura especial SIN fechaVencimiento ni indicadorEnvioDiferido
            return {
              TipoDocumento: factura.tipo,
              NCF: factura.ncf,
              // NO incluir FechaVencimientoSecuencia para tipo 34
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              IndicadorNotaCredito: '0', // OBLIGATORIO para tipo 34
              TipoIngresos: '01',
              TipoPago: '1',
            };
          } else if (factura.tipo === '41') {
            // Tipo 41: Compras - incluyen indicadorMontoGravado pero NO indicadorEnvioDiferido
            return {
              ...baseIdDoc,
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              TipoPago: '1',
              TablaFormasPago: [
                {
                  Forma: '1',
                  Monto: montoTotal,
                },
              ],
            };
          } else if (factura.tipo === '43') {
            // Tipo 43: Gastos Menores - estructura muy simple, solo campos básicos
            return {
              ...baseIdDoc,
            };
          } else if (factura.tipo === '45') {
            // Tipo 45: Gubernamental - incluye indicadorMontoGravado y tipoIngresos pero NO tablaFormasPago
            return {
              ...baseIdDoc,
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              TipoIngresos: '01',
              TipoPago: '1',
            };
          } else if (
            factura.tipo === '44' ||
            factura.tipo === '46' ||
            factura.tipo === '47'
          ) {
            // Tipos 44, 46, 47: Regímenes especiales - NO incluyen indicadorMontoGravado ni indicadorEnvioDiferido
            return {
              ...baseIdDoc,
              TipoIngresos: '01',
              TipoPago: '1',
              TablaFormasPago: [
                {
                  Forma: '1',
                  Monto: montoTotal,
                },
              ],
            };
          }

          // Fallback por defecto
          return {
            ...baseIdDoc,
            TipoPago: '1',
            TablaFormasPago: [
              {
                Forma: '1',
                Monto: montoTotal,
              },
            ],
          };
        })(),
        Emisor: (() => {
          const baseEmisor = {
            RNC: emisor.rnc,
            RazonSocial: stringVacioANull(emisor.razonSocial),
            Direccion: stringVacioANull(emisor.direccion),
            Municipio: emisor.municipio || null,
            Provincia: emisor.provincia || null,
            TablaTelefono: emisor.telefono || [],
            FechaEmision: formatearFecha(factura.fecha),
          };

          // Para tipos 31, 32, 33, 34: incluir campos adicionales del emisor
          if (
            factura.tipo === '31' ||
            factura.tipo === '32' ||
            factura.tipo === '33' ||
            factura.tipo === '34'
          ) {
            return {
              ...baseEmisor,
              nombreComercial: stringVacioANull(emisor.razonSocial),
              correo: stringVacioANull(emisor.correo),
              webSite: emisor.webSite || null,
              codigoVendedor: factura.id || null,
              numeroFacturaInterna: stringVacioANull(factura.id),
              numeroPedidoInterno: stringVacioANull(factura.id),
              zonaVenta: 'PRINCIPAL',
            };
          }

          // Para otros tipos (41, 43, etc.): estructura más simple
          return baseEmisor;
        })(),
        // Comprador: Tipo 43 NO incluye comprador según estructura oficial
        ...(factura.tipo !== '43' && {
          comprador: (() => {
            const baseComprador = {
              rnc: comprador.rnc,
              razonSocial: stringVacioANull(comprador.nombre),
              correo: stringVacioANull(comprador.correo),
              direccion: stringVacioANull(comprador.direccion),
              municipio: comprador.municipio || null,
              provincia: comprador.provincia || null,
            };

            // Para tipos 31, 32, 33, 34: incluir campos adicionales del comprador
            if (
              factura.tipo === '31' ||
              factura.tipo === '32' ||
              factura.tipo === '33' ||
              factura.tipo === '34'
            ) {
              return {
                ...baseComprador,
                contacto: stringVacioANull(comprador.nombre),
                envioMail: stringVacioANull(comprador.correo) ? 'SI' : 'NO',
                fechaEntrega: comprador.fechaEntrega || null,
                fechaOrden: comprador.fechaOrden || null,
                numeroOrden: comprador.numeroOrden || null,
                codigoInterno: comprador.codigoInterno || comprador.rnc,
              };
            }

            // Para otros tipos: estructura más simple
            return baseComprador;
          })(),
        }),
        // informacionesAdicionales solo para tipos 31, 32, 33, 34
        ...(factura.tipo === '31' ||
        factura.tipo === '32' ||
        factura.tipo === '33' ||
        factura.tipo === '34'
          ? {
              informacionesAdicionales: {
                numeroContenedor: factura.numeroContenedor || null,
                numeroReferencia: stringVacioANull(factura.id),
              },
            }
          : {}),
        Totales: (() => {
          // Estructura según ejemplo oficial de TheFactoryHKA (camelCase)
          const baseTotales = {
            montoGravadoTotal:
              parseFloat(montoGravadoCalculado) > 0
                ? montoGravadoCalculado
                : null,
            montoGravadoI1:
              parseFloat(montoGravadoCalculado) > 0
                ? montoGravadoCalculado
                : null,
            itbiS1: parseFloat(montoGravadoCalculado) > 0 ? '18' : null,
            totalITBIS:
              parseFloat(montoGravadoCalculado) > 0
                ? (parseFloat(montoGravadoCalculado) * 0.18).toFixed(2)
                : null,
            totalITBIS1:
              parseFloat(montoGravadoCalculado) > 0
                ? (parseFloat(montoGravadoCalculado) * 0.18).toFixed(2)
                : null,
            montoTotal: montoTotal,
          };

          // Para tipos 31, 32, 33, 34: Incluir montoExento (según ejemplo oficial)
          if (
            factura.tipo === '31' ||
            factura.tipo === '32' ||
            factura.tipo === '33' ||
            factura.tipo === '34'
          ) {
            return {
              ...baseTotales,
              montoExento:
                parseFloat(montoExentoCalculado) > 0
                  ? montoExentoCalculado
                  : null,
            };
          }

          // Para tipo 43: Gastos Menores - estructura muy simple
          if (factura.tipo === '43') {
            return {
              montoExento: montoTotal, // Para tipo 43, todo es monto exento
              montoTotal: montoTotal,
            };
          }

          // Para tipo 44: Régimen especial - NO incluir campos de retención
          if (factura.tipo === '44') {
            return {
              ...baseTotales,
              montoExento:
                parseFloat(montoExentoCalculado) > 0
                  ? montoExentoCalculado
                  : null,
              valorPagar: montoTotal,
            };
          }

          // Para tipo 45: Gubernamental - incluir campos ITBIS pero NO retención
          if (factura.tipo === '45') {
            // Después del ajuste de items, usar directamente la suma del detalle
            const montoGravadoFinal = parseFloat(sumaItemsGravados);
            const itbisCalculado = montoGravadoFinal * 0.18;
            const montoTotalConImpuestos =
              montoGravadoFinal + itbisCalculado + parseFloat(sumaItemsExentos);

            console.log(`✅ Cálculo final para tipo 45:`, {
              montoGravadoDetalle: sumaItemsGravados,
              itbisCalculado: itbisCalculado.toFixed(2),
              montoTotalConImpuestos: montoTotalConImpuestos.toFixed(2),
            });

            // Estructura específica para tipo 45 con cálculos exactos (PascalCase)
            // NOTA: Solo incluir campos de ITBIS si hay montos gravados
            const totales45 = {
              MontoTotal: montoTotalConImpuestos.toFixed(2), // Total (sin impuestos para servicios exentos)
              ValorPagar: montoTotalConImpuestos.toFixed(2),
            };

            // Solo incluir campos de impuestos si HAY montos gravados
            if (montoGravadoFinal > 0) {
              totales45.MontoGravadoTotal = sumaItemsGravados;
              totales45.ITBIS1 = '18';
              totales45.TotalITBIS = itbisCalculado.toFixed(2);
              totales45.TotalITBIS1 = itbisCalculado.toFixed(2);
            }

            // Solo incluir montoExento si hay montos exentos (> 0)
            if (parseFloat(sumaItemsExentos) > 0) {
              totales45.MontoExento = sumaItemsExentos;
            }

            return totales45;
          }

          // Para tipos 41, 46, 47: Incluir campos de retención
          return {
            ...baseTotales,
            montoExento:
              parseFloat(montoExentoCalculado) > 0
                ? montoExentoCalculado
                : null,
            valorPagar: montoTotal,
            totalITBISRetenido:
              parseFloat(montoGravadoCalculado) > 0
                ? (parseFloat(montoGravadoCalculado) * 0.18).toFixed(2)
                : '0.00',
            totalISRRetencion: '0.00',
          };
        })(),
      },
      DetallesItems: detallesItems,
      // Para tipo 45: Agregar sección vacía de descuentos/recargos para validación
      ...(factura.tipo === '45' && {
        DescuentosORecargos: [],
      }),
      // Para tipo 34: Agregar InformacionReferencia OBLIGATORIA (con validación)
      ...(factura.tipo === '34' &&
        (() => {
          // Validar que se proporcionen los campos obligatorios para tipo 34
          if (!factura.ncfModificado) {
            throw new Error(
              '❌ Tipo 34 requiere "ncfModificado": NCF de la factura original que se está modificando',
            );
          }
          if (!factura.fechaNCFModificado) {
            throw new Error(
              '❌ Tipo 34 requiere "fechaNCFModificado": Fecha de la factura original',
            );
          }
          if (!factura.codigoModificacion) {
            throw new Error(
              '❌ Tipo 34 requiere "codigoModificacion": Código que indica el tipo de modificación (1,2,3,4)',
            );
          }
          if (!factura.razonModificacion) {
            throw new Error(
              '❌ Tipo 34 requiere "razonModificacion": Razón descriptiva de la modificación',
            );
          }

          return {
            InformacionReferencia: {
              NCFModificado: factura.ncfModificado,
              RNCOtroContribuyente: factura.rncOtroContribuyente || emisor.rnc,
              FechaNCFModificado: formatearFecha(factura.fechaNCFModificado),
              CodigoModificacion: factura.codigoModificacion,
              RazonModificacion: factura.razonModificacion,
            },
          };
        })()),
    },
  };

  return documentoCompleto;
};

// Controlador para enviar factura a TheFactoryHKA
const enviarFacturaElectronica = async (req, res) => {
  try {
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));

    // Obtener token de autenticación
    const token = await obtenerTokenTheFactory();

    // Transformar el JSON simplificado al formato completo
    const facturaCompleta = transformarFacturaParaTheFactory(req.body, token);

    console.log(
      'Factura transformada:',
      JSON.stringify(facturaCompleta, null, 2),
    );

    // Enviar a TheFactoryHKA
    const response = await axios.post(THEFACTORY_ENVIAR_URL, facturaCompleta, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos de timeout
    });

    console.log('Respuesta de TheFactoryHKA:', response.data);

    // 🔧 VALIDAR RESPUESTA ANTES DE ACCEDER A PROPIEDADES
    if (!response.data.procesado || response.data.codigo !== 0) {
      // Error de negocio de TheFactoryHKA
      const errorMessages = {
        108: 'NCF ya fue presentado anteriormente',
        109: 'NCF vencido o inválido',
        110: 'RNC no autorizado para este tipo de comprobante',
        111: 'Datos de la factura inválidos',
      };

      const mensajeError =
        errorMessages[response.data.codigo] ||
        response.data.mensaje ||
        'Error desconocido';

      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: `Error de TheFactoryHKA: ${mensajeError}`,
        details: {
          codigo: response.data.codigo,
          mensajeOriginal: response.data.mensaje,
          procesado: response.data.procesado,
          codigoSeguridad: response.data.codigoSeguridad || null,
          respuestaCompleta: response.data,
        },
      });
    }

    // ✅ Si llegamos aquí, la factura fue procesada exitosamente
    const ncfGenerado = req.body.factura.ncf; // Usar el NCF que enviamos

    // 🔍 Consultar estatus inmediatamente (no crítico si falla)
    console.log('📋 Consultando estatus inmediato post-envío...');
    const estatusConsulta = await consultarEstatusInmediato(ncfGenerado);

    // 📱 Generar URL para QR Code de la DGII
    const urlQR = generarUrlQR(response.data, req.body);

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Factura electrónica enviada exitosamente',
      data: {
        facturaOriginal: req.body,
        respuestaTheFactory: response.data,
        ncfGenerado: ncfGenerado,
        codigoSeguridad: response.data.codigoSeguridad,
        fechaFirma: response.data.fechaFirma,
        xmlBase64: response.data.xmlBase64,
        urlQR: urlQR, // ✅ NUEVO: URL para generar QR Code
        estatusInicial: estatusConsulta,
      },
    });
  } catch (error) {
    console.error('Error al enviar factura electrónica:', error);

    // Error de autenticación - limpiar cache y reintentar una vez
    if (
      error.message.includes('Error de autenticación') ||
      (error.response &&
        (error.response.status === 401 || error.response.status === 403))
    ) {
      // Limpiar cache del token
      tokenCache.token = null;
      tokenCache.fechaExpiracion = null;

      return res.status(httpStatus.UNAUTHORIZED).json({
        status: 'error',
        message: 'Error de autenticación con TheFactoryHKA',
        details: error.message,
      });
    }

    if (error.response) {
      // Error de la API de TheFactoryHKA
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Error en el envío a TheFactoryHKA',
        details: error.response.data,
        statusCode: error.response.status,
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(httpStatus.REQUEST_TIMEOUT).json({
        status: 'error',
        message: 'Timeout al conectar con TheFactoryHKA',
      });
    }

    if (error.message.includes('Faltan datos obligatorios')) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Timeout al conectar con el servicio de autenticación',
      )
    ) {
      return res.status(httpStatus.REQUEST_TIMEOUT).json({
        status: 'error',
        message: 'Timeout en la autenticación con TheFactoryHKA',
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al procesar la factura electrónica',
      details: error.message,
    });
  }
};

// 🔍 Endpoint independiente para consultar estatus de documento
const consultarEstatusDocumento = async (req, res) => {
  try {
    const { ncf } = req.body;

    // Validar que se proporcione el NCF
    if (!ncf) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El campo NCF es requerido',
        details: 'Debe proporcionar el NCF del documento a consultar',
      });
    }

    console.log(`🔍 Consulta de estatus solicitada para NCF: ${ncf}`);

    // Consultar estatus en TheFactoryHKA
    const estatusConsulta = await consultarEstatusInmediato(ncf);

    if (estatusConsulta.consultaExitosa) {
      // Interpretar el estado devuelto por TheFactoryHKA
      const estadoOriginal =
        estatusConsulta.datosEstatus.estado ||
        estatusConsulta.datosEstatus.status ||
        estatusConsulta.datosEstatus.mensaje ||
        'DESCONOCIDO';
      const estadoNormalizado = normalizarEstadoFactura(
        estadoOriginal,
        estatusConsulta.datosEstatus,
      );

      return res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Consulta de estatus realizada exitosamente',
        data: {
          ncf: ncf,
          estado: estadoNormalizado,
          estadoOriginal: estadoOriginal,
          mensaje:
            estatusConsulta.datosEstatus.mensaje ||
            estatusConsulta.datosEstatus.description ||
            'Sin mensaje',
          fechaConsulta: estatusConsulta.timestamp,
          datosCompletos: estatusConsulta.datosEstatus,
        },
      });
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'No se pudo consultar el estatus del documento',
        details: estatusConsulta.error,
        data: {
          ncf: ncf,
          timestamp: estatusConsulta.timestamp,
        },
      });
    }
  } catch (error) {
    console.error('Error en consulta de estatus:', error);

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al consultar estatus',
      details: error.message,
    });
  }
};

module.exports = {
  createComprobante,
  getAllComprobantes,
  getComprobanteById,
  updateComprobante,
  updateComprobanteEstado,
  deleteComprobante,
  getComprobantesStats,
  consumirNumero,
  consumirNumeroPorRnc,
  enviarFacturaElectronica,
  consultarEstatusDocumento,
  generarUrlQR,
  generarCodigoQR,
  obtenerTokenTheFactory, // Exportar también la función de autenticación para posibles usos externos
};
