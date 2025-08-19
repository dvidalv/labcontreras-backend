#!/usr/bin/env node

/**
 * Script de migración de SendGrid a Brevo
 *
 * Este script ayuda a completar la migración del sistema de emails
 * de SendGrid a Brevo de manera segura y documentada.
 *
 * Uso: node scripts/migrarABrevo.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verificarConfiguracion() {
  log('\n🔍 Verificando configuración actual...', 'cyan');

  const configuracionBrevo = {
    apiKey: process.env.BREVO_API_KEY,
    fromEmail: process.env.BREVO_FROM_EMAIL,
    fromName: process.env.BREVO_FROM_NAME,
  };

  const configuracionSendGrid = {
    apiKey: process.env.SENDGRID_API_KEY,
  };

  log('\n📋 Estado de configuración:', 'blue');

  // Verificar Brevo
  if (configuracionBrevo.apiKey) {
    log('✅ BREVO_API_KEY: Configurada', 'green');
  } else {
    log('❌ BREVO_API_KEY: No configurada', 'red');
  }

  if (configuracionBrevo.fromEmail) {
    log(`✅ BREVO_FROM_EMAIL: ${configuracionBrevo.fromEmail}`, 'green');
  } else {
    log('⚠️  BREVO_FROM_EMAIL: No configurada (usando default)', 'yellow');
  }

  if (configuracionBrevo.fromName) {
    log(`✅ BREVO_FROM_NAME: ${configuracionBrevo.fromName}`, 'green');
  } else {
    log('⚠️  BREVO_FROM_NAME: No configurada (usando default)', 'yellow');
  }

  // Verificar SendGrid (legacy)
  if (configuracionSendGrid.apiKey) {
    log('⚠️  SENDGRID_API_KEY: Aún configurada (se puede remover)', 'yellow');
  } else {
    log('✅ SENDGRID_API_KEY: No configurada (bueno para migración)', 'green');
  }

  return {
    brevoCompleta: configuracionBrevo.apiKey && configuracionBrevo.fromEmail,
    sendGridActiva: !!configuracionSendGrid.apiKey,
  };
}

async function verificarArchivos() {
  log('\n📁 Verificando archivos del proyecto...', 'cyan');

  const archivos = [
    { path: 'api/api-mail_brevo.js', tipo: 'nuevo' },
    { path: 'api/api-mail.js', tipo: 'legacy' },
    { path: 'utils/testBrevo.js', tipo: 'test' },
    { path: 'docs/BREVO_SETUP.md', tipo: 'documentacion' },
  ];

  for (const archivo of archivos) {
    const rutaCompleta = path.join(process.cwd(), archivo.path);

    if (fs.existsSync(rutaCompleta)) {
      const stats = fs.statSync(rutaCompleta);
      const tamaño = (stats.size / 1024).toFixed(1);

      switch (archivo.tipo) {
        case 'nuevo':
          log(`✅ ${archivo.path} (${tamaño}KB) - Archivo de Brevo`, 'green');
          break;
        case 'legacy':
          log(
            `⚠️  ${archivo.path} (${tamaño}KB) - Archivo legacy de SendGrid`,
            'yellow',
          );
          break;
        case 'test':
          log(`✅ ${archivo.path} (${tamaño}KB) - Script de prueba`, 'green');
          break;
        case 'documentacion':
          log(`✅ ${archivo.path} (${tamaño}KB) - Documentación`, 'green');
          break;
      }
    } else {
      log(`❌ ${archivo.path} - No encontrado`, 'red');
    }
  }
}

async function analizarUsoSendGrid() {
  log('\n🔍 Analizando uso de SendGrid en el código...', 'cyan');

  const archivosParaBuscar = [
    'api/index.js',
    'controllers/users.js',
    'models/sugerenciasPacientes.js',
    'models/sugerenciasMedicos.js',
    'models/sugerenciasEmpresas.js',
  ];

  const patronesSendGrid = ['@sendgrid/mail', 'sgMail', 'SENDGRID_API_KEY'];

  for (const archivo of archivosParaBuscar) {
    const rutaCompleta = path.join(process.cwd(), archivo);

    if (fs.existsSync(rutaCompleta)) {
      const contenido = fs.readFileSync(rutaCompleta, 'utf8');
      const usosSendGrid = patronesSendGrid.filter((patron) =>
        contenido.includes(patron),
      );

      if (usosSendGrid.length > 0) {
        log(`⚠️  ${archivo} - Contiene referencias de SendGrid:`, 'yellow');
        usosSendGrid.forEach((uso) => {
          log(`   - ${uso}`, 'yellow');
        });
      } else {
        log(`✅ ${archivo} - Sin referencias de SendGrid`, 'green');
      }
    }
  }
}

async function probarBrevo() {
  log('\n🧪 Probando configuración de Brevo...', 'cyan');

  try {
    const { testBrevoConfiguration } = require('../utils/testBrevo');
    await testBrevoConfiguration();
    log('✅ Prueba de Brevo exitosa!', 'green');
    return true;
  } catch (error) {
    log('❌ Error en prueba de Brevo:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function mostrarProximosPasos(configuracion, pruebaBrevo) {
  log('\n📋 Próximos pasos recomendados:', 'blue');

  if (!configuracion.brevoCompleta) {
    log('1. ⚠️  Configurar variables de entorno de Brevo:', 'yellow');
    log('   - BREVO_API_KEY=tu_api_key', 'white');
    log('   - BREVO_FROM_EMAIL=servicios@contrerasrobledo.com.do', 'white');
    log('   - BREVO_FROM_NAME=Lab Contreras', 'white');
  } else {
    log('1. ✅ Configuración de Brevo completa', 'green');
  }

  if (!pruebaBrevo) {
    log('2. ⚠️  Ejecutar prueba de Brevo:', 'yellow');
    log('   node utils/testBrevo.js', 'white');
  } else {
    log('2. ✅ Prueba de Brevo exitosa', 'green');
  }

  log('3. 🔧 Actualizar modelos que usen SendGrid:', 'blue');
  log('   - models/sugerenciasPacientes.js', 'white');
  log('   - models/sugerenciasMedicos.js', 'white');

  log('4. 🧹 Limpiar código legacy (opcional):', 'blue');
  log('   - Remover api/api-mail.js', 'white');
  log('   - Remover SENDGRID_API_KEY del .env', 'white');
  log('   - Desinstalar @sendgrid/mail', 'white');

  log('5. 📚 Revisar documentación:', 'blue');
  log('   - docs/BREVO_SETUP.md', 'white');

  log(
    '\n🎉 Una vez completados todos los pasos, la migración estará completa!',
    'green',
  );
}

async function main() {
  log('🚀 Migración de SendGrid a Brevo - Lab Contreras', 'magenta');
  log('================================================', 'magenta');

  try {
    const configuracion = await verificarConfiguracion();
    await verificarArchivos();
    await analizarUsoSendGrid();
    const pruebaBrevo = await probarBrevo();

    await mostrarProximosPasos(configuracion, pruebaBrevo);

    log('\n✨ Análisis de migración completado!', 'green');
  } catch (error) {
    log('\n❌ Error durante el análisis:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
