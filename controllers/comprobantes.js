const httpStatus = require('http-status');
const { Comprobante } = require('../models/comprobante');
const axios = require('axios');
const QRCode = require('qrcode');
const {
  THEFACTORY_AUTH_URL,
  THEFACTORY_ENVIAR_URL,
  THEFACTORY_ESTATUS_URL,
  THEFACTORY_ANULACION_URL,
  THEFACTORY_DESCARGA_URL,
  THEFACTORY_USUARIO,
  THEFACTORY_CLAVE,
  THEFACTORY_RNC,
} = require('../utils/constants');

// Cache del token de TheFactoryHKA
let tokenCache = {
  token: null,
  fechaExpiracion: null,
};

// Función para limpiar cache del token (útil para debugging)
const limpiarCacheToken = () => {
  console.log('🧹 Limpiando cache del token TheFactoryHKA...');
  tokenCache.token = null;
  tokenCache.fechaExpiracion = null;
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

    // console.log('Obteniendo nuevo token de TheFactoryHKA...');

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

    // console.log('Respuesta de autenticación:', response.data);

    // Verificar que la autenticación fue exitosa
    if (response.data.codigo !== 0) {
      throw new Error(`Error de autenticación: ${response.data.mensaje}`);
    }

    // Actualizar cache
    tokenCache.token = response.data.token;
    tokenCache.fechaExpiracion = response.data.fechaExpiracion;

    // console.log(
    //   'Token obtenido exitosamente, expira:',
    //   tokenCache.fechaExpiracion,
    // );

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
  // Según la documentación de la DGII y TheFactoryHKA:
  // Tipos que requieren fecha de vencimiento:
  const tiposObligatorios = [
    '31', // Factura de Crédito Fiscal Electrónica
    '33', // Nota de Débito Electrónica
    '41', // Compras Electrónicas
    '43', // Gastos Menores Electrónico
    '44', // Régimenes Especiales Electrónico
    '45', // Gubernamental Electrónico
    '46', // Exportaciones Electrónico
    '47', // Pagos al Exterior Electrónico
  ];

  // Tipos opcionales (NO requieren fecha de vencimiento):
  // '32' - Factura de Consumo Electrónica
  // '34' - Nota de Crédito Electrónica (NO debe incluir FechaVencimientoSecuencia)
  const esObligatorio = tiposObligatorios.includes(tipoDocumento); // true si es obligatorio, false si es opcional

  // console.log(
  //   `📅 Fecha vencimiento para tipo ${tipoDocumento}: ${esObligatorio ? 'OBLIGATORIA' : 'OPCIONAL'}`,
  // );

  return esObligatorio;
};

// Función para generar URL del QR Code para la DGII según el tipo de comprobante
const generarUrlQR = (responseData, facturaOriginal) => {
  try {
    const montoTotal = parseFloat(facturaOriginal.factura.total || 0);
    const tipoComprobante = facturaOriginal.factura.tipo;

    // 🔍 DEBUG: Verificar datos recibidos
    console.log('🔍 DEBUG generarUrlQR - Datos recibidos:');
    console.log('responseData:', JSON.stringify(responseData, null, 2));
    console.log('facturaOriginal:', JSON.stringify(facturaOriginal, null, 2));
    console.log('montoTotal calculado:', montoTotal);
    console.log('tipoComprobante:', tipoComprobante);

    // Determinar endpoint y parámetros según el tipo de comprobante
    let baseUrl, params;

    if (tipoComprobante === '32' || !facturaOriginal.comprador?.rnc) {
      // TIPO 32 (Consumo) o sin RNC comprador: usar endpoint ConsultaTimbreFC (parámetros básicos)
      baseUrl = 'https://fc.dgii.gov.do/testecf/ConsultaTimbreFC';
      params = new URLSearchParams({
        RncEmisor: facturaOriginal.emisor.rnc,
        ENCF: facturaOriginal.factura.ncf,
        MontoTotal: montoTotal.toFixed(2),
        CodigoSeguridad: responseData.codigoSeguridad,
      });

      console.log(
        '📋 Usando endpoint ConsultaTimbreFC (consumo final/sin RNC comprador)',
      );
    } else {
      // TIPOS 31, 33, 34, etc. con RNC comprador: usar endpoint ConsultaTimbre (parámetros completos)
      baseUrl = 'https://ecf.dgii.gov.do/testecf/ConsultaTimbre';

      // Formatear fechas
      const formatearFechaUrl = (fecha) => {
        if (!fecha) return '';
        // Si viene en formato DD-MM-YYYY, mantenerlo
        if (fecha.match(/^\d{2}-\d{2}-\d{4}$/)) {
          return fecha;
        }
        // Si viene en otro formato, convertirlo
        const date = new Date(fecha);
        return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      };

      params = new URLSearchParams({
        RncEmisor: facturaOriginal.emisor.rnc,
        RncComprador: facturaOriginal.comprador.rnc,
        ENCF: facturaOriginal.factura.ncf,
        FechaEmision: responseData.fechaEmision
          ? formatearFechaUrl(responseData.fechaEmision)
          : formatearFechaUrl(facturaOriginal.factura.fecha),
        MontoTotal: montoTotal.toFixed(2),
        FechaFirma: responseData.fechaFirma || responseData.fechaEmision,
        CodigoSeguridad: responseData.codigoSeguridad,
      });

      console.log(
        '📋 Usando endpoint ConsultaTimbre (con RNC comprador y fechas)',
      );
    }

    const urlCompleta = `${baseUrl}?${params.toString()}`;

    console.log(`📱 URL QR DGII generada: ${urlCompleta}`);
    console.log(`📊 Endpoint: ${baseUrl}`);
    console.log(`📊 Parámetros: ${params.toString()}`);

    return urlCompleta;
  } catch (error) {
    console.error('❌ Error al generar datos del QR:', error);
    return null;
  }
};

