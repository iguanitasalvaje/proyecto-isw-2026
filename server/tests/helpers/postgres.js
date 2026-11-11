'use strict';
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { crearPool } = require('../../db/pool');
const { migrar } = require('../../db/migrate');

// Solo se permite verificar identidad mediante transacciones de lectura.
async function verificarIndependencia({ env = process.env, factory = crearPool } = {}) {
  assert.ok(env.TEST_DATABASE_URL, 'Falta TEST_DATABASE_URL');
  assert.ok(env.DATABASE_URL, 'Falta DATABASE_URL para verificar aislamiento');
  const conexiones = [];
  try {
    const identidades = [];
    for (const connectionString of [env.DATABASE_URL, env.TEST_DATABASE_URL]) {
      const pool = factory({ connectionString });
      conexiones.push(pool);
      const client = await pool.connect();
      try {
        await client.query('BEGIN READ ONLY');
        const { rows } = await client.query('SELECT current_database() AS db, inet_server_addr()::text AS host, inet_server_port() AS port');
        const identidad = rows[0];
        assert.ok(rows.length === 1 && typeof identidad?.db === 'string' && identidad.db &&
          typeof identidad.host === 'string' && identidad.host &&
          Number.isInteger(identidad.port) && identidad.port > 0, 'Identidad no verificable');
        identidades.push(identidad);
      } finally {
        try { await client.query('ROLLBACK'); } finally { client.release(); }
      }
    }
    assert.notDeepEqual(identidades[0], identidades[1], 'La base de pruebas coincide con la base de uso');
  } catch {
    throw new Error('No se pudo verificar una base de pruebas independiente; operación cancelada');
  } finally {
    await Promise.all(conexiones.map(pool => pool.end()));
  }
}

async function conBaseTemporal(trabajo, { migraciones = true, env = process.env,
  factory = crearPool, aplicarMigraciones = migrar } = {}) {
  await verificarIndependencia({ env, factory });
  const schema = `test_pg_${randomUUID().replaceAll('-', '')}`;
  const admin = factory({ connectionString: env.TEST_DATABASE_URL });
  let pool, creado = false;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`); creado = true;
    pool = factory({ connectionString: env.TEST_DATABASE_URL, schema });
    if (migraciones) await aplicarMigraciones(pool);
    return await trabajo(pool, schema);
  } finally {
    try { if (pool) await pool.end(); }
    finally {
      try { if (creado) await admin.query(`DROP SCHEMA ${schema} CASCADE`); }
      finally { await admin.end(); }
    }
  }
}
module.exports = { conBaseTemporal, verificarIndependencia };
