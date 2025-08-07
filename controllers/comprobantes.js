const httpStatus = require('http-status');
const { Comprobante } = require('../models/comprobante');
const axios = require('axios');
const {
  THEFACTORY_AUTH_URL,
  THEFACTORY_ENVIAR_URL,
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

    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { usuario: req.user._id };
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

    // Validar que se proporcionen los datos requeridos
    if (!rnc || !tipo_comprobante) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'RNC y tipo de comprobante son requeridos',
      });
    }

    // console.log(rnc, tipo_comprobante);

    // Buscar un rango activo y válido para este usuario, RNC y tipo de comprobante
    const rango = await Comprobante.findOne({
      rnc: rnc,
      tipo_comprobante: tipo_comprobante,
      usuario: req.user._id,
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

  // Construir los detalles de items
  const detallesItems = items.map((item, index) => ({
    numeroLinea: (index + 1).toString(),
    tablaCodigos: null,
    indicadorFacturacion: '4', // Servicios
    retencion: null,
    nombre: stringVacioANull(item.nombre),
    indicadorBienoServicio: '1', // Servicio
    descripcion: item.descripcion || null,
    cantidad: '1.00', // Cantidad por defecto
    unidadMedida: '47', // Unidad (servicios)
    cantidadReferencia: null,
    unidadReferencia: null,
    tablaSubcantidad: null,
    gradosAlcohol: null,
    precioUnitarioReferencia: null,
    fechaElaboracion: null,
    fechaVencimiento: null,
    mineria: null,
    precioUnitario: parseFloat(item.precio).toFixed(2),
    descuentoMonto: null,
    tablaSubDescuento: null,
    recargoMonto: null,
    tablaSubRecargo: null,
    tablaImpuestoAdicional: null,
    otraMonedaDetalle: null,
    monto: parseFloat(item.precio).toFixed(2),
  }));

  // Calcular totales
  const montoTotal = parseFloat(factura.total).toFixed(2);

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

  // Estructura completa para TheFactoryHKA
  const documentoCompleto = {
    Token: token,
    documentoElectronico: {
      encabezado: {
        identificacionDocumento: {
          tipoDocumento: factura.tipo,
          ncf: factura.ncf,
          fechaVencimientoSecuencia: '31-12-2025',
          indicadorEnvioDiferido: '1',
          indicadorMontoGravado: '1',
          indicadorNotaCredito: null,
          tipoIngresos: '01',
          tipoPago: '1',
          fechaLimitePago: null,
          terminoPago: null,
          tablaFormasPago: [
            {
              forma: '1', // Efectivo
              monto: montoTotal,
            },
          ],
          tipoCuentaPago: null,
          numeroCuentaPago: null,
          bancoPago: null,
          fechaDesde: null,
          fechaHasta: null,
        },
        emisor: {
          rnc: emisor.rnc,
          razonSocial: stringVacioANull(emisor.razonSocial),
          nombreComercial: stringVacioANull(emisor.razonSocial),
          sucursal: 'Principal',
          direccion: stringVacioANull(emisor.direccion),
          tablaTelefono: emisor.telefono || [],
          correo: stringVacioANull(emisor.correo),
          webSite: null,
          actividadEconomica: null,
          codigoVendedor: factura.id || 'VEND001',
          numeroFacturaInterna: stringVacioANull(factura.id),
          numeroPedidoInterno: stringVacioANull(factura.id),
          zonaVenta: 'PRINCIPAL',
          rutaVenta: null,
          informacionAdicional: null,
          fechaEmision: formatearFecha(factura.fecha),
        },
        comprador: {
          rnc: comprador.rnc,
          identificacionExtranjero: null,
          razonSocial: stringVacioANull(comprador.nombre),
          contacto: stringVacioANull(comprador.nombre),
          correo: stringVacioANull(comprador.correo),
          envioMail: stringVacioANull(comprador.correo) ? 'SI' : 'NO',
          direccion: stringVacioANull(comprador.direccion),
          fechaEntrega: null,
          fechaOrdenCompra: null,
          contactoEntrega: null,
          direccionEntrega: null,
          telefonoAdicional: null,
          fechaOrden: null,
          numeroOrden: null,
          codigoInterno: comprador.rnc,
          responsablePago: null,
          informacionAdicional: null,
        },
        informacionesAdicionales: {
          fechaEmbarque: null,
          numeroEmbarque: null,
          numeroContenedor: null,
          numeroReferencia: stringVacioANull(factura.id),
          pesoBruto: null,
          pesoNeto: null,
          unidadPesoBruto: null,
          unidadPesoNeto: null,
          cantidadBulto: null,
          unidadBulto: null,
          volumenBulto: null,
          unidadVolumen: null,
          nombrePuertoEmbarque: null,
          condicionesEntrega: null,
          totalFob: null,
          seguro: null,
          flete: null,
          otrosGastos: null,
          totalCif: null,
          regimenAduanero: null,
          nombrePuertoSalida: null,
          nombrePuertoDesembarque: null,
        },
        transporte: null,
        totales: {
          montoGravadoTotal: null,
          montoGravadoI1: null,
          montoGravadoI2: null,
          montoGravadoI3: null,
          montoExento: montoTotal, // Asumiendo que es exento de ITBIS
          itbiS1: null,
          itbiS2: null,
          itbiS3: null,
          totalITBIS: null,
          totalITBIS1: null,
          totalITBIS2: null,
          totalITBIS3: null,
          montoImpuestoAdicional: null,
          impuestosAdicionales: null,
          montoTotal: montoTotal,
          montoNoFacturable: null,
          montoPeriodo: null,
          saldoAnterior: null,
          montoAvancePago: null,
          valorPagar: null,
          totalITBISRetenido: null,
          totalISRRetencion: null,
          totalITBISPercepcion: null,
          totalISRPercepcion: null,
        },
        otraMoneda: null,
      },
      detallesItems: detallesItems,
      observaciones: [
        {
          valor: 'FACTURA ELECTRONICA',
          campo: 'Factura generada electrónicamente',
        },
      ],
      cuotas: null,
      subtotales: null,
      descuentosORecargos: null,
      informacionReferencia: null,
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
  obtenerTokenTheFactory, // Exportar también la función de autenticación para posibles usos externos
};
