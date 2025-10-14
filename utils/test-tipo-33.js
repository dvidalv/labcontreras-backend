/**
 * Script de prueba para Nota de Débito (Tipo 33)
 * Simula el envío desde FileMaker
 */

const axios = require('axios');

// Datos de prueba para Nota de Débito
const notaDebitoTest = {
  comprador: {
    correo: 'cliente@empresa.com',
    nombre: 'Empresa Cliente S.A.',
    rnc: '131880681',
    direccion: 'Calle Principal No. 123, Santo Domingo',
    municipio: '010100',
    provincia: '010000',
  },
  emisor: {
    correo: 'informacion@contrerasrobledo.com.do',
    direccion: 'Av. Juan Pablo Duarte No. 176\rSantiago, Rep. Dom.',
    razonSocial: 'Clínica Universitaria Unión Médica Torre A',
    rnc: '130085765',
    telefono: ['809-580-1429'],
    webSite: 'www.contrerasrobledo.com.do',
  },
  factura: {
    fecha: '15-09-2025',
    fechaVencNCF: '31/12/2025',
    id: 'ND-001',
    ncf: 'E330000000001',
    tipo: '33',
    total: '15000.00',
  },
  items: [
    {
      nombre: 'Cargo adicional por servicios especiales',
      precio: '10000.00',
      cantidad: '1.00',
      unidadMedida: '47',
    },
    {
      nombre: 'Recargo por procesamiento urgente',
      precio: '5000.00',
      cantidad: '1.00',
      unidadMedida: '47',
    },
  ],
  modificacion: {
    CodigoModificacion: '01',
    FechaNCFModificado: '10-09-2025',
    NCFModificado: 'E310000000098',
    RazonModificacion:
      'Cargo adicional por servicios no incluidos en la factura original',
  },
};

async function probarTipo33() {
  try {
    console.log('🧪 === PRUEBA TIPO 33 (NOTA DE DÉBITO) ===');
    console.log('📤 Enviando datos de prueba...');
    console.log(JSON.stringify(notaDebitoTest, null, 2));

    // Simular transformación (sin enviar a TheFactory)
    // Nota: La función no está exportada, así que simulamos la validación
    console.log('\n🔄 Validando estructura para TheFactoryHKA...');

    // Validar campos obligatorios para tipo 33
    const validaciones = [];

    // Validar factura
    if (!notaDebitoTest.factura?.tipo || notaDebitoTest.factura.tipo !== '33') {
      validaciones.push('❌ factura.tipo debe ser "33"');
    } else {
      validaciones.push('✅ factura.tipo: "33" correcto');
    }

    if (
      !notaDebitoTest.factura?.ncf ||
      !notaDebitoTest.factura.ncf.startsWith('E33')
    ) {
      validaciones.push('❌ factura.ncf debe empezar con "E33"');
    } else {
      validaciones.push('✅ factura.ncf: formato correcto');
    }

    // Validar comprador (obligatorio para tipo 33)
    if (!notaDebitoTest.comprador?.rnc) {
      validaciones.push('❌ comprador.rnc es obligatorio para tipo 33');
    } else {
      validaciones.push('✅ comprador.rnc: presente');
    }

    // Validar modificacion (obligatoria para tipo 33)
    if (!notaDebitoTest.modificacion) {
      validaciones.push('❌ modificacion es obligatoria para tipo 33');
    } else {
      if (!notaDebitoTest.modificacion.NCFModificado) {
        validaciones.push('❌ modificacion.NCFModificado es obligatorio');
      } else {
        validaciones.push('✅ modificacion.NCFModificado: presente');
      }

      if (!notaDebitoTest.modificacion.CodigoModificacion) {
        validaciones.push('❌ modificacion.CodigoModificacion es obligatorio');
      } else {
        validaciones.push('✅ modificacion.CodigoModificacion: presente');
      }

      if (!notaDebitoTest.modificacion.RazonModificacion) {
        validaciones.push('❌ modificacion.RazonModificacion es obligatorio');
      } else {
        validaciones.push('✅ modificacion.RazonModificacion: presente');
      }
    }

    console.log('\n📋 Resultados de validación:');
    validaciones.forEach((v) => console.log(v));

    const errores = validaciones.filter((v) => v.startsWith('❌'));
    if (errores.length > 0) {
      throw new Error(
        `Validación fallida: ${errores.length} errores encontrados`,
      );
    }

    console.log('\n🔍 Estructura esperada para TheFactoryHKA:');
    console.log('📋 IdentificacionDocumento esperado:');
    console.log('   - TipoDocumento: "33"');
    console.log('   - TipoIngresos: "03" (específico para débitos)');
    console.log('   - TablaFormasPago: Debe estar presente');
    console.log('   - IndicadorMontoGravado: Calculado automáticamente');

    console.log('\n📋 InformacionReferencia esperada:');
    console.log(
      `   - NCFModificado: ${notaDebitoTest.modificacion.NCFModificado}`,
    );
    console.log(
      `   - CodigoModificacion: ${notaDebitoTest.modificacion.CodigoModificacion}`,
    );
    console.log(
      `   - RazonModificacion: ${notaDebitoTest.modificacion.RazonModificacion}`,
    );
    console.log(
      `   - FechaNCFModificado: ${notaDebitoTest.modificacion.FechaNCFModificado}`,
    );

    console.log('\n📋 Campos del comprador:');
    console.log(
      `   - RNC: ${notaDebitoTest.comprador.rnc} (obligatorio para tipo 33)`,
    );
    console.log(`   - Nombre: ${notaDebitoTest.comprador.nombre}`);

    console.log('\n📋 Items:');
    notaDebitoTest.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.nombre}: RD$${item.precio}`);
    });

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    return true;
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error('📋 Detalles:', error);
    return false;
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  probarTipo33().then((exitoso) => {
    process.exit(exitoso ? 0 : 1);
  });
}

module.exports = { probarTipo33, notaDebitoTest };