// Función para generar código QR según especificaciones de la DGII
const generarCodigoQR = async (req, res) => {
  try {
    // 🔍 DEBUG: Log completo de datos recibidos desde FileMaker
    console.log('🔍 === DEBUG generarCodigoQR ===');
    console.log('req.body completo:', JSON.stringify(req.body, null, 2));
    console.log('req.headers:', JSON.stringify(req.headers, null, 2));

    const {
      url,
      rnc,
      rncComprador, // ✅ Agregar rncComprador a la desestructuración
      ncf,
      codigo,
      fecha,
      fechaFirma, // ✅ Agregar fechaFirma a la desestructuración
      monto,
      tipo, // ✅ Agregar tipo de comprobante
      formato = 'png',
      tamaño = 300,
    } = req.body;

    console.log('🔍 Parámetros extraídos:');
    console.log('rnc:', rnc);
    console.log('rncComprador:', rncComprador);
    console.log('ncf:', ncf);
    console.log('codigo:', codigo);
    console.log('fecha:', fecha);
    console.log('fechaFirma:', fechaFirma);
    console.log('monto:', monto);
    console.log('tipo:', tipo);

    let urlParaQR;

    // Opción 1: URL completa proporcionada (método anterior)
    if (url) {
      urlParaQR = url;
    }
    // Opción 2: Parámetros individuales (método mejorado)
    else if (rnc && ncf) {
      // Determinar endpoint y parámetros según el tipo de comprobante
      const montoTotal = parseFloat(monto || 0);
      let baseUrl, params;

      if (
        tipo === '32' ||
        !rncComprador ||
        rncComprador === 'SIN_RNC_COMPRADOR'
      ) {
        // TIPO 32 (Consumo) o sin RNC comprador: usar endpoint ConsultaTimbreFC (parámetros básicos)
        // Para tipo 32, solo se requiere: rnc, ncf, monto, codigo
        if (!codigo) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 'error',
            message:
              'Parámetros insuficientes para generar el código QR tipo 32',
            details:
              'Para facturas tipo 32 se requiere: rnc, ncf, monto y codigo (código de seguridad)',
          });
        }

        baseUrl = 'https://fc.dgii.gov.do/ecf/ConsultaTimbreFC';
        params = new URLSearchParams({
          RncEmisor: rnc,
          ENCF: ncf,
          MontoTotal: montoTotal.toFixed(2),
          CodigoSeguridad: codigo,
        });

        console.log(
          '📋 Usando endpoint ConsultaTimbreFC (consumo final/sin RNC comprador)',
        );
      } else {
        // TIPOS 31, 33, 34, etc. con RNC comprador: usar endpoint ConsultaTimbre (parámetros completos)
        // Para estos tipos se requieren parámetros adicionales
        if (!codigo || !fecha || !rncComprador) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 'error',
            message: `Parámetros insuficientes para generar el código QR tipo ${tipo || 'con RNC comprador'}`,
            details:
              'Para facturas con RNC comprador se requiere: rnc, ncf, codigo, fecha, rncComprador, monto',
          });
        }

        baseUrl = 'https://ecf.dgii.gov.do/ecf/ConsultaTimbre';

        // Formatear fechas
        const formatearFechaUrl = (fecha) => {
          if (!fecha) return '';
          // Si viene en formato DD-MM-YYYY, mantenerlo
          if (fecha.match(/^\d{2}-\d{2}-\d{4}$/)) {
            return fecha;
          }
          // Si viene en otro formato, convertirlo
          const date = new Date(fecha);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        };

        params = new URLSearchParams({
          RncEmisor: rnc,
          RncComprador: rncComprador,
          ENCF: ncf,
          FechaEmision: formatearFechaUrl(fecha),
          MontoTotal: montoTotal.toFixed(2),
          FechaFirma: fechaFirma || fecha,
          CodigoSeguridad: codigo,
        });

        console.log(
          '📋 Usando endpoint ConsultaTimbre (con RNC comprador y fechas)',
        );
      }

      urlParaQR = `${baseUrl}?${params.toString()}`;

      console.log('🎯 URL QR generada según tipo:', urlParaQR);
      console.log('📊 Endpoint usado:', baseUrl);
      console.log('📊 Parámetros incluidos:', params.toString());
      console.log('📋 Tipo comprobante:', tipo || 'NO ESPECIFICADO');

      // console.log(
      //   `📱 URL QR oficial DGII para monto RD$${montoTotal.toLocaleString()}: ${urlParaQR}`,
      // );
      // console.log(
      //   `📊 Endpoint: ${esMontoAlto ? 'ALTO VALOR (≥$250K)' : 'ESTÁNDAR (<$250K)'} - ${baseUrl}`,
      // );
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Parámetros insuficientes para generar el código QR',
        details:
          'Debe proporcionar: url completa O al menos (rnc + ncf) para generar el QR',
      });
    }

    // Configuración según recomendaciones de la DGII (ajustada para URLs largas)
    const opcionesQR = {
      // No especificar version para que se calcule automáticamente según el contenido
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

    // console.log(`📱 Generando QR Code versión 8 para URL: ${urlParaQR}`);
    // console.log(`📏 Configuración: ${formato.toUpperCase()}, ${tamaño}px`);

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
        versionCalculada: 'auto', // Se calcula automáticamente según el contenido
        parametrosUsados: url ? 'URL completa' : 'Parámetros individuales',
        especificaciones: {
          errorCorrection: 'M',
          cumpleNormativaDGII: true,
          versionOptimizada: true,
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
  console.log(
    `\n🔄 ==================== INICIO NORMALIZACIÓN ESTADO ====================`,
  );
  console.log(`📝 Estado original recibido: "${estadoOriginal}"`);
  console.log('📊 Datos completos recibidos:');
  console.log(JSON.stringify(datosCompletos, null, 2));

  // Convertir a mayúsculas para comparación
  const estado = (estadoOriginal || '').toString().toUpperCase();
  console.log(`🔤 Estado en mayúsculas: "${estado}"`);

  // PRIORIDAD 1: Verificar campo 'procesado' y código numérico primero
  console.log(`🔍 Verificando campo 'procesado': ${datosCompletos.procesado}`);
  console.log(`🔍 Verificando campo 'codigo': ${datosCompletos.codigo}`);

  if (datosCompletos.procesado === true) {
    console.log('✅ Campo procesado === true');

    // Si está procesado y tiene código exitoso
    if (datosCompletos.codigo === 0 || datosCompletos.codigo === 1) {
      console.log(`✅ Código exitoso detectado: ${datosCompletos.codigo}`);
      console.log(
        `🔄 ==================== FIN NORMALIZACIÓN: APROBADA ====================\n`,
      );
      return 'APROBADA';
    }

    // Si está procesado pero tiene código de error o estado especial
    if (datosCompletos.codigo !== undefined && datosCompletos.codigo > 1) {
      console.log(`⚠️ Código > 1 detectado: ${datosCompletos.codigo}`);

      switch (datosCompletos.codigo) {
        // ⏳ Estados en proceso
        case 2: // En proceso de validación en TheFactoryHKA
        case 4: // En proceso de validación en DGII
        case 10: // Pendiente de procesamiento
        case 15: // En validación
        case 95: // Documento pendiente por ser enviado a DGII
        case 99: // Sin respuesta DGII - documento enviado pero pendiente de respuesta
          console.log(
            `⏳ Estado en proceso identificado (código ${datosCompletos.codigo})`,
          );
          console.log(
            `🔄 ==================== FIN NORMALIZACIÓN: EN_PROCESO ====================\n`,
          );
          return 'EN_PROCESO';

        // ❌ Errores de NCF
        case 108: // NCF ya presentado anteriormente
          return 'NCF_INVALIDO'; // NCF ya presentado
        case 109: // NCF vencido o fuera de rango
          return 'NCF_VENCIDO'; // NCF vencido o fuera de rango

        // ❌ Errores de autorización
        case 110:
          return 'RNC_NO_AUTORIZADO'; // RNC no autorizado

        // ❌ Errores de validación de datos
        case 111: // Datos de la factura inválidos
        case 112: // Estructura del documento incorrecta
        case 113: // Totales inconsistentes
        case 114: // Fecha de emisión inválida
          return 'DATOS_INVALIDOS'; // Datos/estructura/totales inválidos

        // ❌ Errores de búsqueda/no encontrado
        case 120:
          return 'NO_ENCONTRADO'; // Documento no existe en BD de TheFactoryHKA

        // ❌ Estados de rechazo DGII
        case 200: // Rechazado por DGII - Datos inconsistentes
        case 201: // Rechazado - RNC inválido
        case 202: // Rechazado - Estructura incorrecta
        case 203: // Rechazado - Firma digital inválida
          return 'RECHAZADA'; // Rechazado por DGII

        // ❌ Errores de reglas de negocio DGII (600-699)
        case 613:
          return 'RECHAZADA'; // Error específico: comprobantes no pueden reemplazarse entre ellos mismos
        case 634: // Fecha de NCF modificado no coincide
          return 'RECHAZADA'; // Error específico: fecha de NCF modificado no coincide

        // 🚫 Estados de cancelación
        case 300: // Documento anulado/cancelado
        case 301: // Documento anulado/cancelado
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
      case 4: // En proceso de validación en DGII
      case 10:
      case 15:
      case 95:
      case 99: // Sin respuesta DGII - documento enviado pero pendiente de respuesta
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

      // ❌ Errores de búsqueda/no encontrado
      case 120:
        return 'NO_ENCONTRADO'; // Documento no existe en BD de TheFactoryHKA

      // ❌ Estados de rechazo DGII
      case 200:
      case 201:
      case 202:
      case 203:
        return 'RECHAZADA';

      // ❌ Errores de reglas de negocio DGII (600-699)
      case 613:
        return 'RECHAZADA'; // Error específico: comprobantes no pueden reemplazarse entre ellos mismos
      case 634:
        return 'RECHAZADA'; // Error específico: fecha de NCF modificado no coincide

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
  console.log('❓ No se encontró coincidencia con ningún patrón conocido');
  console.log(
    `🔄 ==================== FIN NORMALIZACIÓN: ${estado || 'DESCONOCIDO'} ====================\n`,
  );
  return estado || 'DESCONOCIDO';
};

// Función para consultar el estatus de un documento en TheFactoryHKA
const consultarEstatusInmediato = async (ncf) => {
  try {
    console.log(
      `\n🔍 ==================== INICIO CONSULTA ESTATUS ====================`,
    );
    console.log(`📄 NCF a consultar: ${ncf}`);

    const token = await obtenerTokenTheFactory();
    console.log(`🔐 Token obtenido: ${token.substring(0, 30)}...`);

    const payload = {
      token: token,
      rnc: THEFACTORY_RNC,
      documento: ncf,
    };

    console.log('📤 Payload enviado a TheFactoryHKA:');
    console.log(JSON.stringify(payload, null, 2));
    console.log(`🌐 URL de consulta: ${THEFACTORY_ESTATUS_URL}`);
    console.log(`🏢 RNC usado para consulta: ${THEFACTORY_RNC}`);

    const response = await axios.post(THEFACTORY_ESTATUS_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos
    });

    console.log('📥 Respuesta RAW de TheFactoryHKA (response.data):');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`📊 Status HTTP: ${response.status}`);
    console.log(
      `🔍 ==================== FIN CONSULTA ESTATUS ====================\n`,
    );

    return {
      consultaExitosa: true,
      datosEstatus: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error al consultar estatus (no crítico):', error.message);
    if (error.response) {
      console.error('📥 Respuesta de error de TheFactoryHKA:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error(`📊 Status HTTP de error: ${error.response.status}`);
    }
    console.log(
      `🔍 ==================== FIN CONSULTA ESTATUS (ERROR) ====================\n`,
    );

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
    // Limpiar fecha_vencimiento si viene vacía y el tipo no la requiere (tipos 32 y 34)
    const rangoData = {
      ...req.body,
      usuario: req.user._id,
    };

    // Si fecha_vencimiento es string vacío, null o undefined, y es tipo 32 o 34, eliminarla
    if (
      ['32', '34'].includes(rangoData.tipo_comprobante) &&
      (!rangoData.fecha_vencimiento || rangoData.fecha_vencimiento === '')
    ) {
      delete rangoData.fecha_vencimiento;
      // console.log(
      //   `📅 Tipo ${rangoData.tipo_comprobante}: fecha_vencimiento removida (opcional)`,
      // );
    }

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

    // console.log('estado', estado);
    // console.log('tipo_comprobante', tipo_comprobante);
    // console.log('rnc', rnc);
    // console.log('vencimiento_proximo', vencimiento_proximo);

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

    console.log('📝 Intentando actualizar comprobante:', {
      id,
      usuario: req.user._id,
      datos: req.body,
    });

    // Buscar el rango existente sin validar usuario propietario
    const existingRango = await Comprobante.findById(id);

    if (!existingRango) {
      console.log('❌ Comprobante no encontrado:', id);
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Comprobante no encontrado',
      });
    }

    // console.log('✅ Comprobante encontrado, actualizando sin restricciones');
    // console.log('📊 Estado antes de actualizar:', existingRango.estado);

    // Limpiar fecha_vencimiento si viene vacía y el tipo no la requiere (tipos 32 y 34)
    const updateData = { ...req.body };
    if (
      ['32', '34'].includes(
        updateData.tipo_comprobante || existingRango.tipo_comprobante,
      ) &&
      (updateData.fecha_vencimiento === '' ||
        updateData.fecha_vencimiento === null)
    ) {
      updateData.fecha_vencimiento = undefined;
      // console.log(
      //   `📅 Tipo ${updateData.tipo_comprobante || existingRango.tipo_comprobante}: fecha_vencimiento removida (opcional)`,
      // );
    }

    // Actualizar todos los campos enviados sin restricciones
    Object.assign(existingRango, updateData);
    existingRango.fechaActualizacion = Date.now();

    // console.log('📊 Estado después de Object.assign:', existingRango.estado);

    const rango = await existingRango.save();

    // console.log('📊 Estado después de save:', rango.estado);

    // Populate el usuario para mantener la consistencia con otras respuestas
    await rango.populate('usuario', 'name email');

    // console.log('✅ Comprobante actualizado exitosamente:', {
    //   id: rango._id,
    //   estado_final: rango.estado,
    //   usuario_original: existingRango.usuario,
    //   actualizado_por: req.user._id,
    // });

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Comprobante actualizado exitosamente',
      data: rango,
    });
  } catch (err) {
    console.error('❌ Error al actualizar comprobante:', err);

    if (err.name === 'ValidationError') {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Datos del comprobante inválidos',
        details: err.message,
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al actualizar el comprobante',
    });
  }
};

