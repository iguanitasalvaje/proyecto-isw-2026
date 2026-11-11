'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { conBaseTemporal } = require('./helpers/postgres');
const { migrar } = require('../db/migrate');
const { crearInventarioRepository } = require('../repositories/inventarioRepository');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearKitRepository } = require('../repositories/kitRepository');
const { crearLiquidacionRepository } = require('../repositories/liquidacionRepository');

function conInventarioTemporal(trabajo, migraciones = true) {
  return conBaseTemporal(trabajo, { migraciones });
}
async function aplicarAnteriores(db) {
  for (const nombre of ['001_rf12.sql', '002_rf12_porcentaje_individual.sql', '003_rf5_kit_premium.sql']) {
    await db.query(await readFile(path.join(__dirname, '../db/migrations', nombre), 'utf8'));
  }
}
const sql004 = () => readFile(path.join(__dirname, '../db/migrations/004_inventario.sql'), 'utf8');
async function registros(db, tablas) {
  const resultado = {};
  for (const tabla of tablas) resultado[tabla] = (await db.query(`SELECT * FROM ${tabla} ORDER BY 1`)).rows;
  return resultado;
}

test('004 conserva datos RF5 y liquidaciones RF12 sin crear registros de Inventario', async () => conInventarioTemporal(async db => {
  await aplicarAnteriores(db);
  const op = crearOperacionRepository(db);
  const rf5 = crearKitRepository(db);
  const liq = crearLiquidacionRepository(db);
  const evento = await op.crearEvento({ nombre: 'Evento de prueba', precioBase: 10001 });
  const persona = await op.crearPersona({ nombre: 'Persona de prueba' });
  const rol = await op.crearRol({ nombre: 'Rol de prueba' });
  await op.asignar({ eventoId: evento.id, personaId: persona.id, rolId: rol.id, porcentajeCentesimas: 5000 });
  const kit = await rf5.crearKit({ nombre: 'Recurso de prueba', premium: true });
  await rf5.configurarPremium({ porcentajeCentesimas: 1250, vigenteDesde: '2020-01-01T00:00:00Z' });
  await rf5.asignarKit({ eventoId: evento.id, kitId: kit.id });
  await op.cambiarEstado({ eventoId: evento.id, estado: 'en_curso' });
  await op.cambiarEstado({ eventoId: evento.id, estado: 'finalizado' });
  const guardada = await liq.registrar(evento.id);
  const tablas = ['evento', 'persona', 'rol_evento', 'valor_rol', 'asignacion_evento', 'kit',
    'configuracion_recargo', 'asignacion_kit_evento', 'liquidacion', 'detalle_liquidacion'];
  const antes = await registros(db, tablas);
  const tx = await db.connect();
  try {
    await tx.query('BEGIN');
    await tx.query(await sql004());
    await tx.query('COMMIT');
  } catch (error) { await tx.query('ROLLBACK'); throw error; }
  finally { tx.release(); }
  assert.deepEqual(await registros(db, tablas), antes);
  assert.deepEqual(await liq.obtener(evento.id), guardada);
  for (const tabla of ['kits', 'equipos', 'log_autorizaciones']) assert.equal((await db.query(`SELECT * FROM ${tabla}`)).rowCount, 0);
}, false));

test('004 revierte todo el DDL si falla la transacción', async () => conInventarioTemporal(async db => {
  await aplicarAnteriores(db);
  const tx = await db.connect();
  try {
    await tx.query('BEGIN');
    await tx.query(await sql004());
    await assert.rejects(tx.query('SELECT 1/0'), { code: '22012' });
    await tx.query('ROLLBACK');
  } finally { await tx.query('ROLLBACK'); tx.release(); }
  for (const tabla of ['kits', 'equipos', 'log_autorizaciones']) {
    assert.equal((await db.query('SELECT to_regclass($1) AS tabla', [tabla])).rows[0].tabla, null);
  }
  assert.notEqual((await db.query("SELECT to_regclass('kit') AS tabla")).rows[0].tabla, null);
}, false));

