/**
 * Script para verificar el estado del servidor de TheFactoryHKA
 * 
 * Este script verifica:
 * - Si el servidor está accesible (DNS y conectividad)
 * - Si el endpoint de autenticación responde
 * - Tiempo de respuesta
 * - Errores específicos de conexión
 */

// Cargar variables de entorno antes de importar constantes
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env y .env.local (igual que en api/index.js)
dotenv.config(); // Carga .env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') }); // Carga .env.local

const axios = require('axios');
const {
  THEFACTORY_AUTH_URL,
  THEFACTORY_BASE_URL,
  THEFACTORY_USUARIO,
  THEFACTORY_CLAVE,
  THEFACTORY_RNC,
} = require('./constants');

/**
 * Verifica el estado del servidor de TheFactoryHKA
 */
async function verificarEstadoTheFactory() {
  console.log('\n🔍 ==================== VERIFICACIÓN THEFACTORY ====================\n');
  
  const resultados = {
    timestamp: new Date().toISOString(),
    servidor: {
      url: THEFACTORY_BASE_URL,
      accesible: false,
      error: null,
      tiempoRespuesta: null,
    },
    autenticacion: {
      endpoint: THEFACTORY_AUTH_URL,
      funcionando: false,
      error: null,
      tiempoRespuesta: null,
      detalles: null,
    },
    diagnostico: [],
  };

  // 1. Verificar conectividad básica (ping al dominio)
  console.log('1️⃣ Verificando conectividad básica...');
  try {
    const inicio = Date.now();
    const response = await axios.get(THEFACTORY_BASE_URL, {
      timeout: 10000,
      validateStatus: () => true, // Aceptar cualquier código de estado
    });
    const tiempo = Date.now() - inicio;
    
    resultados.servidor.accesible = true;
    resultados.servidor.tiempoRespuesta = tiempo;
    resultados.diagnostico.push(`✅ Servidor accesible (HTTP ${response.status}) - ${tiempo}ms`);
    console.log(`   ✅ Servidor accesible - HTTP ${response.status} - ${tiempo}ms`);
  } catch (error) {
    resultados.servidor.accesible = false;
    resultados.servidor.error = error.message;
    resultados.servidor.errorCode = error.code;
    
    let mensaje = '';
    switch (error.code) {
      case 'ECONNREFUSED':
        mensaje = '❌ SERVIDOR CAÍDO: El servidor rechazó la conexión (puerto cerrado o servicio no disponible)';
        resultados.diagnostico.push(mensaje);
        break;
      case 'ENOTFOUND':
        mensaje = '❌ DNS NO RESUELVE: No se puede resolver el dominio (DNS caído o dominio incorrecto)';
        resultados.diagnostico.push(mensaje);
        break;
      case 'ETIMEDOUT':
        mensaje = '⏰ TIMEOUT: El servidor no responde a tiempo (servidor sobrecargado o caído)';
        resultados.diagnostico.push(mensaje);
        break;
      case 'ECONNABORTED':
        mensaje = '⏰ TIMEOUT: La conexión fue abortada por timeout';
        resultados.diagnostico.push(mensaje);
        break;
      case 'ECONNRESET':
        mensaje = '❌ CONEXIÓN RESETEADA: El servidor cerró la conexión abruptamente';
        resultados.diagnostico.push(mensaje);
        break;
      default:
        mensaje = `❌ Error de conexión: ${error.code || error.message}`;
        resultados.diagnostico.push(mensaje);
    }
    
    console.log(`   ${mensaje}`);
    console.log(`   Código de error: ${error.code || 'N/A'}`);
  }

  // 2. Verificar endpoint de autenticación
  console.log('\n2️⃣ Verificando endpoint de autenticación...');
  if (!resultados.servidor.accesible && resultados.servidor.errorCode === 'ECONNREFUSED') {
    resultados.autenticacion.error = 'No se puede verificar: servidor no accesible';
    resultados.diagnostico.push('⚠️ No se puede verificar autenticación: servidor no accesible');
    console.log('   ⚠️ Saltando verificación de autenticación (servidor no accesible)');
  } else {
    try {
      // Verificar que las credenciales estén definidas
      if (!THEFACTORY_USUARIO || !THEFACTORY_CLAVE || !THEFACTORY_RNC) {
        const credencialesFaltantes = [];
        if (!THEFACTORY_USUARIO) credencialesFaltantes.push('THEFACTORY_USUARIO');
        if (!THEFACTORY_CLAVE) credencialesFaltantes.push('THEFACTORY_CLAVE');
        if (!THEFACTORY_RNC) credencialesFaltantes.push('THEFACTORY_RNC');
        
        resultados.autenticacion.error = `Variables de entorno faltantes: ${credencialesFaltantes.join(', ')}`;
        resultados.diagnostico.push(`❌ ERROR: Variables de entorno no definidas: ${credencialesFaltantes.join(', ')}`);
        console.log(`   ❌ ERROR: Variables de entorno no definidas:`);
        credencialesFaltantes.forEach(cred => console.log(`      - ${cred}`));
        console.log(`   💡 Asegúrate de tener un archivo .env o .env.local con estas variables`);
        return resultados;
      }
      
      // Nota: La API de TheFactoryHKA requiere los campos con mayúsculas iniciales
      const authRequest = {
        Usuario: THEFACTORY_USUARIO,
        Clave: THEFACTORY_CLAVE,
        RNC: THEFACTORY_RNC,
      };
      
      console.log(`   🔐 Intentando autenticación con Usuario: ${THEFACTORY_USUARIO?.substring(0, 3)}***`);
      console.log(`   📤 Payload enviado:`, JSON.stringify({
        Usuario: THEFACTORY_USUARIO ? `${THEFACTORY_USUARIO.substring(0, 3)}***` : 'undefined',
        Clave: THEFACTORY_CLAVE ? '***' : 'undefined',
        RNC: THEFACTORY_RNC || 'undefined'
      }, null, 2));

      const inicio = Date.now();
      const response = await axios.post(THEFACTORY_AUTH_URL, authRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      const tiempo = Date.now() - inicio;

      resultados.autenticacion.funcionando = true;
      resultados.autenticacion.tiempoRespuesta = tiempo;
      
      if (response.data.codigo === 0) {
        resultados.autenticacion.detalles = 'Autenticación exitosa';
        resultados.diagnostico.push(`✅ Autenticación funcionando - ${tiempo}ms`);
        console.log(`   ✅ Autenticación funcionando - ${tiempo}ms`);
      } else {
        resultados.autenticacion.detalles = `Error de autenticación: ${response.data.mensaje}`;
        resultados.diagnostico.push(`⚠️ Autenticación responde pero con error: ${response.data.mensaje}`);
        console.log(`   ⚠️ Autenticación responde pero con error: ${response.data.mensaje}`);
      }
    } catch (error) {
      resultados.autenticacion.error = error.message;
      resultados.autenticacion.errorCode = error.code || (error.response ? String(error.response.status) : null);
      
      let mensaje = '';
      if (error.response) {
        const statusCode = error.response.status;
        resultados.autenticacion.errorCode = String(statusCode); // Guardar código HTTP como string
        
        // Detectar errores específicos del servidor
        if (statusCode === 502) {
          mensaje = '❌ SERVIDOR CON PROBLEMAS: HTTP 502 Bad Gateway - El servidor de TheFactoryHKA tiene problemas internos o está sobrecargado';
          resultados.estado = 'SERVIDOR_PROBLEMAS';
          resultados.diagnostico.push(mensaje);
          console.log(`   ${mensaje}`);
          console.log(`   💡 Esto generalmente indica:`);
          console.log(`      - El servidor backend de TheFactoryHKA está caído o no responde`);
          console.log(`      - Hay un problema con el gateway/proxy del servidor`);
          console.log(`      - El servidor está sobrecargado temporalmente`);
        } else if (statusCode === 503) {
          mensaje = '❌ SERVICIO NO DISPONIBLE: HTTP 503 Service Unavailable - El servicio está en mantenimiento o sobrecargado';
          resultados.estado = 'SERVIDOR_PROBLEMAS';
          resultados.diagnostico.push(mensaje);
          console.log(`   ${mensaje}`);
        } else if (statusCode === 504) {
          mensaje = '⏰ TIMEOUT DEL SERVIDOR: HTTP 504 Gateway Timeout - El servidor tardó demasiado en responder';
          resultados.estado = 'SERVIDOR_PROBLEMAS';
          resultados.diagnostico.push(mensaje);
          console.log(`   ${mensaje}`);
        } else if (statusCode === 500) {
          mensaje = '❌ ERROR INTERNO DEL SERVIDOR: HTTP 500 - Error interno en TheFactoryHKA';
          resultados.estado = 'SERVIDOR_PROBLEMAS';
          resultados.diagnostico.push(mensaje);
          console.log(`   ${mensaje}`);
        } else if (statusCode === 401 || statusCode === 403) {
          mensaje = `⚠️ Autenticación fallida: HTTP ${statusCode} - Verifica las credenciales`;
          resultados.diagnostico.push(mensaje);
          console.log(`   ${mensaje}`);
        } else {
          mensaje = `⚠️ Autenticación responde pero con error HTTP ${statusCode}`;
          resultados.diagnostico.push(mensaje);
          console.log(`   ${mensaje}`);
        }
        
        console.log(`   Respuesta:`, JSON.stringify(error.response.data, null, 2));
      } else {
        switch (error.code) {
          case 'ECONNREFUSED':
            mensaje = '❌ SERVIDOR CAÍDO: No se puede conectar al endpoint de autenticación';
            break;
          case 'ETIMEDOUT':
          case 'ECONNABORTED':
            mensaje = '⏰ TIMEOUT: El endpoint de autenticación no responde';
            break;
          default:
            mensaje = `❌ Error: ${error.code || error.message}`;
        }
        resultados.diagnostico.push(mensaje);
        console.log(`   ${mensaje}`);
        console.log(`   Código de error: ${error.code || 'N/A'}`);
      }
    }
  }

  // 3. Resumen y recomendaciones
  console.log('\n📊 ==================== RESUMEN ====================');
  console.log(`Timestamp: ${resultados.timestamp}`);
  console.log(`Servidor accesible: ${resultados.servidor.accesible ? '✅ SÍ' : '❌ NO'}`);
  console.log(`Autenticación funcionando: ${resultados.autenticacion.funcionando ? '✅ SÍ' : '❌ NO'}`);
  
  console.log('\n🔍 Diagnóstico:');
  resultados.diagnostico.forEach((msg, i) => {
    console.log(`   ${i + 1}. ${msg}`);
  });

  // Determinar estado general (si no se estableció antes por un error específico)
  if (!resultados.estado) {
    if (!resultados.servidor.accesible) {
      resultados.estado = 'SERVIDOR_CAIDO';
      resultados.recomendacion = 'El servidor de TheFactoryHKA parece estar caído o inaccesible. Contacta con soporte de TheFactoryHKA.';
    } else if (!resultados.autenticacion.funcionando) {
      // Verificar si es un problema del servidor (502, 503, 504, 500) o de credenciales
      if (resultados.autenticacion.errorCode === '502' || 
          resultados.autenticacion.errorCode === '503' || 
          resultados.autenticacion.errorCode === '504' ||
          resultados.autenticacion.errorCode === '500') {
        resultados.estado = 'SERVIDOR_PROBLEMAS';
        resultados.recomendacion = 'El servidor de TheFactoryHKA está experimentando problemas (502/503/504/500). Esto es un problema del lado del servidor, no de tus credenciales. Espera unos minutos e intenta nuevamente, o contacta con soporte de TheFactoryHKA.';
      } else {
        resultados.estado = 'AUTENTICACION_FALLIDA';
        resultados.recomendacion = 'El servidor responde pero la autenticación falla. Verifica las credenciales en las variables de entorno (THEFACTORY_USUARIO, THEFACTORY_CLAVE, THEFACTORY_RNC).';
      }
    } else {
      resultados.estado = 'FUNCIONANDO';
      resultados.recomendacion = 'El servidor de TheFactoryHKA está funcionando correctamente.';
    }
  }
  
  // Asegurar que la recomendación esté actualizada según el estado
  if (resultados.estado === 'SERVIDOR_PROBLEMAS' && !resultados.recomendacion.includes('502')) {
    resultados.recomendacion = 'El servidor de TheFactoryHKA está experimentando problemas. Esto es un problema del lado del servidor, no de tu aplicación. Espera unos minutos e intenta nuevamente, o contacta con soporte de TheFactoryHKA.';
  }

  console.log(`\n📌 Estado: ${resultados.estado}`);
  console.log(`💡 Recomendación: ${resultados.recomendacion}`);
  console.log('\n====================================================\n');

  return resultados;
}

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
  verificarEstadoTheFactory()
    .then((resultados) => {
      process.exit(resultados.estado === 'FUNCIONANDO' ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Error al ejecutar verificación:', error);
      process.exit(1);
    });
}

module.exports = { verificarEstadoTheFactory };
