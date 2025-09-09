/**
 * Ejemplo de uso de la integración de email con The Factory HKA
 * Este archivo muestra diferentes formas de usar la funcionalidad
 */

const { enviarEmailTheFactory } = require('../api/thefactory-email');

// Ejemplo 1: Uso básico - enviar email de un documento
async function ejemploBasico() {
  console.log('📧 Ejemplo 1: Envío básico de email');

  try {
    const resultado = await enviarEmailTheFactory({
      documento: 'E310000000051', // NCF del documento
      correos: ['cliente@email.com'], // Email del cliente
    });

    if (resultado.success) {
      console.log('✅ Email enviado:', resultado.message);
      console.log('📊 Status:', resultado.status); // 'queued' o 'processed'
    } else {
      console.error('❌ Error:', resultado.message);
    }
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
  }
}

// Ejemplo 2: Múltiples destinatarios
async function ejemploMultiplesDestinatarios() {
  console.log('📧 Ejemplo 2: Múltiples destinatarios');

  try {
    const resultado = await enviarEmailTheFactory({
      documento: 'E340000000049',
      correos: [
        'cliente@empresa.com',
        'contador@empresa.com',
        'gerencia@empresa.com',
      ],
      rnc: '130960054', // RNC específico (opcional)
    });

    console.log('📨 Resultado:', resultado.message);
    console.log(
      '👥 Enviado a:',
      resultado.data.correos.length,
      'destinatarios',
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejemplo 3: Integración con flujo de facturación completo
async function ejemploFlujoCompleto(datosFactura) {
  console.log('🔄 Ejemplo 3: Flujo completo facturación + email');

  try {
    // Paso 1: Enviar factura electrónica (usando tu función existente)
    console.log('📄 Enviando factura electrónica...');
    // const facturaResult = await enviarFacturaElectronica(datosFactura);

    // Simular resultado exitoso
    const facturaResult = {
      success: true,
      data: { ncfGenerado: datosFactura.factura.ncf },
    };

    if (!facturaResult.success) {
      throw new Error('Error al enviar factura electrónica');
    }

    console.log('✅ Factura enviada exitosamente');

    // Paso 2: Esperar un momento para que se procese
    console.log('⏳ Esperando procesamiento...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Paso 3: Enviar email automáticamente
    if (datosFactura.comprador?.correo) {
      console.log('📧 Enviando email del documento...');

      const emailResult = await enviarEmailTheFactory({
        documento: datosFactura.factura.ncf,
        correos: [datosFactura.comprador.correo],
      });

      if (emailResult.success) {
        console.log('📨 Email enviado:', emailResult.message);
      } else {
        console.warn('⚠️ Email no enviado:', emailResult.message);
      }

      return {
        factura: facturaResult,
        email: emailResult,
      };
    } else {
      console.log('📭 No se especificó email del comprador');
      return {
        factura: facturaResult,
        email: { message: 'Email no solicitado' },
      };
    }
  } catch (error) {
    console.error('💥 Error en flujo completo:', error.message);
    throw error;
  }
}

// Ejemplo 4: Manejo de errores y reintentos
async function ejemploManejoErrores() {
  console.log('🔧 Ejemplo 4: Manejo de errores');

  const maxReintentos = 3;
  let intento = 0;

  while (intento < maxReintentos) {
    try {
      intento++;
      console.log(`🔄 Intento ${intento}/${maxReintentos}`);

      const resultado = await enviarEmailTheFactory({
        documento: 'E310000000051',
        correos: ['test@example.com'],
      });

      if (resultado.success) {
        console.log('✅ Email enviado exitosamente');
        return resultado;
      } else {
        console.warn(`⚠️ Intento ${intento} falló:`, resultado.message);

        // Si es un error de documento no encontrado, no reintentar
        if (resultado.error?.codigo === 404) {
          console.log('❌ Documento no existe, cancelando reintentos');
          break;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Intento ${intento} falló:`, error.message);

      // Si es error de autenticación, no reintentar inmediatamente
      if (error.message.includes('autenticación')) {
        console.log('🔐 Error de autenticación, esperando más tiempo...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Esperar antes del siguiente intento
    if (intento < maxReintentos) {
      const espera = intento * 1000; // 1s, 2s, 3s
      console.log(`⏳ Esperando ${espera}ms antes del siguiente intento...`);
      await new Promise((resolve) => setTimeout(resolve, espera));
    }
  }

  console.log('❌ Máximo de reintentos alcanzado');
  throw new Error('No se pudo enviar el email después de múltiples intentos');
}

// Ejemplo 5: Validación previa de datos
async function ejemploValidacion() {
  console.log('🔍 Ejemplo 5: Validación de datos');

  const datos = {
    documento: 'E310000000051',
    correos: ['cliente@test.com', 'invalido-email', 'otro@test.com'],
  };

  // Validar emails antes de enviar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailsValidos = datos.correos.filter((email) => emailRegex.test(email));
  const emailsInvalidos = datos.correos.filter(
    (email) => !emailRegex.test(email),
  );

  if (emailsInvalidos.length > 0) {
    console.warn('⚠️ Emails inválidos encontrados:', emailsInvalidos);
    console.log('✅ Enviando solo a emails válidos:', emailsValidos);
    datos.correos = emailsValidos;
  }

  if (datos.correos.length === 0) {
    console.error('❌ No hay emails válidos para enviar');
    return;
  }

  try {
    const resultado = await enviarEmailTheFactory(datos);
    console.log('📨 Resultado:', resultado.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Datos de ejemplo para pruebas
const datosFacturaEjemplo = {
  comprador: {
    correo: 'cliente@test.com',
    nombre: 'Dr. Alexis Santana',
    rnc: '00105501704',
  },
  emisor: {
    correo: 'informacion@contrerasrobledo.com.do',
    rnc: '130085765',
  },
  factura: {
    fecha: '03-02-2025',
    id: '379176',
    ncf: 'E340000000049',
    tipo: '34',
    total: '1000.00',
  },
};

// Función para ejecutar todos los ejemplos
async function ejecutarTodosLosEjemplos() {
  console.log('🚀 === EJEMPLOS DE USO - THE FACTORY HKA EMAIL ===\n');

  try {
    await ejemploBasico();
    console.log('\n' + '='.repeat(50) + '\n');

    await ejemploMultiplesDestinatarios();
    console.log('\n' + '='.repeat(50) + '\n');

    await ejemploFlujoCompleto(datosFacturaEjemplo);
    console.log('\n' + '='.repeat(50) + '\n');

    await ejemploValidacion();
    console.log('\n' + '='.repeat(50) + '\n');

    // Comentado para evitar errores en ejemplo
    // await ejemploManejoErrores();

    console.log('🎉 Todos los ejemplos completados');
  } catch (error) {
    console.error('💥 Error en ejemplos:', error.message);
  }
}

// Exportar funciones para uso en otros archivos
module.exports = {
  ejemploBasico,
  ejemploMultiplesDestinatarios,
  ejemploFlujoCompleto,
  ejemploManejoErrores,
  ejemploValidacion,
  ejecutarTodosLosEjemplos,
};

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  ejecutarTodosLosEjemplos().catch((error) => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });
}
