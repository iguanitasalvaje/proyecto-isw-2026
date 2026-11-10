'use strict';
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { crearPool } = require('../../db/pool');
const { migrar } = require('../../db/migrate');

async function conBaseTemporal(trabajo, { migraciones = true } = {}) {
  assert.ok(process.env.TEST_DATABASE_URL, 'Falta TEST_DATABASE_URL: se requiere una base exclusiva de pruebas');
  const schema = `rf5_test_${randomUUID().replaceAll('-', '')}`;
  const admin = crearPool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = crearPool({ connectionString: process.env.TEST_DATABASE_URL, schema });
  let creado = false;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`); creado = true;
    if (migraciones) await migrar(pool);
    return await trabajo(pool);
  } finally {
    await pool.end();
    if (creado) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
}
module.exports = { conBaseTemporal };
