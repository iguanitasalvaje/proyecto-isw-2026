'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { crearPool } = require('../../db/pool');
const { migrar } = require('../../db/migrate');

async function conBaseTemporal(trabajo, { migraciones = true } = {}) {
  assert.ok(process.env.TEST_DATABASE_URL, 'Falta TEST_DATABASE_URL: se requiere una base exclusiva de pruebas');

  // Guardia de seguridad estricta: impedir que las pruebas utilicen la base de datos de desarrollo o producción
  if (process.env.DATABASE_URL && process.env.TEST_DATABASE_URL.trim() === process.env.DATABASE_URL.trim()) {
    throw new Error(
      'Seguridad de pruebas: TEST_DATABASE_URL no debe ser idéntica a DATABASE_URL para evitar daños o eliminación accidental de datos de desarrollo o producción.'
    );
  }

  const schema = `rf_test_${randomUUID().replaceAll('-', '')}`;
  const admin = crearPool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = crearPool({ connectionString: process.env.TEST_DATABASE_URL, schema });
  let creado = false;

  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    creado = true;
    if (migraciones) await migrar(pool);
    return await trabajo(pool);
  } finally {
    await pool.end();
    if (creado) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
}

module.exports = { conBaseTemporal };