// Cambiar estado de un rango
const updateComprobanteEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // console.log('🔄 Intentando actualizar estado del comprobante:', {
    //   id,
    //   estado,
    //   usuario: req.user._id,
    // });

    const validEstados = ['activo', 'inactivo', 'vencido', 'agotado'];
    if (!validEstados.includes(estado)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message:
          'Estado inválido. Debe ser: activo, inactivo, vencido o agotado',
      });
    }

    // Actualizar sin validar usuario propietario
    const rango = await Comprobante.findByIdAndUpdate(
      id,
      { estado, fechaActualizacion: Date.now() },
      { new: true },
    ).populate('usuario', 'name email');

    if (!rango) {
      // console.log('❌ Comprobante no encontrado:', id);
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Comprobante no encontrado',
      });
    }

    // console.log('✅ Estado actualizado exitosamente:', {
    //   id: rango._id,
    //   nuevo_estado: estado,
    // });

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Estado del comprobante actualizado exitosamente',
      data: rango,
    });
  } catch (err) {
    console.error('❌ Error al actualizar estado:', err);
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

    // console.log('🗑️ Intentando eliminar comprobante:', {
    //   id,
    //   usuario: req.user._id,
    //   usuarioEmail: req.user.email,
    // });

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      // console.log('❌ ID inválido:', id);
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'ID de comprobante inválido',
      });
    }

    // Eliminar el comprobante directamente sin validar usuario propietario
    const rango = await Comprobante.findByIdAndDelete(id);

    if (!rango) {
      // console.log('❌ Comprobante no encontrado:', id);
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Comprobante no encontrado',
      });
    }

    // console.log('✅ Comprobante eliminado exitosamente:', {
    //   id: rango._id,
    //   rnc: rango.rnc,
    //   tipo_comprobante: rango.tipo_comprobante,
    //   usuario_original: rango.usuario,
    //   eliminado_por: req.user._id,
    // });

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Comprobante eliminado exitosamente',
      data: {
        id: rango._id,
        rnc: rango.rnc,
        tipo_comprobante: rango.tipo_comprobante,
        numeros_utilizados: rango.numeros_utilizados,
      },
    });
  } catch (err) {
    console.error('❌ Error al eliminar comprobante:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al eliminar el comprobante',
      error: err.message,
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
      estado: { $in: ['activo', 'alerta'] }, // Incluir rangos activos y en alerta
    });

    // Rangos con alertas (estado 'alerta' o números bajos)
    const conAlertas = await Comprobante.countDocuments({
      usuario: req.user._id,
      estado: 'alerta', // Ahora usamos el estado específico de alerta
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

    // Construir query base
    const query = {
      rnc: rnc,
      tipo_comprobante: tipo_comprobante,
      estado: { $in: ['activo', 'alerta'] }, // Incluir rangos activos y en alerta
      numeros_disponibles: { $gt: 0 }, // Verificar que haya números disponibles
    };

    // Agregar filtro de fecha de vencimiento SOLO si el tipo lo requiere
    // Tipos 32 y 34 NO tienen fecha de vencimiento obligatoria
    if (!['32', '34'].includes(tipo_comprobante)) {
      query.$or = [
        { fecha_vencimiento: { $gte: new Date() } }, // No vencido
        { fecha_vencimiento: null }, // O sin fecha (permitir por si acaso)
      ];
    }

    // Buscar un rango activo y válido para este RNC y tipo de comprobante (SIN filtrar por usuario)
    const rango = await Comprobante.findOne(query).sort({ fecha_creacion: 1 }); // Usar el rango más antiguo primero

    // console.log('🔍 Query ejecutada:', JSON.stringify(query, null, 2));
    // console.log('📊 Rango encontrado:', rango ? 'SÍ' : 'NO');

    if (!rango) {
      // console.log('❌ No se encontró ningún rango con el query');
      return res.status(httpStatus.NOT_FOUND).json({
        status: 'error',
        message:
          'No se encontró un rango activo disponible para este RNC y tipo de comprobante',
      });
    }

    // console.log('📋 Datos del rango encontrado:', {
    //   _id: rango._id,
    //   rnc: rango.rnc,
    //   tipo_comprobante: rango.tipo_comprobante,
    //   estado: rango.estado,
    //   fecha_vencimiento: rango.fecha_vencimiento,
    //   numeros_disponibles: rango.numeros_disponibles,
    //   numeros_utilizados: rango.numeros_utilizados,
    // });

    // Verificar que el rango sea válido
    const esValidoCheck = rango.esValido();
    // console.log('✅ Verificación esValido():', esValidoCheck);

    if (!esValidoCheck) {
      // console.log('❌ El rango NO pasó la validación esValido()');
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

    // Formatear fecha de vencimiento a formato DD-MM-YYYY
    // Para tipos 32 y 34 que no tienen fecha de vencimiento, devolver null o string vacío
    let fechaVencimientoFormateada = null;
    if (rango.fecha_vencimiento) {
      const fechaVenc = new Date(rango.fecha_vencimiento);
      const dia = fechaVenc.getDate().toString().padStart(2, '0');
      const mes = (fechaVenc.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaVenc.getFullYear();
      fechaVencimientoFormateada = `${dia}-${mes}-${año}`;
    }

    // Determinar alerta de agotamiento para FileMaker
    const alertaAgotamiento =
      rango.estado === 'alerta' || rango.estado === 'agotado';
    let mensajeAlerta = null;

    if (rango.estado === 'agotado') {
      mensajeAlerta =
        'ÚLTIMO COMPROBANTE USADO - Solicitar nuevo rango urgente';
    } else if (rango.estado === 'alerta') {
      mensajeAlerta = `Quedan ${rango.numeros_disponibles} comprobantes - Solicitar nuevo rango pronto`;
    }

    const respuesta = {
      status: 'success',
      message: 'Número consumido exitosamente',
      data: {
        numeroConsumido: numeroConsumido,
        numeroFormateado: numeroFormateado,
        numerosDisponibles: rango.numeros_disponibles,
        fechaVencimiento: fechaVencimientoFormateada,
        estadoRango: rango.estado,
        alertaAgotamiento: alertaAgotamiento, // Bandera booleana para FileMaker
        mensajeAlerta: mensajeAlerta, // Mensaje legible para mostrar al usuario
        rnc: rango.rnc,
        tipoComprobante: rango.tipo_comprobante,
        prefijo: rango.prefijo || '',
        rangoId: rango._id,
      },
    };

    console.log(
      '✅ RESPUESTA EXITOSA consumirNumeroPorRnc:',
      JSON.stringify(respuesta, null, 2),
    );

    return res.status(httpStatus.OK).json(respuesta);
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
  const {
    comprador,
    emisor,
    factura,
    items,
    ItemsDevueltos,
    modificacion,
    descuentos,
    DescuentosORecargos,
  } = facturaSimple;

  // 🔧 ADAPTACIÓN PARA TIPO 34: Mapear estructura específica de FileMaker
  let facturaAdaptada = { ...factura };
  let itemsAdaptados = items;

  // 🔧 ADAPTACIÓN PARA TIPOS 33 Y 34: Mapear estructura específica de FileMaker
  if ((factura?.tipo === '33' || factura?.tipo === '34') && modificacion) {
    console.log(
      `🔧 Adaptando estructura de tipo ${factura.tipo} desde FileMaker...`,
    );

    // Mapear campos de modificacion a factura (PascalCase → camelCase)
    facturaAdaptada = {
      ...facturaAdaptada,
      ncfModificado: modificacion.NCFModificado,
      fechaNCFModificado: modificacion.FechaNCFModificado,
      // ✅ TheFactoryHKA espera STRING SIN ceros iniciales según ejemplos reales
      // Remover ceros iniciales: "06" → "6", "05" → "5", "6" → "6"
      codigoModificacion:
        String(modificacion.CodigoModificacion || '')
          .trim()
          .replace(/^0+/, '') || '0',
      razonModificacion:
        modificacion.RazonModificacion?.trim() ||
        modificacion.RazonModificacion,
    };

    console.log(
      `📋 Campos de modificación mapeados para tipo ${factura.tipo}:`,
      {
        ncfModificado: facturaAdaptada.ncfModificado,
        fechaNCFModificado: facturaAdaptada.fechaNCFModificado,
        codigoModificacion: facturaAdaptada.codigoModificacion,
        razonModificacion: facturaAdaptada.razonModificacion,
      },
    );
  }

  // Si vienen ItemsDevueltos en lugar de items Y es tipo 34, usarlos
  if (ItemsDevueltos && ItemsDevueltos.length > 0 && factura?.tipo === '34') {
    console.log('🔧 Usando ItemsDevueltos como items para tipo 34...');
    itemsAdaptados = ItemsDevueltos.map((item) => ({
      nombre: item.nombre,
      precio: item.montoAcreditar || item.precio, // Usar montoAcreditar si existe, sino precio
    }));
    console.log('📋 Items adaptados:', itemsAdaptados);
  }

  // Validar que tenemos los datos básicos necesarios (usando datos adaptados)
  const camposFaltantes = [];

  // 🔍 Validación específica por tipo de comprobante para RNC del comprador
  if (facturaAdaptada?.tipo === '32') {
    // Tipo 32 (Consumo): RNC del comprador debe ser null (consumidor final)
    // No validamos comprador.rnc para tipo 32
    console.log(
      '📋 Tipo 32 detectado - RNC comprador será null (consumidor final)',
    );
  } else {
    // Otros tipos (31, 33, 34, 41, 43, 44, 45): RNC del comprador es obligatorio
    if (!comprador?.rnc) camposFaltantes.push('comprador.rnc');
  }

  // Validaciones obligatorias para TODOS los tipos
  if (!emisor?.rnc) camposFaltantes.push('emisor.rnc');
  if (!facturaAdaptada?.ncf) camposFaltantes.push('factura.ncf');
  if (!facturaAdaptada?.tipo) camposFaltantes.push('factura.tipo');
  if (!itemsAdaptados?.length)
    camposFaltantes.push('items (debe tener al menos 1 elemento)');

  if (camposFaltantes.length > 0) {
    console.error('❌ Validación fallida - Campos faltantes:', camposFaltantes);
    console.error('📋 Datos recibidos:', {
      'comprador.rnc': comprador?.rnc || 'FALTANTE (null para tipo 32)',
      'emisor.rnc': emisor?.rnc || 'FALTANTE',
      'factura.ncf': facturaAdaptada?.ncf || 'FALTANTE',
      'factura.tipo': facturaAdaptada?.tipo || 'FALTANTE',
      'items.length': itemsAdaptados?.length || 0,
      tipoComprobante: facturaAdaptada?.tipo,
    });
    throw new Error(
      `Faltan datos obligatorios en la factura: ${camposFaltantes.join(', ')}`,
    );
  }

  // 📅 Formatear y validar fecha de vencimiento del NCF
  // Para tipos 32 y 34, la fecha de vencimiento es OPCIONAL
  let fechaVencimientoFormateada = null;

  // Solo procesar fecha de vencimiento si NO es tipo 32 o 34
  if (!['32', '34'].includes(facturaAdaptada.tipo)) {
    // Calcular dinámicamente una fecha de vencimiento segura como fallback
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // getMonth() retorna 0-11

    // Si estamos en diciembre, usar el próximo año para evitar vencimiento inmediato
    const añoVencimiento = mesActual === 12 ? añoActual + 1 : añoActual;
    fechaVencimientoFormateada = `31-12-${añoVencimiento}`; // Fecha segura y dinámica

    if (facturaAdaptada.fechaVencNCF) {
      try {
        // Validar formato de fecha (puede venir como DD-MM-YYYY o YYYY-MM-DD)
        const fecha = facturaAdaptada.fechaVencNCF;
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
      // console.log(
      //   `📅 fechaVencNCF no proporcionada para tipo ${facturaAdaptada.tipo}, usando fecha calculada: ${fechaVencimientoFormateada}`,
      // );
    }
  } else {
    // Para tipos 32 y 34, no se requiere fecha de vencimiento
    // console.log(
    //   `📅 Tipo ${facturaAdaptada.tipo}: fechaVencNCF no requerida (opcional)`,
    // );
  }

  // console.log(`📅 Fecha vencimiento NCF final: ${fechaVencimientoFormateada}`);

  // Calcular totales PRIMERO
  const montoTotal = parseFloat(facturaAdaptada.total).toFixed(2);

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

  if (facturaAdaptada.tipo === '45') {
    // Tipo 45 (Gubernamental): Por defecto todos los items son GRAVADOS
    // Solo si se marca explícitamente como exento, se considera exento
    montoExentoCalculado = itemsAdaptados
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

    montoGravadoCalculado = itemsAdaptados
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
    montoExentoCalculado = itemsAdaptados
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
    montoGravadoCalculado = itemsAdaptados
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

  // 🔧 VERIFICAR Y CORREGIR MONTO TOTAL
  // Calcular el total real basado en la suma de items
  const montoTotalCalculado = (
    parseFloat(montoExentoCalculado) + parseFloat(montoGravadoCalculado)
  ).toFixed(2);
  const montoTotalDeclarado = parseFloat(montoTotal).toFixed(2);

  // Si hay una diferencia significativa, usar el total calculado de items como fuente de verdad
  let montoTotalCorregido = montoTotal;
  if (
    Math.abs(
      parseFloat(montoTotalCalculado) - parseFloat(montoTotalDeclarado),
    ) > 0.01
  ) {
    console.log(`⚠️ INCONSISTENCIA EN MONTO TOTAL:`);
    console.log(`   - Total declarado por FileMaker: ${montoTotalDeclarado}`);
    console.log(`   - Total calculado de items: ${montoTotalCalculado}`);
    console.log(
      `   - Diferencia: ${(parseFloat(montoTotalDeclarado) - parseFloat(montoTotalCalculado)).toFixed(2)}`,
    );
    console.log(`   - Usando total calculado de items para DGII`);

    montoTotalCorregido = montoTotalCalculado;
  }

  // 💰 MANEJO DE DESCUENTOS GLOBALES
  let descuentosArray = [];
  let totalDescuentos = 0;
  let montoTotalConDescuentos = parseFloat(montoTotalCorregido);

  // Procesar descuentos desde diferentes estructuras
  let descuentosParaProcesar = null;

  // Prioridad 1: Nueva estructura desde FileMaker (DescuentosORecargos.Descuentos)
  if (DescuentosORecargos?.Descuentos) {
    descuentosParaProcesar = DescuentosORecargos.Descuentos;
    console.log(
      '💸 Procesando descuentos desde DescuentosORecargos.Descuentos:',
      descuentosParaProcesar,
    );
  }
  // Prioridad 2: Estructura anterior (campo descuentos directo)
  else if (
    descuentos &&
    (Array.isArray(descuentos) || typeof descuentos === 'object')
  ) {
    descuentosParaProcesar = descuentos;
    console.log(
      '💸 Procesando descuentos desde campo descuentos:',
      descuentosParaProcesar,
    );
  }

  // Procesar descuentos si se encontraron
  if (descuentosParaProcesar) {
    // Si descuentos es un array
    if (Array.isArray(descuentosParaProcesar)) {
      // Filtrar descuentos con monto mayor a cero
      const descuentosValidos = descuentosParaProcesar.filter((descuento) => {
        const montoDescuento = parsearMonto(
          descuento.Monto || descuento.monto || descuento.valor || 0,
        );
        return montoDescuento > 0;
      });

      console.log(
        `💸 Descuentos totales: ${descuentosParaProcesar.length}, válidos (>0): ${descuentosValidos.length}`,
      );

      if (descuentosValidos.length > 0) {
        descuentosArray = descuentosValidos.map((descuento, index) => {
          // Manejo flexible de diferentes campos para el monto
          const montoDescuento = parsearMonto(
            descuento.Monto || descuento.monto || descuento.valor || 0,
          );
          totalDescuentos += montoDescuento;

          return {
            NumeroLinea: (index + 1).toString(),
            TipoAjuste: 'D', // D = Descuento (formato TheFactoryHKA)
            IndicadorFacturacion: descuento.indicadorFacturacion || '4', // 4 = Exento por defecto para descuentos
            Descripcion:
              descuento.Descripcion ||
              descuento.descripcion ||
              descuento.concepto ||
              'Descuento aplicado',
            TipoValor: '$', // $ = Monto en pesos (requerido por DGII)
            Valor: montoDescuento.toFixed(2),
            Monto: montoDescuento.toFixed(2),
          };
        });
      }
    }
    // Si descuentos es un objeto con descuento global
    else if (
      descuentosParaProcesar.Monto ||
      descuentosParaProcesar.monto ||
      descuentosParaProcesar.valor ||
      descuentosParaProcesar.porcentaje
    ) {
      let montoDescuento = 0;

      if (descuentosParaProcesar.porcentaje) {
        // Calcular descuento por porcentaje
        const porcentaje = parseFloat(descuentosParaProcesar.porcentaje);
        montoDescuento = (parseFloat(montoTotalCorregido) * porcentaje) / 100;
        console.log(
          `💸 Descuento por porcentaje: ${porcentaje}% de ${montoTotalCorregido} = ${montoDescuento.toFixed(2)}`,
        );
      } else {
        // Descuento por monto fijo
        montoDescuento = parsearMonto(
          descuentosParaProcesar.Monto ||
            descuentosParaProcesar.monto ||
            descuentosParaProcesar.valor,
        );
        console.log(
          `💸 Descuento por monto fijo: ${montoDescuento.toFixed(2)}`,
        );
      }

      // Solo agregar descuento si el monto es mayor a cero
      if (montoDescuento > 0) {
        totalDescuentos = montoDescuento;

        descuentosArray = [
          {
            NumeroLinea: '1',
            TipoAjuste: 'D', // D = Descuento (formato TheFactoryHKA)
            IndicadorFacturacion:
              descuentosParaProcesar.indicadorFacturacion || '4', // 4 = Exento por defecto para descuentos
            Descripcion:
              descuentosParaProcesar.Descripcion ||
              descuentosParaProcesar.descripcion ||
              descuentosParaProcesar.concepto ||
              'Descuento global',
            TipoValor: descuentosParaProcesar.porcentaje ? '%' : '$', // % = Porcentaje, $ = Monto en pesos
            Valor: descuentosParaProcesar.porcentaje
              ? parseFloat(descuentosParaProcesar.porcentaje).toFixed(2)
              : montoDescuento.toFixed(2),
            Monto: montoDescuento.toFixed(2),
          },
        ];

        console.log(
          `💸 Descuento global válido agregado: ${montoDescuento.toFixed(2)}`,
        );
      } else {
        console.log(
          `💸 Descuento global ignorado (monto cero): ${montoDescuento.toFixed(2)}`,
        );
      }
    }

    // Calcular monto total después de descuentos
    montoTotalConDescuentos = parseFloat(montoTotalCorregido) - totalDescuentos;

    console.log(`💸 Total descuentos aplicados: ${totalDescuentos.toFixed(2)}`);
    console.log(`💰 Monto total original: ${montoTotalCorregido}`);
    console.log(
      `💰 Monto total con descuentos: ${montoTotalConDescuentos.toFixed(2)}`,
    );
  }

  // 🧮 AJUSTAR MONTOS EXENTOS Y GRAVADOS DESPUÉS DE DESCUENTOS
  // Para servicios médicos, la mayoría son exentos, así que simplificamos:
  // Si hay descuentos, el monto exento es igual al monto total con descuentos
  let montoExentoConDescuentos = parseFloat(montoExentoCalculado);
  let montoGravadoConDescuentos = parseFloat(montoGravadoCalculado);

  if (totalDescuentos > 0) {
    // Para servicios médicos (principalmente exentos), ajustar de manera simple:
    // - Si todo es exento, el monto exento = monto total con descuentos
    // - Si hay montos gravados, aplicar proporción

    if (parseFloat(montoGravadoCalculado) === 0) {
      // Solo hay montos exentos: el exento final = total con descuentos
      montoExentoConDescuentos = montoTotalConDescuentos;
      montoGravadoConDescuentos = 0;

      console.log(`💰 Ajuste simple para servicios exentos:`);
      console.log(
        `   - Todo es exento, monto exento = monto total con descuentos`,
      );
      console.log(
        `   - Monto exento final: ${montoExentoConDescuentos.toFixed(2)}`,
      );
    } else {
      // Hay montos gravados y exentos: aplicar proporción
      const proporcionDescuento =
        totalDescuentos / parseFloat(montoTotalCorregido);
      montoExentoConDescuentos =
        parseFloat(montoExentoCalculado) * (1 - proporcionDescuento);
      montoGravadoConDescuentos =
        parseFloat(montoGravadoCalculado) * (1 - proporcionDescuento);

      console.log(`💰 Ajuste proporcional para montos mixtos:`);
      console.log(
        `   - Monto exento con descuento: ${montoExentoConDescuentos.toFixed(2)}`,
      );
      console.log(
        `   - Monto gravado con descuento: ${montoGravadoConDescuentos.toFixed(2)}`,
      );
      console.log(
        `   - Proporción descuento: ${(proporcionDescuento * 100).toFixed(2)}%`,
      );
    }
  }

  // console.log(`💰 Cálculo de totales:`, {
  //   tipoComprobante: facturaAdaptada.tipo,
  //   montoTotalFactura: montoTotal,
  //   montoExentoCalculado: montoExentoCalculado,
  //   montoGravadoCalculado: montoGravadoCalculado,
  //   totalDescuentos: totalDescuentos.toFixed(2),
  //   montoTotalConDescuentos: montoTotalConDescuentos.toFixed(2),
  //   sumaCalculada: (
  //     parseFloat(montoExentoCalculado) + parseFloat(montoGravadoCalculado)
  //   ).toFixed(2),
  //   diferencia: (
  //     parseFloat(montoTotal) -
  //     parseFloat(montoExentoCalculado) -
  //     parseFloat(montoGravadoCalculado)
  //   ).toFixed(2),
  // });

  // Construir los detalles de items DESPUÉS de calcular los montos - camelCase según ejemplo oficial
  const detallesItems = itemsAdaptados.map((item, index) => {
    // Determinar si este item específico es gravado o exento
    let itemEsGravado = false;

    if (facturaAdaptada.tipo === '45') {
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
      facturaAdaptada.tipo === '41' ||
      facturaAdaptada.tipo === '46' ||
      facturaAdaptada.tipo === '47'
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
  if (facturaAdaptada.tipo === '45') {
    const totalDeclarado = parseFloat(montoTotal);
    const detalleCalculado = parseFloat(sumaItemsGravados);
    const diferencia = Math.abs(totalDeclarado - detalleCalculado);

    // Si hay diferencia mínima, ajustar los montos de los items proporcionalmente
    if (diferencia <= 1.0 && diferencia > 0) {
      const factorAjuste = totalDeclarado / detalleCalculado;

      // console.log(`🔧 Ajustando montos de items para tipo 45:`, {
      //   totalDeclarado: totalDeclarado,
      //   detalleCalculado: detalleCalculado,
      //   diferencia: diferencia.toFixed(2),
      //   factorAjuste: factorAjuste.toFixed(4),
      // });

      // Ajustar cada item gravado proporcionalmente
      detallesItems.forEach((item) => {
        if (item.IndicadorFacturacion === '1') {
          const montoOriginal = parseFloat(item.Monto);
          const montoAjustado = (montoOriginal * factorAjuste).toFixed(2);
          item.Monto = montoAjustado;
          item.PrecioUnitario = montoAjustado; // También ajustar precio unitario

          // console.log(`  Item ajustado: ${montoOriginal} → ${montoAjustado}`);
        }
      });

      // Recalcular sumas después del ajuste
      sumaItemsGravados = detallesItems
        .filter((item) => item.IndicadorFacturacion === '1')
        .reduce((suma, item) => suma + parseFloat(item.Monto), 0)
        .toFixed(2);
    }
  }

  // 💸 AJUSTAR ITEMS PROPORCIONALMENTE POR DESCUENTOS
  if (totalDescuentos > 0) {
    console.log('💸 Ajustando items por descuentos aplicados...');

    // Calcular la suma total de los items antes del ajuste
    const sumaItemsAntes = detallesItems.reduce(
      (suma, item) => suma + parseFloat(item.Monto),
      0,
    );

    // Calcular factor de ajuste por descuento
    const factorAjustePorDescuento = montoTotalConDescuentos / sumaItemsAntes;

    console.log(
      `💸 Factor de ajuste por descuento: ${factorAjustePorDescuento.toFixed(4)}`,
    );
    console.log(`💸 Suma items antes: ${sumaItemsAntes.toFixed(2)}`);
    console.log(
      `💸 Total con descuentos: ${montoTotalConDescuentos.toFixed(2)}`,
    );

    // Ajustar cada item proporcionalmente
    detallesItems.forEach((item, index) => {
      const montoOriginal = parseFloat(item.Monto);
      const montoAjustado = (montoOriginal * factorAjustePorDescuento).toFixed(
        2,
      );
      item.Monto = montoAjustado;
      item.PrecioUnitario = montoAjustado; // También ajustar precio unitario

      console.log(
        `   Item ${index + 1}: ${montoOriginal.toFixed(2)} → ${montoAjustado}`,
      );
    });

    // 🔧 AJUSTE FINAL: Corregir diferencias de redondeo
    const sumaItemsAjustados = detallesItems.reduce(
      (suma, item) => suma + parseFloat(item.Monto),
      0,
    );
    const diferenciaPorRedondeo = montoTotalConDescuentos - sumaItemsAjustados;

    if (Math.abs(diferenciaPorRedondeo) > 0.001) {
      // Ajustar el último item para que la suma sea exacta
      const ultimoItem = detallesItems[detallesItems.length - 1];
      const montoCorregido = (
        parseFloat(ultimoItem.Monto) + diferenciaPorRedondeo
      ).toFixed(2);
      ultimoItem.Monto = montoCorregido;
      ultimoItem.PrecioUnitario = montoCorregido;

      console.log(
        `🔧 Ajuste de redondeo en último item: ${diferenciaPorRedondeo.toFixed(4)}`,
      );
      console.log(`   Último item ajustado: ${montoCorregido}`);
    }

    // Recalcular sumas después del ajuste por descuentos
    sumaItemsGravados = detallesItems
      .filter((item) => item.IndicadorFacturacion === '1')
      .reduce((suma, item) => suma + parseFloat(item.Monto), 0)
      .toFixed(2);

    sumaItemsExentos = detallesItems
      .filter((item) => item.IndicadorFacturacion === '4')
      .reduce((suma, item) => suma + parseFloat(item.Monto), 0)
      .toFixed(2);

    const sumaItemsDespues = detallesItems.reduce(
      (suma, item) => suma + parseFloat(item.Monto),
      0,
    );

    console.log(`💸 Suma items después: ${sumaItemsDespues.toFixed(2)}`);
    console.log(
      `💸 Diferencia final: ${Math.abs(sumaItemsDespues - montoTotalConDescuentos).toFixed(4)}`,
    );
  }

  // console.log(`🔍 Verificación detalle vs totales:`, {
  //   tipoComprobante: facturaAdaptada.tipo,
  //   itemsGravadosDetalle: sumaItemsGravados,
  //   montoGravadoCalculado: montoGravadoCalculado,
  //   diferenciaGravado: (
  //     parseFloat(sumaItemsGravados) - parseFloat(montoGravadoCalculado)
  //   ).toFixed(2),
  //   itemsExentosDetalle: sumaItemsExentos,
  //   montoExentoCalculado: montoExentoCalculado,
  //   diferenciaExento: (
  //     parseFloat(sumaItemsExentos) - parseFloat(montoExentoCalculado)
  //   ).toFixed(2),
  // });

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
            TipoDocumento: facturaAdaptada.tipo,
            NCF: facturaAdaptada.ncf,
            FechaVencimientoSecuencia: esFechaVencimientoObligatoria(
              facturaAdaptada.tipo,
            )
              ? fechaVencimientoFormateada
              : null,
          };

          // Configuración específica por tipo de comprobante
          if (facturaAdaptada.tipo === '31' || facturaAdaptada.tipo === '32') {
            // Tipos 31, 32: Facturas de Crédito Fiscal y Consumo - incluyen indicadorEnvioDiferido
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
                  Monto: montoTotalConDescuentos.toFixed(2),
                },
              ],
            };
          } else if (facturaAdaptada.tipo === '33') {
            // Tipo 33: Nota de Débito - SÍ incluir FechaVencimientoSecuencia (requerido por TheFactoryHKA)
            return {
              TipoDocumento: facturaAdaptada.tipo,
              NCF: facturaAdaptada.ncf,
              FechaVencimientoSecuencia: fechaVencimientoFormateada, // ✅ OBLIGATORIO para tipo 33
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              TipoIngresos: '03', // ESPECÍFICO para Nota de Débito (OBLIGATORIO)
              TipoPago: '1',
              TablaFormasPago: [
                {
                  Forma: '1',
                  Monto: montoTotalConDescuentos.toFixed(2),
                },
              ],
            };
          } else if (facturaAdaptada.tipo === '34') {
            // Tipo 34: Nota de Crédito - estructura especial SIN fechaVencimiento ni indicadorEnvioDiferido
            return {
              TipoDocumento: facturaAdaptada.tipo,
              NCF: facturaAdaptada.ncf,
              // NO incluir FechaVencimientoSecuencia para tipo 34
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              IndicadorNotaCredito: '0', // OBLIGATORIO para tipo 34
              TipoIngresos: '01',
              TipoPago: '1',
            };
          } else if (facturaAdaptada.tipo === '41') {
            // Tipo 41: Compras - incluyen indicadorMontoGravado pero NO indicadorEnvioDiferido
            return {
              ...baseIdDoc,
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              TipoPago: '1',
              TablaFormasPago: [
                {
                  Forma: '1',
                  Monto: montoTotalConDescuentos.toFixed(2),
                },
              ],
            };
          } else if (facturaAdaptada.tipo === '43') {
            // Tipo 43: Gastos Menores - estructura muy simple, solo campos básicos
            return {
              ...baseIdDoc,
            };
          } else if (facturaAdaptada.tipo === '45') {
            // Tipo 45: Gubernamental - incluye indicadorMontoGravado y tipoIngresos pero NO tablaFormasPago
            return {
              ...baseIdDoc,
              IndicadorMontoGravado:
                parseFloat(montoGravadoCalculado) > 0 ? '1' : '0',
              TipoIngresos: '01',
              TipoPago: '1',
            };
          } else if (
            facturaAdaptada.tipo === '44' ||
            facturaAdaptada.tipo === '46' ||
            facturaAdaptada.tipo === '47'
          ) {
            // Tipos 44, 46, 47: Regímenes especiales - NO incluyen indicadorMontoGravado ni indicadorEnvioDiferido
            return {
              ...baseIdDoc,
              TipoIngresos: '01',
              TipoPago: '1',
              TablaFormasPago: [
                {
                  Forma: '1',
                  Monto: montoTotalConDescuentos.toFixed(2),
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
                Monto: montoTotalConDescuentos.toFixed(2),
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
            FechaEmision: formatearFecha(facturaAdaptada.fecha),
          };

          // Para tipos 31, 32, 33, 34: incluir campos adicionales del emisor
          if (
            facturaAdaptada.tipo === '31' ||
            facturaAdaptada.tipo === '32' ||
            facturaAdaptada.tipo === '33' ||
            facturaAdaptada.tipo === '34'
          ) {
            return {
              ...baseEmisor,
              nombreComercial: stringVacioANull(emisor.razonSocial),
              correo: stringVacioANull(emisor.correo),
              webSite: emisor.webSite || null,
              codigoVendedor: facturaAdaptada.id || null,
              numeroFacturaInterna: stringVacioANull(facturaAdaptada.id),
              numeroPedidoInterno: stringVacioANull(facturaAdaptada.id),
              zonaVenta: 'PRINCIPAL',
            };
          }

          // Para otros tipos (41, 43, etc.): estructura más simple
          return baseEmisor;
        })(),
        // Comprador: Tipo 43 NO incluye comprador según estructura oficial
        ...(facturaAdaptada.tipo !== '43' && {
          comprador: (() => {
            const baseComprador = {
              rnc: facturaAdaptada.tipo === '32' ? null : comprador.rnc, // 🔧 Para tipo 32: null (consumidor final)
              razonSocial: stringVacioANull(comprador.nombre),
              correo: stringVacioANull(comprador.correo),
              direccion: stringVacioANull(comprador.direccion),
              municipio: comprador.municipio || null,
              provincia: comprador.provincia || null,
            };

            // Para tipos 31, 32, 33, 34: incluir campos adicionales del comprador
            if (
              facturaAdaptada.tipo === '31' ||
              facturaAdaptada.tipo === '32' ||
              facturaAdaptada.tipo === '33' ||
              facturaAdaptada.tipo === '34'
            ) {
              return {
                ...baseComprador,
                contacto: stringVacioANull(comprador.nombre),
                envioMail: stringVacioANull(comprador.correo) ? 'SI' : 'NO',
                fechaEntrega: comprador.fechaEntrega || null,
                fechaOrden: comprador.fechaOrden || null,
                numeroOrden: comprador.numeroOrden || null,
                codigoInterno:
                  comprador.codigoInterno ||
                  (facturaAdaptada.tipo === '32' ? null : comprador.rnc), // 🔧 Para tipo 32: null
              };
            }

            // Para otros tipos: estructura más simple
            return baseComprador;
          })(),
        }),
        // informacionesAdicionales solo para tipos 31, 32, 33, 34
        ...(facturaAdaptada.tipo === '31' ||
        facturaAdaptada.tipo === '32' ||
        facturaAdaptada.tipo === '33' ||
        facturaAdaptada.tipo === '34'
          ? {
              informacionesAdicionales: {
                numeroContenedor: facturaAdaptada.numeroContenedor || null,
                numeroReferencia: stringVacioANull(facturaAdaptada.id),
              },
            }
          : {}),
        Totales: (() => {
          // Estructura según ejemplo oficial de TheFactoryHKA (camelCase)
          const baseTotales = {
            montoGravadoTotal:
              parseFloat(montoGravadoConDescuentos) > 0
                ? montoGravadoConDescuentos.toFixed(2)
                : null,
            montoGravadoI1:
              parseFloat(montoGravadoConDescuentos) > 0
                ? montoGravadoConDescuentos.toFixed(2)
                : null,
            itbiS1: parseFloat(montoGravadoConDescuentos) > 0 ? '18' : null,
            totalITBIS:
              parseFloat(montoGravadoConDescuentos) > 0
                ? (parseFloat(montoGravadoConDescuentos) * 0.18).toFixed(2)
                : null,
            totalITBIS1:
              parseFloat(montoGravadoConDescuentos) > 0
                ? (parseFloat(montoGravadoConDescuentos) * 0.18).toFixed(2)
                : null,
            montoTotal: montoTotalConDescuentos.toFixed(2),
          };

          // Para tipos 31, 32, 33, 34: Incluir montoExento (según ejemplo oficial)
          if (
            facturaAdaptada.tipo === '31' ||
            facturaAdaptada.tipo === '32' ||
            facturaAdaptada.tipo === '33' ||
            facturaAdaptada.tipo === '34'
          ) {
            return {
              ...baseTotales,
              montoExento:
                parseFloat(montoExentoConDescuentos) > 0
                  ? montoExentoConDescuentos.toFixed(2)
                  : null,
            };
          }

          // Para tipo 43: Gastos Menores - estructura muy simple
          if (facturaAdaptada.tipo === '43') {
            return {
              montoExento: montoTotalConDescuentos.toFixed(2), // Para tipo 43, todo es monto exento
              montoTotal: montoTotalConDescuentos.toFixed(2),
            };
          }

          // Para tipo 44: Régimen especial - NO incluir campos de retención
          if (facturaAdaptada.tipo === '44') {
            return {
              ...baseTotales,
              montoExento:
                parseFloat(montoExentoConDescuentos) > 0
                  ? montoExentoConDescuentos.toFixed(2)
                  : null,
              valorPagar: montoTotalConDescuentos.toFixed(2),
            };
          }

          // Para tipo 45: Gubernamental - incluir campos ITBIS pero NO retención
          if (facturaAdaptada.tipo === '45') {
            // Después del ajuste de items, usar directamente la suma del detalle
            const montoGravadoFinal = parseFloat(sumaItemsGravados);
            const itbisCalculado = montoGravadoFinal * 0.18;
            const montoTotalConImpuestos =
              montoGravadoFinal + itbisCalculado + parseFloat(sumaItemsExentos);

            // console.log(`✅ Cálculo final para tipo 45:`, {
            //   montoGravadoDetalle: sumaItemsGravados,
            //   itbisCalculado: itbisCalculado.toFixed(2),
            //   montoTotalConImpuestos: montoTotalConImpuestos.toFixed(2),
            // });

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
              parseFloat(montoExentoConDescuentos) > 0
                ? montoExentoConDescuentos.toFixed(2)
                : null,
            valorPagar: montoTotalConDescuentos.toFixed(2),
            totalITBISRetenido:
              parseFloat(montoGravadoConDescuentos) > 0
                ? (parseFloat(montoGravadoConDescuentos) * 0.18).toFixed(2)
                : '0.00',
            totalISRRetencion: '0.00',
          };
        })(),
      },
      DetallesItems: detallesItems,
      // Agregar sección de descuentos/recargos si existen
      ...(descuentosArray.length > 0 && {
        DescuentosORecargos: descuentosArray,
      }),
      // Para tipo 45: Agregar sección vacía de descuentos/recargos para validación (si no hay descuentos)
      ...(facturaAdaptada.tipo === '45' &&
        descuentosArray.length === 0 && {
          DescuentosORecargos: [],
        }),
      // Para tipos 33 y 34: Agregar InformacionReferencia OBLIGATORIA (con validación)
      ...((facturaAdaptada.tipo === '33' || facturaAdaptada.tipo === '34') &&
        (() => {
          // Validar que se proporcionen los campos obligatorios para tipos 33 y 34
          if (!facturaAdaptada.ncfModificado) {
            throw new Error(
              `❌ Tipo ${facturaAdaptada.tipo} requiere "ncfModificado": NCF de la factura original que se está modificando`,
            );
          }
          if (!facturaAdaptada.fechaNCFModificado) {
            throw new Error(
              `❌ Tipo ${facturaAdaptada.tipo} requiere "fechaNCFModificado": Fecha de la factura original`,
            );
          }
          if (!facturaAdaptada.codigoModificacion) {
            throw new Error(
              `❌ Tipo ${facturaAdaptada.tipo} requiere "codigoModificacion": Código que indica el tipo de modificación (1,2,3,4)`,
            );
          }
          if (!facturaAdaptada.razonModificacion) {
            throw new Error(
              `❌ Tipo ${facturaAdaptada.tipo} requiere "razonModificacion": Razón descriptiva de la modificación`,
            );
          }

          return {
            InformacionReferencia: {
              NCFModificado: facturaAdaptada.ncfModificado,
              FechaNCFModificado: formatearFecha(
                facturaAdaptada.fechaNCFModificado,
              ),
              CodigoModificacion: facturaAdaptada.codigoModificacion,
              RazonModificacion: facturaAdaptada.razonModificacion,
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
      timeout: 60000, // 60 segundos de timeout (aumentado)
    });

    // console.log('Respuesta de TheFactoryHKA:', response.data);

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
    // console.log('📋 Consultando estatus inmediato post-envío...');
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
      error.message.includes('token') ||
      error.message.includes('expirado') ||
      error.message.includes('expired') ||
      (error.response &&
        (error.response.status === 401 || error.response.status === 403))
    ) {
      console.log(
        '🔄 Error de autenticación detectado, limpiando cache del token...',
      );
      // Limpiar cache del token
      limpiarCacheToken();

      return res.status(httpStatus.UNAUTHORIZED).json({
        status: 'error',
        message: 'Token expirado. Vuelve a intentar la operación',
        details:
          'El token de autenticación ha expirado. El sistema lo renovará automáticamente en el próximo intento.',
        codigo: 'TOKEN_EXPIRADO',
        sugerencia: 'Reintente la operación en unos segundos',
      });
    }

    if (error.response) {
      // Error de la API de TheFactoryHKA
      console.error('❌ Respuesta de error de TheFactoryHKA:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));

      // Extraer errores de validación específicos si existen
      let detallesValidacion = error.response.data;
      if (error.response.data.errors) {
        console.error('Errores de validación:');
        console.error(JSON.stringify(error.response.data.errors, null, 2));
        detallesValidacion = {
          ...error.response.data,
          erroresDetallados: error.response.data.errors,
        };
      }

      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Error en el envío a TheFactoryHKA',
        details: detallesValidacion,
        statusCode: error.response.status,
      });
    }

    if (error.code === 'ECONNABORTED') {
      console.warn(
        `⏰ TIMEOUT TheFactoryHKA para NCF: ${req.body.factura?.ncf || 'N/A'} - Duración: 60+ segundos`,
      );
      return res.status(httpStatus.REQUEST_TIMEOUT).json({
        status: 'error',
        message: 'Timeout: TheFactoryHKA tardó más de 60 segundos en responder',
        details:
          'El servicio de TheFactoryHKA está experimentando lentitud. La factura puede haberse procesado correctamente. Consulte el estatus del documento.',
        ncf: req.body.factura?.ncf || null,
        sugerencia:
          'Usar el endpoint /consultar-estatus para verificar si la factura fue procesada',
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
    // console.log(
    //   `\n📋 ==================== ENDPOINT CONSULTAR ESTATUS ====================`,
    // );
    // console.log('📥 Request body recibido:');
    // console.log(JSON.stringify(req.body, null, 2));

    const { ncf, reintentar } = req.body;

    // Validar que se proporcione el NCF
    if (!ncf) {
      // console.log('❌ NCF no proporcionado');
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El campo NCF es requerido',
        details: 'Debe proporcionar el NCF del documento a consultar',
      });
    }

    // console.log(`🔍 Consulta de estatus solicitada para NCF: ${ncf}`);

    // Si se solicita reintentar, esperar 2 segundos antes de consultar
    if (reintentar) {
      // console.log('🔄 Reintento solicitado, esperando 2 segundos...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Consultar estatus en TheFactoryHKA
    const estatusConsulta = await consultarEstatusInmediato(ncf);

    // console.log('📊 Resultado de consultarEstatusInmediato:');
    // console.log(JSON.stringify(estatusConsulta, null, 2));

    if (estatusConsulta.consultaExitosa) {
      // Interpretar el estado devuelto por TheFactoryHKA
      const estadoOriginal =
        estatusConsulta.datosEstatus.estado ||
        estatusConsulta.datosEstatus.status ||
        estatusConsulta.datosEstatus.mensaje ||
        'DESCONOCIDO';

      // console.log(`📝 Estado original extraído: "${estadoOriginal}"`);
      // console.log('🔍 datosEstatus completos:');
      // console.log(JSON.stringify(estatusConsulta.datosEstatus, null, 2));

      const estadoNormalizado = normalizarEstadoFactura(
        estadoOriginal,
        estatusConsulta.datosEstatus,
      );

      // console.log(`✅ Estado normalizado: "${estadoNormalizado}"`);
      // console.log(`📤 Enviando respuesta exitosa al cliente`);

      // Agregar información adicional si el documento no fue encontrado
      let mensajeAdicional = null;
      if (
        estadoNormalizado === 'NO_ENCONTRADO' ||
        estatusConsulta.datosEstatus.codigo === 120
      ) {
        // console.log(
        //   '⚠️ ADVERTENCIA: Documento no encontrado en TheFactoryHKA (código 120)',
        // );
        mensajeAdicional =
          'El documento no se encuentra en la base de datos de TheFactoryHKA. Posibles causas: ' +
          '1) El documento nunca fue enviado, ' +
          '2) Diferencia de ambiente (Demo vs Producción), ' +
          '3) RNC incorrecto en la consulta, ' +
          '4) Delay en la sincronización de TheFactoryHKA.';
      }

      const respuestaFinal = {
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
          ...(mensajeAdicional && { advertencia: mensajeAdicional }),
        },
      };

      // console.log('📤 Respuesta final que se enviará:');
      // console.log(JSON.stringify(respuestaFinal, null, 2));
      // console.log(
      //   `📋 ==================== FIN ENDPOINT CONSULTAR ESTATUS ====================\n`,
      // );

      return res.status(httpStatus.OK).json(respuestaFinal);
    } else {
      // console.log('❌ Consulta NO exitosa');
      // console.log(`❌ Error: ${estatusConsulta.error}`);
      // console.log(
      //   `📋 ==================== FIN ENDPOINT CONSULTAR ESTATUS (ERROR) ====================\n`,
      // );

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
    console.error('❌ Error CRÍTICO en consulta de estatus:', error);
    console.error('📚 Stack trace:', error.stack);
    // console.log(
    //   `📋 ==================== FIN ENDPOINT CONSULTAR ESTATUS (ERROR CRÍTICO) ====================\n`,
    // );

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno del servidor al consultar estatus',
      details: error.message,
    });
  }
};

// Endpoint para limpiar cache del token (útil para debugging)
const limpiarTokenCache = async (req, res) => {
  try {
    limpiarCacheToken();

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Cache del token limpiado exitosamente',
      details: 'El próximo envío obtendrá un token nuevo',
    });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error al limpiar cache del token',
      details: error.message,
    });
  }
};

