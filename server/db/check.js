'use strict';

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const { crearPool, enmascararUrl } = require('./pool');

async function diagnosticar() {
  console.log('\n=== Diagnóstico de Conexión PostgreSQL - Six Seven Transmisiones ===\n');

  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    console.error('Estado: [NO CONFIGURADO]');
    console.error('Detalle: DATABASE_URL no se encuentra definida en server/.env.');
    console.error('\nInstrucciones para configurarla:');
    console.error('1. Revisa la plantilla server/.env.example.');
    console.error('2. Añade en server/.env: DATABASE_URL=postgresql://usuario:password@localhost:5432/sixseven_db\n');
    process.exitCode = 1;
    return;
  }

  const urlEnmascarada = enmascararUrl(process.env.DATABASE_URL);
  console.log(`URL detectada: ${urlEnmascarada}`);

  let pool;
  try {
    pool = crearPool({ connectionString: process.env.DATABASE_URL });
  } catch (errorPool) {
    console.error('Error al inicializar el pool:', errorPool.message);
    process.exitCode = 1;
    return;
  }

  try {
    const inicio = Date.now();
    const info = await pool.query(`
      SELECT 
        version() AS version_completa,
        current_database() AS nombre_base,
        current_user AS usuario_actual,
        now() AS hora_servidor
    `);
    const latencia = Date.now() - inicio;

    const fila = info.rows[0];
    console.log('\n✓ Conexión exitosa a PostgreSQL');
    console.log(`  - Base de datos:  ${fila.nombre_base}`);
    console.log(`  - Usuario:        ${fila.usuario_actual}`);
    console.log(`  - Latencia ping:  ${latencia} ms`);
    console.log(`  - Versión motor:  ${fila.version_completa.split(',')[0]}`);
    console.log(`  - Hora servidor:  ${fila.hora_servidor.toISOString()}`);

    // Comprobar tabla de migraciones
    const checkMigraciones = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() AND table_name = 'schema_migrations'
      ) AS existe;
    `);

    if (checkMigraciones.rows[0].existe) {
      const aplicadas = await pool.query('SELECT nombre, aplicada_en FROM schema_migrations ORDER BY nombre ASC');
      console.log(`\n✓ Migraciones aplicadas: ${aplicadas.rowCount}`);
      aplicadas.rows.forEach((m) => {
        console.log(`    [✓] ${m.nombre} (${new Date(m.aplicada_en).toLocaleString('es-CL')})`);
      });
    } else {
      console.log('\n⚠ La tabla de migraciones aún no existe. Ejecuta: npm run db:migrate');
    }

    // Comprobar tabla usuario y cuenta de Dueño
    const checkUsuario = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() AND table_name = 'usuario'
      ) AS existe;
    `);

    if (checkUsuario.rows[0].existe) {
      const totalUsuarios = await pool.query('SELECT count(*) AS total FROM usuario');
      const totalDueno = await pool.query("SELECT count(*) AS total FROM usuario WHERE rol = 'DUENO'");
      console.log(`\n✓ Módulo de Usuarios (RF1):`);
      console.log(`  - Cuentas registradas: ${totalUsuarios.rows[0].total}`);
      console.log(`  - Cuenta Dueño inicial: ${Number(totalDueno.rows[0].total) > 0 ? 'Configurada' : 'Pendiente (ejecuta node scripts/crearDueno.js)'}`);
    } else {
      console.log('\n⚠ La tabla usuario aún no ha sido migrada.');
    }

    console.log('\n✓ El backend está listo para conectarse a esta base de datos.\n');
  } catch (err) {
    console.error('\n✕ Error de conexión a PostgreSQL:');
    console.error(`  Mensaje: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.error('  Causa: El servicio PostgreSQL no está iniciado o el puerto no es accesible.');
    } else if (err.code === '28P01') {
      console.error('  Causa: Contraseña o usuario incorrectos en la cadena DATABASE_URL.');
    } else if (err.code === '3D000') {
      console.error('  Causa: La base de datos especificada en la URL no existe en PostgreSQL.');
    }
    console.error('\nRevisa tu archivo server/.env y la conectividad antes de continuar.\n');
    process.exitCode = 1;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  diagnosticar().catch((e) => {
    console.error('Error imprevisto en diagnóstico:', e.message);
    process.exitCode = 1;
  });
}

module.exports = { diagnosticar };
