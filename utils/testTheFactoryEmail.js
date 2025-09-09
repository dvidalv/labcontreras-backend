/**
 * Test de funcionalidad de email de The Factory HKA
 * Ejecutar con: node utils/testTheFactoryEmail.js
 */

require('dotenv').config();
const { enviarEmailTheFactory } = require('../api/thefactory-email');

// Colores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEmailConfig() {
  log(colors.cyan, '\n🔧 === PRUEBA DE CONFIGURACIÓN ===');

  const requiredVars = [
    'THEFACTORY_USUARIO',
    'THEFACTORY_CLAVE',
    'THEFACTORY_RNC',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    log(colors.red, `❌ Variables faltantes: ${missing.join(', ')}`);
    log(
      colors.yellow,
      '💡 Asegúrate de tener estas variables en tu archivo .env',
    );
    return false;
  }

  log(colors.green, '✅ Todas las variables de entorno están configuradas');
  log(colors.blue, `📝 Usuario: ${process.env.THEFACTORY_USUARIO}`);
  log(colors.blue, `📝 RNC: ${process.env.THEFACTORY_RNC}`);
  return true;
}

async function testEmailSending() {
  log(colors.cyan, '\n📧 === PRUEBA DE ENVÍO DE EMAIL ===');

  // Datos de prueba - ACTUALIZA ESTOS VALORES
  const testData = {
    documento: 'E340000000049', // NCF del ejemplo en jsonEjemplos/json.json
    correos: [
      'info@santana.com.do', // Email del ejemplo
    ],
    // rnc se toma del .env automáticamente
  };

  log(
    colors.yellow,
    '⚠️  IMPORTANTE: Actualiza los datos de prueba en este archivo',
  );
  log(colors.blue, `📄 Documento: ${testData.documento}`);
  log(colors.blue, `📧 Correos: ${testData.correos.join(', ')}`);

  try {
    log(colors.yellow, '\n⏳ Enviando solicitud de email...');

    const resultado = await enviarEmailTheFactory(testData);

    if (resultado.success) {
      log(colors.green, `✅ Email ${resultado.status}: ${resultado.message}`);
      log(colors.blue, `📊 Datos: ${JSON.stringify(resultado.data, null, 2)}`);
    } else {
      log(colors.red, `❌ Error en email: ${resultado.message}`);
      log(
        colors.yellow,
        `📊 Detalles: ${JSON.stringify(resultado.error, null, 2)}`,
      );
    }

    return resultado.success;
  } catch (error) {
    log(colors.red, `💥 Error crítico: ${error.message}`);

    if (error.error?.details) {
      log(
        colors.yellow,
        `📊 Detalles técnicos: ${JSON.stringify(error.error.details, null, 2)}`,
      );
    }

    return false;
  }
}

async function testValidation() {
  log(colors.cyan, '\n🔍 === PRUEBA DE VALIDACIONES ===');

  const testCases = [
    {
      name: 'Sin documento',
      data: { correos: ['test@test.com'] },
      shouldFail: true,
    },
    {
      name: 'Sin correos',
      data: { documento: 'E310000000051' },
      shouldFail: true,
    },
    {
      name: 'Correos vacíos',
      data: { documento: 'E310000000051', correos: [] },
      shouldFail: true,
    },
    {
      name: 'Email inválido',
      data: { documento: 'E340000000049', correos: ['email-invalido'] },
      shouldFail: true,
    },
    {
      name: 'Muchos correos',
      data: {
        documento: 'E340000000049',
        correos: Array(11)
          .fill()
          .map((_, i) => `test${i}@test.com`),
      },
      shouldFail: false, // El servicio debe manejar esto, no fallar
    },
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    try {
      log(colors.yellow, `\n🧪 Probando: ${testCase.name}`);

      const resultado = await enviarEmailTheFactory(testCase.data);

      if (testCase.shouldFail && resultado.success) {
        log(colors.red, `❌ Esperaba fallo pero tuvo éxito`);
      } else if (!testCase.shouldFail && !resultado.success) {
        log(colors.red, `❌ Esperaba éxito pero falló: ${resultado.message}`);
      } else {
        log(colors.green, `✅ Comportamiento esperado`);
        passed++;
      }
    } catch (error) {
      if (testCase.shouldFail) {
        log(colors.green, `✅ Falló como se esperaba: ${error.message}`);
        passed++;
      } else {
        log(colors.red, `❌ Falló inesperadamente: ${error.message}`);
      }
    }
  }

  log(colors.bright, `\n📊 Validaciones: ${passed}/${total} pasaron`);
  return passed === total;
}

async function runAllTests() {
  log(colors.bright, '🚀 === INICIANDO PRUEBAS DE THE FACTORY HKA EMAIL ===');

  const results = {
    config: false,
    validation: false,
    email: false,
  };

  try {
    // 1. Prueba de configuración
    results.config = await testEmailConfig();

    if (!results.config) {
      log(colors.red, '\n💥 No se puede continuar sin configuración válida');
      return;
    }

    // 2. Prueba de validaciones
    results.validation = await testValidation();

    // 3. Prueba de envío real (solo si configuración es correcta)
    log(
      colors.yellow,
      '\n⚠️  La siguiente prueba hará una llamada real a The Factory HKA',
    );
    log(
      colors.yellow,
      '⚠️  Asegúrate de actualizar los datos de prueba antes de continuar',
    );

    // Pausa para que el usuario pueda cancelar si quiere
    await new Promise((resolve) => setTimeout(resolve, 3000));

    results.email = await testEmailSending();
  } catch (error) {
    log(colors.red, `💥 Error crítico en las pruebas: ${error.message}`);
  }

  // Resumen final
  log(colors.bright, '\n📋 === RESUMEN DE PRUEBAS ===');
  log(
    results.config ? colors.green : colors.red,
    `Configuración: ${results.config ? '✅ PASS' : '❌ FAIL'}`,
  );
  log(
    results.validation ? colors.green : colors.red,
    `Validaciones: ${results.validation ? '✅ PASS' : '❌ FAIL'}`,
  );
  log(
    results.email ? colors.green : colors.red,
    `Envío de Email: ${results.email ? '✅ PASS' : '❌ FAIL'}`,
  );

  const allPassed = Object.values(results).every((result) => result);
  log(
    allPassed ? colors.green : colors.yellow,
    `\n🏁 Resultado final: ${allPassed ? 'TODAS LAS PRUEBAS PASARON' : 'ALGUNAS PRUEBAS FALLARON'}`,
  );

  if (!allPassed) {
    log(
      colors.yellow,
      '\n💡 Revisa los errores anteriores y la documentación en docs/THEFACTORY_EMAIL_API.md',
    );
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  runAllTests().catch((error) => {
    log(colors.red, `💥 Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testEmailConfig,
  testEmailSending,
  testValidation,
  runAllTests,
};
