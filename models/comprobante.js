const mongoose = require('mongoose');

const { Schema } = mongoose;

// Schema de mongoose para rangos de numeración de e-CF
const comprobanteSchema = new Schema({
  rnc: {
    type: String,
    required: [true, 'El RNC es requerido'],
    minlength: [9, 'El RNC debe tener al menos 9 caracteres'],
    maxlength: [11, 'El RNC debe tener máximo 11 caracteres'],
    validate: {
      validator: function (v) {
        return /^\d{9,11}$/.test(v);
      },
      message: 'El RNC debe contener solo números de 9 a 11 dígitos',
    },
  },
  razon_social: {
    type: String,
    required: [true, 'La razón social es requerida'],
    trim: true,
    minlength: [2, 'La razón social debe tener al menos 2 caracteres'],
    maxlength: [200, 'La razón social no puede exceder 200 caracteres'],
  },
  tipo_comprobante: {
    type: String,
    required: [true, 'El tipo de comprobante es requerido'],
    enum: {
      values: ['31', '32', '33', '34', '41', '43', '44', '45'],
      message:
        'Tipo de comprobante inválido. Debe ser: 31, 32, 33, 34, 41, 43, 44, 45',
    },
    /* Tipos de e-CF:
     * 31: Factura de Crédito Fiscal Electrónica
     * 32: Factura de Consumo Electrónica
     * 33: Nota de Débito Electrónica
     * 34: Nota de Crédito Electrónica
     * 41: Compras Electrónicas
     * 43: Gastos Menores Electrónico
     * 44: Régimenes Especiales Electrónico
     * 45: Gubernamental Electrónico
     */
  },
  descripcion_tipo: {
    type: String,
    default: '',
    maxlength: [100, 'La descripción no puede exceder 100 caracteres'],
  },
  prefijo: {
    type: String,
    default: 'E',
    validate: {
      validator: function (v) {
        return /^[A-Z]$/.test(v);
      },
      message: 'El prefijo debe ser una letra mayúscula',
    },
  },
  numero_inicial: {
    type: Number,
    required: [true, 'El número inicial es requerido'],
    min: [0, 'El número inicial no puede ser negativo'],
    validate: {
      validator: Number.isInteger,
      message: 'El número inicial debe ser un entero',
    },
  },
  numero_final: {
    type: Number,
    required: [true, 'El número final es requerido'],
    min: [0, 'El número final no puede ser negativo'],
    validate: [
      {
        validator: Number.isInteger,
        message: 'El número final debe ser un entero',
      },
      {
        validator: function (v) {
          return v > this.numero_inicial;
        },
        message: 'El número final debe ser mayor que el número inicial',
      },
    ],
  },
  cantidad_numeros: {
    type: Number,
    default: function () {
      return this.numero_final - this.numero_inicial + 1;
    },
    min: [1, 'La cantidad de números debe ser mayor a 0'],
  },
  numeros_utilizados: {
    type: Number,
    default: 0,
    min: [0, 'Los números utilizados no pueden ser negativos'],
    validate: {
      validator: function (v) {
        return v <= this.cantidad_numeros;
      },
      message: 'Los números utilizados no pueden exceder la cantidad total',
    },
  },
  numeros_disponibles: {
    type: Number,
    default: function () {
      return this.cantidad_numeros - this.numeros_utilizados;
    },
    min: [0, 'Los números disponibles no pueden ser negativos'],
  },
  fecha_autorizacion: {
    type: Date,
    required: [true, 'La fecha de autorización es requerida'],
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'La fecha de autorización debe ser una fecha válida',
    },
  },
  fecha_vencimiento: {
    type: Date,
    required: [true, 'La fecha de vencimiento es requerida'],
    validate: [
      {
        validator: function (v) {
          return v instanceof Date && !isNaN(v);
        },
        message: 'La fecha de vencimiento debe ser una fecha válida',
      },
      {
        validator: function (v) {
          return v > this.fecha_autorizacion;
        },
        message:
          'La fecha de vencimiento debe ser posterior a la fecha de autorización',
      },
    ],
  },
  alerta_minima_restante: {
    type: Number,
    required: [true, 'La alerta mínima restante es requerida'],
    min: [1, 'La alerta mínima debe ser mayor a 0'],
    validate: {
      validator: Number.isInteger,
      message: 'La alerta mínima debe ser un entero',
    },
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'inactivo', 'vencido', 'agotado'],
      message: 'El estado debe ser: activo, inactivo, vencido o agotado',
    },
    default: 'activo',
  },
  comentario: {
    type: String,
    default: '',
    maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: [true, 'El usuario es requerido'],
  },

  // Campos de auditoría
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
});

// Índices compuestos - permitir múltiples rangos para diferentes tipos
comprobanteSchema.index(
  {
    rnc: 1,
    tipo_comprobante: 1,
    usuario: 1,
  },
  {
    unique: false,
    name: 'rango_por_tipo',
  },
);