test('Inventario: esquema, repositorio y relaciones PostgreSQL', async t => conInventarioTemporal(async db => {
  const repo = crearInventarioRepository(db);
  await t.test('migrador idempotente y columnas compatibles con Prisma', async () => {
    await migrar(db);
    assert.equal((await db.query('SELECT * FROM schema_migrations')).rowCount, 5);
    const columnas = (await db.query(`SELECT table_name, column_name, data_type, datetime_precision
      FROM information_schema.columns WHERE table_schema=current_schema()
      AND table_name IN ('kits','equipos','log_autorizaciones')`)).rows;
    const columna = (tabla, nombre) => columnas.find(c => c.table_name === tabla && c.column_name === nombre);
    assert.equal(columna('kits', 'updatedAt'), undefined);
    assert.equal(columna('kits', 'id').data_type, 'integer');
    assert.equal(columna('equipos', 'valorReposicion').data_type, 'double precision');
    for (const campo of ['createdAt', 'updatedAt']) {
      assert.equal(columna('equipos', campo).data_type, 'timestamp without time zone');
      assert.equal(columna('equipos', campo).datetime_precision, 3);
    }
    assert.equal(columna('log_autorizaciones', 'eventoId').data_type, 'integer');
  });
  const kit = await repo.crearKit({ nombre: 'Kit de prueba', descripcion: 'Descripción de prueba' });
  const equipo = await repo.crearEquipo({ nombre: 'Cámara de prueba', tipo: 'Cámara', serie: 'SERIE-TEST', valorReposicion: 123.5 });
  await t.test('crea kits y equipos, con serie obligatoria y fechas válidas', async () => {
    assert.equal(typeof kit.id, 'number'); assert.equal(kit.descripcion, 'Descripción de prueba');
    assert.equal(Object.hasOwn(kit, 'updatedAt'), false);
    assert.equal(equipo.estado, 'Disponible'); assert.equal(equipo.kitId, null);
    assert.ok(equipo.createdAt instanceof Date); assert.ok(equipo.updatedAt instanceof Date);
    assert.equal(equipo.valorReposicion, 123.5);
    assert.equal((await repo.listarEquipos()).length, 1);
    assert.deepEqual(await repo.obtenerEquipoPorId(String(equipo.id)), equipo);
    await repo.actualizarEstadoEquipo(equipo.id, 'Dañado');
    assert.equal((await repo.obtenerEquipoPorId(equipo.id)).estado, 'Dañado');
  });
  await t.test('asocia, consulta y desasocia equipos sin utilizar UUID', async () => {
    const asignado = await repo.asignarEquipoAKit(equipo.id, kit.id);
    assert.equal(asignado.kitId, kit.id);
    assert.equal((await repo.listarKits())[0].equipos[0].id, equipo.id);
    assert.equal((await repo.asignarEquipoAKit(equipo.id, null)).kitId, null);
    assert.deepEqual((await repo.listarKits())[0].equipos, []);
    await assert.rejects(repo.asignarEquipoAKit(equipo.id, 2147483647), { code: '23503' });
    assert.equal((await repo.obtenerEquipoPorId(equipo.id)).kitId, null);
  });
  await t.test('restricciones de serie, campos obligatorios y valor de reposición', async () => {
    await assert.rejects(repo.crearEquipo({ nombre: 'Duplicado', tipo: 'Cámara', serie: equipo.serie, valorReposicion: 1 }), { code: '23505' });
    await assert.rejects(db.query(`INSERT INTO equipos(nombre,tipo,"valorReposicion","updatedAt") VALUES ('Test','Test',1,now())`), { code: '23502' });
    for (const valor of [-1, 'Infinity', 'NaN']) {
      await assert.rejects(db.query('UPDATE equipos SET "valorReposicion"=$1 WHERE id=$2', [valor, equipo.id]), { code: '23514' });
    }
  });
  await t.test('autorizaciones requieren un kit y no inventan una FK a eventos RF12', async () => {
    const log = (await db.query(`INSERT INTO log_autorizaciones("jefeTecnico","eventoId","kitId")
      VALUES ('Jefe de prueba',12345,$1) RETURNING *`, [kit.id])).rows[0];
    assert.equal(typeof log.id, 'number'); assert.equal(log.eventoId, 12345); assert.ok(log.fecha instanceof Date);
    await assert.rejects(db.query(`INSERT INTO log_autorizaciones("jefeTecnico","eventoId","kitId")
      VALUES ('Jefe de prueba',12345,2147483647)`), { code: '23503' });
    await assert.rejects(db.query('DELETE FROM kits WHERE id=$1', [kit.id]), { code: '23503' });
    const fks = (await db.query(`SELECT pg_get_constraintdef(oid) AS definicion FROM pg_constraint
      WHERE conrelid='log_autorizaciones'::regclass AND contype='f'`)).rows;
    assert.equal(fks.length, 1); assert.match(fks[0].definicion, /REFERENCES kits/);
    await db.query('UPDATE kits SET id=10001 WHERE id=$1', [kit.id]);
    assert.equal((await db.query('SELECT "kitId" FROM log_autorizaciones WHERE id=$1', [log.id])).rows[0].kitId, 10001);
  });
  await t.test('SET NULL y CASCADE mantienen las relaciones del modelo', async () => {
    const otro = await repo.crearKit({ nombre: 'Otro kit de prueba' });
    await repo.asignarEquipoAKit(equipo.id, otro.id);
    await db.query('UPDATE kits SET id=10000 WHERE id=$1', [otro.id]);
    assert.equal((await repo.obtenerEquipoPorId(equipo.id)).kitId, 10000);
    await db.query('DELETE FROM kits WHERE id=10000');
    assert.equal((await repo.obtenerEquipoPorId(equipo.id)).kitId, null);
  });
  await t.test('un fallo de FK revierte todos los cambios de una transacción', async () => {
    const antes = await registros(db, ['kits', 'equipos', 'log_autorizaciones']);
    const tx = await db.connect();
    try {
      await tx.query('BEGIN');
      const op = crearInventarioRepository(tx);
      await op.crearKit({ nombre: 'Debe revertirse' });
      await op.actualizarEstadoEquipo(equipo.id, 'Perdido');
      await assert.rejects(op.asignarEquipoAKit(equipo.id, 2147483647), { code: '23503' });
      await tx.query('ROLLBACK');
    } finally { await tx.query('ROLLBACK'); tx.release(); }
    assert.deepEqual(await registros(db, ['kits', 'equipos', 'log_autorizaciones']), antes);
  });
}));
