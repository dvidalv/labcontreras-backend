/**
 * Rastrea las Notas de Crédito Electrónicas (tipo 34) emitidas por el laboratorio.
 *
 * Los e-CF enviados no se guardan en MongoDB, así que los NCF se reconstruyen a
 * partir de los rangos tipo 34 (numero_inicial + numeros_utilizados) y luego se
 * consulta su estatus en TheFactoryHKA. Solo lectura: no modifica nada.
 *
 * Uso:
 *   node scripts/rastrearNotasCredito.js            # todas las notas consumidas
 *   node scripts/rastrearNotasCredito.js --sin-estatus  # solo lista los NCF
 *   node scripts/rastrearNotasCredito.js --csv salida.csv
 */
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const axios = require('axios');
const { Comprobante } = require('../models/comprobante');
const {
  THEFACTORY_AUTH_URL,
  THEFACTORY_ESTATUS_URL,
  THEFACTORY_USUARIO,
  THEFACTORY_CLAVE,
  THEFACTORY_RNC,
} = require('../utils/constants');

const args = process.argv.slice(2);
const sinEstatus = args.includes('--sin-estatus');
const csvIndex = args.indexOf('--csv');
const csvPath = csvIndex !== -1 ? args[csvIndex + 1] : null;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const obtenerToken = async () => {
  const { data } = await axios.post(
    THEFACTORY_AUTH_URL,
    { Usuario: THEFACTORY_USUARIO, Clave: THEFACTORY_CLAVE, RNC: THEFACTORY_RNC },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
  );
  if (data.codigo !== 0) {
    throw new Error(`Autenticación TheFactoryHKA fallida: ${data.mensaje}`);
  }
  return data.token;
};

const consultarEstatus = async (token, ncf) => {
  try {
    const { data } = await axios.post(
      THEFACTORY_ESTATUS_URL,
      { token, rnc: THEFACTORY_RNC, documento: ncf },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
    );
    return data;
  } catch (error) {
    return {
      codigo: error.response?.status ?? 'ERR',
      mensaje: error.response?.data?.mensaje || error.message,
    };
  }
};

const escaparCsv = (valor) => {
  const texto = valor === undefined || valor === null ? '' : String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const main = async () => {
  await mongoose.connect(process.env.ATLAS_URI, {
    serverSelectionTimeoutMS: 30000,
  });

  const rangos = await Comprobante.find({ tipo_comprobante: '34' })
    .sort({ numero_inicial: 1 })
    .lean();

  if (rangos.length === 0) {
    console.log('No hay rangos tipo 34 registrados.');
    return;
  }

  console.log(`\nRangos de Nota de Crédito (tipo 34): ${rangos.length}\n`);
  const ncfs = [];
  for (const rango of rangos) {
    const prefijo = rango.prefijo || 'E';
    const ultimo = rango.numero_inicial + rango.numeros_utilizados - 1;
    console.log(
      `- RNC ${rango.rnc} | ${rango.numero_inicial}-${rango.numero_final} | ` +
        `utilizados ${rango.numeros_utilizados} | estado ${rango.estado} | ` +
        `autorizado ${new Date(rango.fecha_autorizacion).toISOString().slice(0, 10)}`,
    );
    for (let n = rango.numero_inicial; n <= ultimo; n += 1) {
      ncfs.push(`${prefijo}34${String(n).padStart(10, '0')}`);
    }
  }

  console.log(`\nNCF tipo 34 consumidos: ${ncfs.length}\n`);
  if (ncfs.length === 0) return;

  if (sinEstatus) {
    ncfs.forEach((ncf) => console.log(ncf));
    return;
  }

  const token = await obtenerToken();
  const resultados = [];

  for (const ncf of ncfs) {
    const estatus = await consultarEstatus(token, ncf);
    const observaciones = (estatus.observaciones || [])
      .filter((o) => o.codigo !== 0)
      .map((o) => `${o.codigo}: ${o.mensaje}`)
      .join(' | ');
    const fila = {
      ncf,
      codigo: estatus.codigo,
      mensaje: estatus.mensaje,
      fechaEmision: estatus.fechaEmision || '',
      fechaFirma: estatus.fechaFirma || '',
      observaciones,
    };
    resultados.push(fila);
    console.log(
      `${ncf}  [${fila.codigo}] ${fila.mensaje || ''}` +
        `${fila.fechaEmision ? `  emisión ${fila.fechaEmision}` : ''}` +
        `${observaciones ? `  -> ${observaciones}` : ''}`,
    );
    await esperar(300);
  }

  const resumen = resultados.reduce((acc, r) => {
    const clave = r.mensaje || `código ${r.codigo}`;
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});
  console.log('\nResumen por estatus:');
  Object.entries(resumen).forEach(([estado, total]) =>
    console.log(`  ${estado}: ${total}`),
  );

  if (csvPath) {
    const columnas = Object.keys(resultados[0]);
    const lineas = [
      columnas.join(','),
      ...resultados.map((r) => columnas.map((c) => escaparCsv(r[c])).join(',')),
    ];
    fs.writeFileSync(csvPath, `${lineas.join('\n')}\n`);
    console.log(`\nCSV guardado en ${csvPath}`);
  }
};

main()
  .catch((error) => {
    console.error('Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