// Middleware pre-save para validaciones y cálculos
comprobanteSchema.pre('save', async function (next) {
  try {
    // Actualizar fecha de modificación
    this.fechaActualizacion = Date.now();

    // Calcular cantidad de números
    this.cantidad_numeros = this.numero_final - this.numero_inicial + 1;

    // Calcular números disponibles
    this.numeros_disponibles = this.cantidad_numeros - this.numeros_utilizados;

    // Auto-actualizar estado basado en fechas y números disponibles
    // SOLO si el estado no es 'inactivo' (estado manual que debe respetarse)
    if (this.estado !== 'inactivo') {
      const hoy = new Date();
      if (this.fecha_vencimiento < hoy) {
        this.estado = 'vencido';
      } else if (this.numeros_disponibles <= this.alerta_minima_restante) {
        this.estado = 'agotado';
      } else if (
        this.estado !== 'activo' &&
        this.numeros_disponibles > this.alerta_minima_restante &&
        this.fecha_vencimiento >= hoy
      ) {
        this.estado = 'activo';
      }
    }

    // Validar que no haya rangos superpuestos para el mismo RNC y tipo_comprobante
    const query = {
      rnc: this.rnc,
      tipo_comprobante: this.tipo_comprobante,
      usuario: this.usuario,
    };

    // Si estamos actualizando (no creando), excluir el documento actual
    if (!this.isNew) {
      query._id = { $ne: this._id };
    }

    const rangosExistentes = await this.constructor.find(query);

    // Verificar superposición de rangos
    for (const rango of rangosExistentes) {
      // Verificar si los rangos se superponen
      const superposicion = !(
        this.numero_final < rango.numero_inicial ||
        this.numero_inicial > rango.numero_final
      );

      if (superposicion) {
        throw new Error(
          `Ya existe un rango con números superpuestos para este RNC y tipo de comprobante. ` +
            `Rango existente: ${rango.numero_inicial}-${rango.numero_final}, ` +
            `Rango nuevo: ${this.numero_inicial}-${this.numero_final}`,
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware pre-update para actualizaciones
comprobanteSchema.pre(
  ['findOneAndUpdate', 'updateOne', 'updateMany'],
  function (next) {
    this.set({ fechaActualizacion: Date.now() });
    next();
  },
);

// Métodos del esquema
comprobanteSchema.methods.consumirNumero = function () {
  if (this.numeros_disponibles > 0) {
    this.numeros_utilizados += 1;
    this.numeros_disponibles = this.cantidad_numeros - this.numeros_utilizados;

    // Verificar si se debe cambiar el estado
    if (this.numeros_disponibles <= this.alerta_minima_restante) {
      this.estado = 'agotado';
    }

    return this.save();
  } else {
    throw new Error('No hay números disponibles en este rango');
  }
};

comprobanteSchema.methods.esValido = function () {
  const hoy = new Date();
  return (
    this.estado === 'activo' &&
    this.fecha_vencimiento >= hoy &&
    this.numeros_disponibles > 0
  );
};

// Método estático para obtener rangos disponibles por tipo
comprobanteSchema.statics.obtenerRangosDisponibles = function (
  usuario,
  tipo_comprobante,
) {
  return this.find({
    usuario,
    tipo_comprobante,
    estado: 'activo',
    fecha_vencimiento: { $gte: new Date() },
    $expr: { $gt: ['$numeros_disponibles', 0] },
  }).sort({ fecha_vencimiento: 1 });
};

// Virtual para obtener el próximo número disponible
comprobanteSchema.virtual('proximoNumero').get(function () {
  if (this.numeros_disponibles > 0) {
    return this.numero_inicial + this.numeros_utilizados;
  }
  return null;
});

// Virtual para obtener el próximo número formateado según estructura e-CF
comprobanteSchema.virtual('proximoNumeroFormateado').get(function () {
  if (this.numeros_disponibles > 0) {
    const secuencial = this.numero_inicial + this.numeros_utilizados;
    return this.formatearNumeroECF(secuencial);
  }
  return null;
});

// Método para formatear cualquier número secuencial al formato e-CF
comprobanteSchema.methods.formatearNumeroECF = function (numeroSecuencial) {
  // Formatear secuencial a 10 dígitos con ceros a la izquierda
  const secuencialFormateado = numeroSecuencial.toString().padStart(10, '0');

  // Estructura: [Serie][TipoComprobante][Secuencial]
  return `${this.prefijo}${this.tipo_comprobante}${secuencialFormateado}`;
};

// Método estático para formatear número e-CF desde componentes
comprobanteSchema.statics.formatearECF = function (
  prefijo,
  tipoComprobante,
  numeroSecuencial,
) {
  const secuencialFormateado = numeroSecuencial.toString().padStart(10, '0');
  return `${prefijo}${tipoComprobante}${secuencialFormateado}`;
};

// Asegurar que los virtuals se incluyan en JSON
// Asegurar que los virtuals se incluyan en JSON
comprobanteSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.id; // Eliminar el virtual id automático
    delete ret.__v; // Eliminar version key (opcional)
    return ret;
  },
});

module.exports = {
  Comprobante: mongoose.model('Comprobante', comprobanteSchema, 'comprobantes'),
};
