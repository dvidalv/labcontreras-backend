const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Script de prueba para el endpoint de descarga de archivos
 * Descarga archivos XML o PDF de documentos electrónicos desde TheFactoryHKA
 */

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_JWT_TOKEN_HERE';

// Datos de prueba
const testData = {
  rnc: '130960088',
  documento: 'E310000000033', // Número del e-NCF a descargar
  extension: 'xml', // Puede ser 'xml' o 'pdf'
};

/**
 * Función principal de prueba
 */
async function testDescargarArchivo() {
  console.log('🧪 Iniciando prueba de descarga de archivo...\n');

  try {
    console.log('📋 Datos de prueba:');
    console.log(`   RNC: ${testData.rnc}`);
    console.log(`   Documento: ${testData.documento}`);
    console.log(`   Extensión: ${testData.extension}\n`);

    // Realizar solicitud
    console.log(
      `📤 Enviando solicitud a: ${BASE_URL}/comprobantes/descargar-archivo`,
    );

    const response = await axios.post(
      `${BASE_URL}/comprobantes/descargar-archivo`,
      testData,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 35000, // 35 segundos
      },
    );

    console.log('\n✅ Respuesta exitosa recibida\n');
    console.log('📊 Detalles de la respuesta:');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Mensaje: ${response.data.message}`);
    console.log(`   Código: ${response.data.data.codigo}`);
    console.log(`   Procesado: ${response.data.data.procesado}`);
    console.log(`   Extensión: ${response.data.data.extension}`);

    // Guardar el archivo
    if (response.data.data.archivo) {
      const archivoBase64 = response.data.data.archivo;
      const nombreArchivo = `${testData.documento}.${testData.extension}`;
      const rutaArchivo = path.join(__dirname, nombreArchivo);

      // Decodificar Base64 y guardar
      const buffer = Buffer.from(archivoBase64, 'base64');
      fs.writeFileSync(rutaArchivo, buffer);

      console.log(`\n💾 Archivo guardado exitosamente:`);
      console.log(`   Ruta: ${rutaArchivo}`);
      console.log(`   Tamaño: ${(buffer.length / 1024).toFixed(2)} KB`);

      // Si es XML, mostrar primeros caracteres
      if (testData.extension === 'xml') {
        const contenidoXML = buffer.toString('utf-8');
        console.log(`\n📄 Primeros 200 caracteres del XML:`);
        console.log(`   ${contenidoXML.substring(0, 200)}...`);
      }
    }

    console.log('\n✅ Prueba completada exitosamente\n');
    return response.data;
  } catch (error) {
    console.error('\n❌ Error en la prueba:\n');

    if (error.response) {
      // Error de respuesta del servidor
      console.error('📛 Error del servidor:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensaje: ${error.response.data.message}`);
      if (error.response.data.details) {
        console.error(`   Detalles:`, error.response.data.details);
      }
    } else if (error.request) {
      // Error de solicitud (sin respuesta)
      console.error('📛 No se recibió respuesta del servidor');
      console.error(`   URL: ${BASE_URL}/comprobantes/descargar-archivo`);
      console.error(
        `   Verifica que el servidor esté ejecutándose en ${BASE_URL}`,
      );
    } else {
      // Error general
      console.error('📛 Error:', error.message);
    }

    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que el servidor esté ejecutándose');
    console.error('   2. Verifica que el token de autenticación sea válido');
    console.error(
      '   3. Verifica que el RNC y número de documento sean correctos',
    );
    console.error('   4. Verifica que el documento exista en TheFactoryHKA\n');

    throw error;
  }
}

/**
 * Prueba de descarga de PDF
 */
async function testDescargarPDF() {
  console.log('🧪 Iniciando prueba de descarga de PDF...\n');

  const pdfData = {
    ...testData,
    extension: 'pdf',
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/comprobantes/descargar-archivo`,
      pdfData,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 35000,
      },
    );

    // Guardar el PDF
    if (response.data.data.archivo) {
      const archivoBase64 = response.data.data.archivo;
      const nombreArchivo = `${pdfData.documento}.pdf`;
      const rutaArchivo = path.join(__dirname, nombreArchivo);

      const buffer = Buffer.from(archivoBase64, 'base64');
      fs.writeFileSync(rutaArchivo, buffer);

      console.log(`✅ PDF guardado exitosamente: ${rutaArchivo}\n`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error.message);
    throw error;
  }
}

/**
 * Prueba de validación de parámetros
 */
async function testValidacion() {
  console.log('🧪 Iniciando prueba de validación de parámetros...\n');

  const casosInvalidos = [
    { rnc: '', documento: 'E310000000033', extension: 'xml' },
    { rnc: '130960088', documento: '', extension: 'xml' },
    { rnc: '130960088', documento: 'E310000000033', extension: '' },
    { rnc: '130960088', documento: 'E310000000033', extension: 'txt' }, // Extensión inválida
  ];

  for (const [index, datos] of casosInvalidos.entries()) {
    console.log(`   Caso ${index + 1}: ${JSON.stringify(datos)}`);
    try {
      await axios.post(`${BASE_URL}/comprobantes/descargar-archivo`, datos, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('      ❌ Debería haber fallado pero no lo hizo');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(
          `      ✅ Validación correcta: ${error.response.data.message}`,
        );
      } else {
        console.log(`      ⚠️  Error inesperado: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Pruebas de validación completadas\n');
}

// Ejecutar pruebas
if (require.main === module) {
  (async () => {
    try {
      // Verificar que se haya configurado el token
      if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
        console.error('❌ Error: Debes configurar el token de autenticación\n');
        console.error('Opciones:');
        console.error(
          '   1. Establecer la variable de entorno: export TEST_AUTH_TOKEN="tu_token"',
        );
        console.error(
          '   2. Modificar la variable AUTH_TOKEN en este archivo\n',
        );
        process.exit(1);
      }

      console.log('═══════════════════════════════════════════════════════');
      console.log('   TEST: DESCARGA DE ARCHIVOS - TheFactoryHKA');
      console.log('═══════════════════════════════════════════════════════\n');

      // Prueba 1: Descargar XML
      await testDescargarArchivo();

      console.log('───────────────────────────────────────────────────────\n');

      // Prueba 2: Descargar PDF (comentado por defecto, descomentar si es necesario)
      // await testDescargarPDF();
      // console.log('───────────────────────────────────────────────────────\n');

      // Prueba 3: Validación de parámetros
      await testValidacion();

      console.log('═══════════════════════════════════════════════════════');
      console.log('   ✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
      console.log('═══════════════════════════════════════════════════════\n');
    } catch (error) {
      console.error(
        '\n═══════════════════════════════════════════════════════',
      );
      console.error('   ❌ PRUEBAS FALLIDAS');
      console.error(
        '═══════════════════════════════════════════════════════\n',
      );
      process.exit(1);
    }
  })();
}

module.exports = {
  testDescargarArchivo,
  testDescargarPDF,
  testValidacion,
};
