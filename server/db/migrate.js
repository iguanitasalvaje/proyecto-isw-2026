'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { crearPool, enmascararUrl } = require('./pool');

/**
 * Ejecuta todas las migraciones SQL pendientes en orden cronológico/alfanumérico.
 * Utiliza una transacción atómica y un advisory lock para evitar condiciones de carrera.
 */
async function migrar(pool) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Bloqueo consultivo transaccional para evitar ejecuciones concurrentes en paralelo
    await client.query("SELECT pg_advisory_xact_lock(hashtext(current_database()), hashtext(current_schema() || ':sixseven:migrations'))");

    // Tabla de control de migraciones
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp()
    )`);

    const directorio = path.join(__dirname, 'migrations');
    const archivos = (await fs.readdir(directorio))
      .filter((n) => /^\d+_.*\.sql$/.test(n))
      .sort();

    let migracionesNuevas = 0;

    for (const nombre of archivos) {
      const sql = await fs.readFile(path.join(directorio, nombre), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');

      const existente = await client.query(
        'SELECT checksum FROM schema_migrations WHERE nombre = $1',
        [nombre]
      );

      if (existente.rowCount > 0) {
        if (existente.rows[0].checksum !== checksum) {
          throw new Error(
            `Migración aplicada previamente ha sido modificada: ${nombre}. Las migraciones no deben modificarse una vez aplicadas para mantener la integridad de los entornos.`
          );
        }
        continue;
      }

      // Aplicar nueva migración
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (nombre, checksum) VALUES ($1, $2)',
        [nombre, checksum]
      );
      migracionesNuevas++;
    }

    await client.query('COMMIT');
    return { total: archivos.length, nuevas: migracionesNuevas };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

  (async () => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      console.error('\nError: DATABASE_URL no está configurada en server/.env.');
      console.error('Para ejecutar las migraciones, debes configurar una URL de conexión PostgreSQL válida.');
      console.error('Ejemplo local: postgresql://postgres:tu_password@127.0.0.1:5432/sixseven_db');
      console.error('Consulta server/.env.example para más detalles.\n');
      process.exit(1);
    }

    console.log('\n=== Migraciones de Base de Datos - Six Seven Transmisiones ===');
    console.log(`Conectando a base de datos: ${enmascararUrl(process.env.DATABASE_URL)}`);

    const pool = crearPool({ connectionString: process.env.DATABASE_URL });

    try {
      const resultado = await migrar(pool);
      if (resultado.nuevas > 0) {
        console.log(`✓ Se aplicaron exitosamente ${resultado.nuevas} migraciones nuevas.`);
      } else {
        console.log('✓ La base de datos ya se encuentra al día. No hay migraciones pendientes.');
      }
      console.log(`Total de migraciones registradas: ${resultado.total}.\n`);
    } finally {
      await pool.end();
    }
  })().catch((error) => {
    console.error('\n✕ No se pudieron aplicar las migraciones.');
    console.error('Motivo:', error.message);
    console.error('Verifica la conectividad, permisos del usuario en PostgreSQL y que el esquema exista.\n');
    process.exitCode = 1;
  });
}

module.exports = { migrar };
