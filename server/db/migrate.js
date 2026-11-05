'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { crearPool } = require('./pool');

async function migrar(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Bloqueo transaccional liberado incluso ante errores.
    await client.query("SELECT pg_advisory_xact_lock(hashtext(current_database()), hashtext(current_schema() || ':rf12:migrations'))");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY, checksum TEXT NOT NULL,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp())`);
    const directorio = path.join(__dirname, 'migrations');
    const archivos = (await fs.readdir(directorio)).filter(n => /^\d+_.*\.sql$/.test(n)).sort();
    for (const nombre of archivos) {
      const sql = await fs.readFile(path.join(directorio, nombre), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existente = await client.query('SELECT checksum FROM schema_migrations WHERE nombre=$1', [nombre]);
      if (existente.rowCount) {
        if (existente.rows[0].checksum !== checksum) throw new Error(`Migración aplicada modificada: ${nombre}`);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(nombre, checksum) VALUES ($1,$2)', [nombre, checksum]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
  (async () => {
    const pool = crearPool({ connectionString: process.env.DATABASE_URL });
    try { await migrar(pool); console.log('Migraciones aplicadas'); }
    finally { await pool.end(); }
  })().catch(() => { console.error('No se pudieron aplicar las migraciones. Verifica configuración, conexión y esquema; no se muestran credenciales.'); process.exitCode = 1; });
}

module.exports = { migrar };