// 📧 Endpoint para enviar email de documento electrónico vía The Factory HKA
const enviarEmailFactura = async (req, res) => {
  // Importación lazy para evitar dependencia circular
  const { enviarEmailDocumento } = require('../api/thefactory-email');
  return await enviarEmailDocumento(req, res);
};

// Función para anular comprobantes fiscales
const anularComprobantes = async (req, res) => {
  try {
    console.log(
      '📋 Solicitud de anulación recibida:',
      JSON.stringify(req.body, null, 2),
    );

    const { rnc, anulaciones, fechaHoraAnulacion } = req.body;

    // ====== VALIDACIONES ======

    // 1. Validar campos requeridos
    if (!rnc) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El campo RNC es obligatorio',
      });
    }

    if (
      !anulaciones ||
      !Array.isArray(anulaciones) ||
      anulaciones.length === 0
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message:
          'El campo anulaciones es obligatorio y debe ser un array con al menos una anulación',
      });
    }

    // 2. Validar tipos de documentos permitidos
    const tiposDocumentosValidos = [
      '31',
      '32',
      '33',
      '34',
      '41',
      '43',
      '44',
      '45',
      '46',
      '47',
    ];

    // 3. Validar formato de NCF (E + 2 dígitos + 8-10 dígitos de secuencia)
    // Acepta tanto NCF estándar (11 caracteres) como NCF extendido (13 caracteres)
    const ncfRegex = /^E\d{2}\d{8,10}$/;

    // 4. Validar cada anulación
    for (let i = 0; i < anulaciones.length; i++) {
      const anulacion = anulaciones[i];

      if (!anulacion.tipoDocumento) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: El campo tipoDocumento es obligatorio`,
        });
      }

      if (!tiposDocumentosValidos.includes(anulacion.tipoDocumento)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: Tipo de documento inválido. Debe ser uno de: ${tiposDocumentosValidos.join(', ')}`,
        });
      }

      // 🔧 MEJORA: Soportar diferentes formatos de entrada
      // Opción 1: { ncf: "E310000000098" } - anular un solo comprobante
      // Opción 2: { ncfDesde: "E310000000098" } - anular un solo comprobante (sin ncfHasta)
      // Opción 3: { ncfDesde: "E310000000098", ncfHasta: "E310000000099" } - anular rango

      if (anulacion.ncf && !anulacion.ncfDesde) {
        // Si usa 'ncf', copiarlo a ncfDesde y ncfHasta
        anulacion.ncfDesde = anulacion.ncf;
        anulacion.ncfHasta = anulacion.ncf;
      } else if (anulacion.ncfDesde && !anulacion.ncfHasta) {
        // Si solo proporciona ncfDesde, asumir que es un solo comprobante
        anulacion.ncfHasta = anulacion.ncfDesde;
      }

      // Validar que al menos tengamos ncfDesde
      if (!anulacion.ncfDesde) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: Debe proporcionar 'ncf' o 'ncfDesde' (o ambos 'ncfDesde' y 'ncfHasta' para un rango)`,
        });
      }

      // Asegurar que ncfHasta existe
      if (!anulacion.ncfHasta) {
        anulacion.ncfHasta = anulacion.ncfDesde;
      }

      // Validar formato de NCF
      if (!ncfRegex.test(anulacion.ncfDesde)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: NCF Desde tiene formato inválido. Debe ser E + tipo (2 dígitos) + secuencia (8-10 dígitos). Ejemplos: E310000000098 o E310000000147`,
        });
      }

      if (!ncfRegex.test(anulacion.ncfHasta)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: NCF Hasta tiene formato inválido. Debe ser E + tipo (2 dígitos) + secuencia (8-10 dígitos). Ejemplos: E310000000099 o E310000000148`,
        });
      }

      // Validar que el tipo de documento coincida con el prefijo del NCF
      const tipoEnNCFDesde = anulacion.ncfDesde.substring(1, 3);
      const tipoEnNCFHasta = anulacion.ncfHasta.substring(1, 3);

      if (tipoEnNCFDesde !== anulacion.tipoDocumento) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: El tipo de documento (${anulacion.tipoDocumento}) no coincide con el prefijo del NCF Desde (${tipoEnNCFDesde})`,
        });
      }

      if (tipoEnNCFHasta !== anulacion.tipoDocumento) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: El tipo de documento (${anulacion.tipoDocumento}) no coincide con el prefijo del NCF Hasta (${tipoEnNCFHasta})`,
        });
      }

      // Validar que ncfHasta >= ncfDesde
      const secuenciaDesde = parseInt(anulacion.ncfDesde.substring(3), 10);
      const secuenciaHasta = parseInt(anulacion.ncfHasta.substring(3), 10);

      if (secuenciaHasta < secuenciaDesde) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: `Anulación ${i + 1}: NCF Hasta debe ser mayor o igual a NCF Desde`,
        });
      }
    }

    // ====== TRANSFORMACIÓN AL FORMATO DE THEFACTORY ======

    // Generar fecha/hora de anulación en formato DD-MM-YYYY HH:mm:ss
    let fechaFormateada;
    if (fechaHoraAnulacion) {
      // Si el usuario proporciona la fecha, validar formato
      const fechaRegex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/;
      if (!fechaRegex.test(fechaHoraAnulacion)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'Formato de fecha inválido. Debe ser DD-MM-YYYY HH:mm:ss',
        });
      }
      fechaFormateada = fechaHoraAnulacion;
    } else {
      // Generar fecha/hora actual
      const ahora = new Date();
      const dia = String(ahora.getDate()).padStart(2, '0');
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const anio = ahora.getFullYear();
      const horas = String(ahora.getHours()).padStart(2, '0');
      const minutos = String(ahora.getMinutes()).padStart(2, '0');
      const segundos = String(ahora.getSeconds()).padStart(2, '0');
      fechaFormateada = `${dia}-${mes}-${anio} ${horas}:${minutos}:${segundos}`;
    }

    // Calcular cantidad total de NCFs a anular
    let cantidadTotal = 0;
    const detallesAnulacion = anulaciones.map((anulacion, index) => {
      const secuenciaDesde = parseInt(anulacion.ncfDesde.substring(3), 10);
      const secuenciaHasta = parseInt(anulacion.ncfHasta.substring(3), 10);
      const cantidad = secuenciaHasta - secuenciaDesde + 1;
      cantidadTotal += cantidad;

      return {
        NumeroLinea: String(index + 1),
        TipoDocumento: anulacion.tipoDocumento,
        TablaSecuenciasAnuladas: [
          {
            NCFDesde: anulacion.ncfDesde,
            NCFHasta: anulacion.ncfHasta,
          },
        ],
        Cantidad: String(cantidad).padStart(2, '0'),
      };
    });

    // Obtener token de autenticación
    console.log('🔑 Obteniendo token de autenticación...');
    const token = await obtenerTokenTheFactory();

    // Construir payload completo para TheFactoryHKA
    const payloadAnulacion = {
      token: token,
      Anulacion: {
        Encabezado: {
          RNC: rnc,
          Cantidad: String(cantidadTotal).padStart(2, '0'),
          FechaHoraAnulacioneNCF: fechaFormateada,
        },
        DetallesAnulacion: detallesAnulacion,
      },
    };

    console.log(
      '📤 Enviando anulación a TheFactoryHKA:',
      JSON.stringify(payloadAnulacion, null, 2),
    );

    // Enviar a TheFactoryHKA
    const response = await axios.post(
      THEFACTORY_ANULACION_URL,
      payloadAnulacion,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 segundos de timeout
      },
    );

    console.log(
      '📥 Respuesta de TheFactoryHKA:',
      JSON.stringify(response.data, null, 2),
    );

    // Verificar respuesta
    // TheFactory usa procesado:true y código 100 para éxito en anulaciones
    // (diferente a código 0 en otros endpoints)
    if (
      response.data.procesado === true ||
      response.data.codigo === 0 ||
      response.data.codigo === 100
    ) {
      // Éxito
      return res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Secuencias anuladas exitosamente',
        data: {
          codigo: response.data.codigo,
          mensaje: response.data.mensaje,
          procesado: response.data.procesado,
          xmlBase64: response.data.xmlBase64, // XML firmado de la anulación
          cantidadAnulada: cantidadTotal,
          detalles: anulaciones.map((a, i) => ({
            tipoDocumento: a.tipoDocumento,
            ncfDesde: a.ncfDesde,
            ncfHasta: a.ncfHasta,
            cantidad: detallesAnulacion[i].Cantidad,
          })),
        },
      });
    } else {
      // Error de negocio de TheFactoryHKA
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: `Error al anular: ${response.data.mensaje}`,
        details: {
          codigo: response.data.codigo,
          mensaje: response.data.mensaje,
          procesado: response.data.procesado,
        },
      });
    }
  } catch (error) {
    console.error('❌ Error al anular comprobantes:', error);

    // Manejo de errores de axios
    if (error.response) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error en la respuesta de TheFactoryHKA',
        details: {
          status: error.response.status,
          data: error.response.data,
        },
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(httpStatus.REQUEST_TIMEOUT).json({
        status: 'error',
        message: 'Timeout al conectar con TheFactoryHKA',
      });
    }

    // Error genérico
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno al procesar la anulación',
      details: error.message,
    });
  }
};

/**
 * @description Descarga archivo XML o PDF de un documento electrónico desde TheFactoryHKA
 * @route POST /comprobantes/descargar-archivo
 * @access Privado (requiere autenticación)
 */
const descargarArchivo = async (req, res) => {
  try {
    const { rnc, documento, extension } = req.body;

    // Validar parámetros requeridos
    if (!rnc) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El parámetro "rnc" es obligatorio',
      });
    }

    if (!documento) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El parámetro "documento" es obligatorio (número de e-NCF)',
      });
    }

    if (!extension) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message:
          'El parámetro "extension" es obligatorio (valores permitidos: "xml" o "pdf")',
      });
    }

    // Validar que la extensión sea válida
    const extensionesPermitidas = ['xml', 'pdf'];
    if (!extensionesPermitidas.includes(extension.toLowerCase())) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'El parámetro "extension" debe ser "xml" o "pdf"',
      });
    }

    console.log('📥 Descargando archivo desde TheFactoryHKA...');
    console.log(`   RNC: ${rnc}`);
    console.log(`   Documento: ${documento}`);
    console.log(`   Extensión: ${extension}`);

    // Obtener token de autenticación
    const token = await obtenerTokenTheFactory();

    // Preparar request para TheFactoryHKA
    const descargaRequest = {
      token: token,
      rnc: rnc,
      documento: documento,
      extension: extension.toLowerCase(),
    };

    console.log('📤 Enviando solicitud de descarga a TheFactoryHKA...');

    // Enviar solicitud a TheFactoryHKA
    const response = await axios.post(
      THEFACTORY_DESCARGA_URL,
      descargaRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 segundos para descarga
      },
    );

    console.log('✅ Respuesta de TheFactoryHKA recibida');
    console.log(`   Código: ${response.data.codigo}`);
    console.log(`   Mensaje: ${response.data.mensaje}`);
    console.log(`   Procesado: ${response.data.procesado}`);

    // Verificar respuesta exitosa
    // Códigos exitosos: 0 (éxito general) o 130 (descarga exitosa)
    if (
      (response.data.codigo === 0 || response.data.codigo === 130) &&
      response.data.procesado
    ) {
      // Descarga exitosa
      return res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Archivo descargado exitosamente',
        data: {
          archivo: response.data.archivo, // Base64 del archivo
          extension: extension.toLowerCase(),
          documento: documento,
          rnc: rnc,
          procesado: response.data.procesado,
          codigo: response.data.codigo,
          mensaje: response.data.mensaje,
        },
      });
    } else {
      // Error en la descarga
      console.error('❌ Error en la descarga:', response.data.mensaje);
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: `Error al descargar archivo: ${response.data.mensaje}`,
        details: {
          codigo: response.data.codigo,
          mensaje: response.data.mensaje,
          procesado: response.data.procesado,
        },
      });
    }
  } catch (error) {
    console.error('❌ Error al descargar archivo:', error);

    // Manejo de errores de axios
    if (error.response) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error en la respuesta de TheFactoryHKA',
        details: {
          status: error.response.status,
          data: error.response.data,
        },
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(httpStatus.REQUEST_TIMEOUT).json({
        status: 'error',
        message: 'Timeout al conectar con TheFactoryHKA',
      });
    }

    // Error genérico
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error interno al procesar la descarga',
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
  limpiarTokenCache, // NUEVO: Endpoint para limpiar cache
  obtenerTokenTheFactory, // Exportar también la función de autenticación para posibles usos externos
  enviarEmailFactura, // NUEVO: Endpoint para enviar emails vía The Factory HKA
  anularComprobantes, // NUEVO: Endpoint para anular comprobantes fiscales
  descargarArchivo, // NUEVO: Endpoint para descargar archivos XML/PDF
};
