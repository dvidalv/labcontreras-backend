const httpStatus = require('http-status');
const { Comprobante } = require('../models/comprobante');

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

    // Calcular el próximo número a usar
    const proximoNumero = rango.numero_inicial + rango.numeros_utilizados - 1;

    return res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Número consumido exitosamente',
      data: {
        numeroConsumido: proximoNumero,
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

module.exports = {
  createComprobante,
  getAllComprobantes,
  getComprobanteById,
  updateComprobante,
  updateComprobanteEstado,
  deleteComprobante,
  getComprobantesStats,
  consumirNumero,
};
