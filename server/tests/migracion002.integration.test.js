'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { crearPool } = require('../db/pool');
const { migrar } = require('../db/migrate');

// Solo modifica un esquema temporal de la base exclusiva TEST_DATABASE_URL.
// Valida directamente el esquema y la migración, sin utilizar repositorios.
test('002 preserva registros previos y valida el nuevo esquema', async () => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Falta TEST_DATABASE_URL: se requiere una base exclusiva de pruebas');
  const schema = `rf12_m002_${randomUUID().replaceAll('-', '')}`;
  const admin = crearPool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = crearPool({ connectionString: process.env.TEST_DATABASE_URL, schema });
  let creado = false;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    creado = true;
    const original = await readFile(path.join(__dirname, '../db/migrations/001_rf12.sql'), 'utf8');
    const nueva = await readFile(path.join(__dirname, '../db/migrations/002_rf12_porcentaje_individual.sql'), 'utf8');
    await pool.query(original);
    const [evento, persona, rol, valor, asignacion, liquidacion, detalle] = Array.from({ length: 7 }, () => randomUUID());
    await pool.query('INSERT INTO evento(id,nombre,monto_total) VALUES ($1,$2,350000)', [evento, 'Histórico']);
    await pool.query('INSERT INTO persona(id,nombre) VALUES ($1,$2)', [persona, 'Persona histórica']);
    await pool.query('INSERT INTO rol_evento(id,nombre) VALUES ($1,$2)', [rol, 'Cámara']);
    await pool.query("INSERT INTO valor_rol(id,rol_id,porcentaje_centesimas,vigente_desde) VALUES ($1,$2,1000,'2020-01-01T00:00:00Z')", [valor, rol]);
    await pool.query('INSERT INTO asignacion_evento(id,evento_id,persona_id,rol_id) VALUES ($1,$2,$3,$4)', [asignacion, evento, persona, rol]);
    await pool.query('INSERT INTO liquidacion(id,evento_id,monto_evento_aplicado,version_evento,total_distribuido) VALUES ($1,$2,350000,1,35000)', [liquidacion, evento]);
    await pool.query(`INSERT INTO detalle_liquidacion(id,liquidacion_id,asignacion_id,persona_id,nombre_persona,rol_id,nombre_rol,valor_rol_id,porcentaje_centesimas,monto_calculado)
      VALUES ($1,$2,$3,$4,'Persona histórica',$5,'Cámara',$6,1000,35000)`, [detalle, liquidacion, asignacion, persona, rol, valor]);
    const tablas = ['evento', 'persona', 'rol_evento', 'valor_rol', 'asignacion_evento', 'liquidacion', 'detalle_liquidacion'];
    const antes = {};
    for (const tabla of tablas) antes[tabla] = (await pool.query(`SELECT * FROM ${tabla}`)).rows;
    await pool.query('BEGIN');
    try { await pool.query(nueva); await pool.query('COMMIT'); }
    catch (error) { await pool.query('ROLLBACK'); throw error; }
    for (const tabla of tablas) {
      const despues = (await pool.query(`SELECT * FROM ${tabla}`)).rows;
      assert.equal(despues.length, antes[tabla].length);
      for (const [campo, valorAnterior] of Object.entries(antes[tabla][0])) assert.deepEqual(despues[0][campo], valorAnterior);
    }
    const a = (await pool.query('SELECT * FROM asignacion_evento')).rows[0];
    assert.equal(a.porcentaje_centesimas, null);
    assert.equal(a.valor_rol_origen_id, null);
    const e = (await pool.query('SELECT * FROM evento')).rows[0];
    assert.equal(e.estado, 'pendiente');
    assert.equal(e.finalizado_en, null);
    for (const porcentaje of [0, 1250, 10000]) await pool.query('UPDATE asignacion_evento SET porcentaje_centesimas=$1', [porcentaje]);
    for (const porcentaje of [-1, 10001]) await assert.rejects(pool.query('UPDATE asignacion_evento SET porcentaje_centesimas=$1', [porcentaje]), { code: '23514' });
    await assert.rejects(pool.query('UPDATE asignacion_evento SET porcentaje_centesimas=$1', ['12.5']), { code: '22P02' });
    await assert.rejects(pool.query('UPDATE asignacion_evento SET valor_rol_origen_id=$1', [randomUUID()]), { code: '23503' });
    await pool.query('UPDATE asignacion_evento SET valor_rol_origen_id=$1', [valor]);
    for (const estado of ['pendiente', 'en_curso', 'finalizado']) await pool.query('UPDATE evento SET estado=$1', [estado]);
    await assert.rejects(pool.query("UPDATE evento SET estado='otro'"), { code: '23514' });
    await assert.rejects(pool.query('UPDATE evento SET estado=NULL'), { code: '23502' });
    await pool.query('UPDATE detalle_liquidacion SET valor_rol_id=NULL');
    await assert.rejects(pool.query('UPDATE detalle_liquidacion SET valor_rol_id=$1', [randomUUID()]), { code: '23503' });

    // Vacía solo el esquema temporal para verificar el migrador y su reejecución.
    await pool.query('DROP TABLE detalle_liquidacion, liquidacion, asignacion_evento, valor_rol, rol_evento, persona, evento');
    await migrar(pool);
    await migrar(pool);
    assert.deepEqual((await pool.query('SELECT nombre FROM schema_migrations ORDER BY nombre')).rows.map(r => r.nombre),
      ['001_rf12.sql', '002_rf12_porcentaje_individual.sql', '003_rf5_kit_premium.sql', '004_rf8_canjes.sql']);
    for (const tabla of tablas) assert.equal((await pool.query(`SELECT * FROM ${tabla}`)).rowCount, 0);
  } finally {
    await pool.end();
    if (creado) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
});
