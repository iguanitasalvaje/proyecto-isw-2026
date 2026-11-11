'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { crearPool } = require('../db/pool');
const { migrar } = require('../db/migrate');
const { conBaseTemporal } = require('./helpers/postgres');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearLiquidacionRepository } = require('../repositories/liquidacionRepository');

test('persistencia RF12 contra PostgreSQL real', async t => conBaseTemporal(async (pool, schema) => {
  const op = crearOperacionRepository(pool);
  const liq = crearLiquidacionRepository(pool);
  await t.test('migraciones idempotentes y base vacía', async () => {
    await migrar(pool);
    assert.equal((await pool.query('SELECT * FROM schema_migrations')).rowCount, 6);
    for (const tabla of ['evento', 'persona', 'rol_evento', 'valor_rol', 'asignacion_evento', 'liquidacion', 'detalle_liquidacion']) {
      assert.equal((await pool.query(`SELECT * FROM ${tabla}`)).rowCount, 0);
    }
  });
  const a = await op.crearEvento({ nombre: 'Test A', montoTotalEvento: 350000 });
  const b = await op.crearEvento({ nombre: 'Test B', montoTotalEvento: 10001 });
  const persona = await op.crearPersona({ nombre: 'Test 1' });
  const otra = await op.crearPersona({ nombre: 'Test 2' });
  const camara = await op.crearRol({ nombre: 'Cámara test' });
  const sonido = await op.crearRol({ nombre: 'Sonido test' });
  await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 1000, vigenteDesde: '2020-01-01' });
  await op.agregarValorRol({ rolId: sonido.id, porcentajeCentesimas: 2000, vigenteDesde: '2020-01-01' });
  const asignacion = await op.asignar({ eventoId: a.id, personaId: persona.id, rolId: camara.id });
  const segunda = await op.asignar({ eventoId: a.id, personaId: otra.id, rolId: sonido.id, porcentajeCentesimas: 2500 });
  const estado = id => op.obtenerEvento(id);
  const finalizar = async id => {
    await op.cambiarEstado({ eventoId: id, estado: 'en_curso' });
    return op.cambiarEstado({ eventoId: id, estado: 'finalizado' });
  };
  await t.test('copia sugerencia y admite porcentaje explícito, independiente de cambios del rol', async () => {
    assert.equal(asignacion.porcentaje_centesimas, 1000);
    assert.equal(segunda.porcentaje_centesimas, 2500);
    await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 1500, vigenteDesde: '2022-01-01' });
    await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 9900, vigenteDesde: '9999-01-01' });
    assert.equal((await op.listarAsignaciones(a.id)).find(r => r.id === asignacion.id).porcentaje_centesimas, 1000);
    const nueva = await op.asignar({ eventoId: b.id, personaId: persona.id, rolId: camara.id });
    assert.equal(nueva.porcentaje_centesimas, 1500);
    await op.desasignar({ eventoId: b.id, asignacionId: nueva.id });
  });
  await t.test('restricciones de monto, referencias y duplicados', async () => {
    await assert.rejects(op.crearEvento({ nombre: 'Inválido', montoTotalEvento: 0 }));
    await assert.rejects(op.crearRol({ nombre: ' cámara test ' }), { code: '23505' });
    await assert.rejects(op.asignar({ eventoId: a.id, personaId: persona.id, rolId: sonido.id }), { code: '23505' });
    await assert.rejects(op.asignar({ eventoId: a.id, personaId: randomUUID(), rolId: sonido.id }), { code: '23503' });
    await assert.rejects(op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 10001, vigenteDesde: '2021-01-01' }));
    await assert.rejects(pool.query('UPDATE asignacion_evento SET porcentaje_centesimas=10001'), { code: '23514' });
  });
  await t.test('cambiar rol conserva porcentaje salvo solicitud explícita de sugerencia', async () => {
    let r = await op.cambiarRol({ eventoId: a.id, asignacionId: asignacion.id, rolId: sonido.id });
    assert.equal(r.porcentaje_centesimas, 1000);
    r = await op.cambiarRol({ eventoId: a.id, asignacionId: asignacion.id, rolId: camara.id, usarSugerencia: true });
    assert.equal(r.porcentaje_centesimas, 1500);
  });
  await t.test('edición atómica, límite 100%, versión obsoleta y asignaciones ajenas', async () => {
    const v = (await estado(a.id)).version;
    await op.editarPorcentajes({ eventoId: a.id, versionEvento: v, cambios: [
      { asignacionId: asignacion.id, porcentajeCentesimas: 7000 }, { asignacionId: segunda.id, porcentajeCentesimas: 3000 }] });
    await assert.rejects(op.editarPorcentajes({ eventoId: a.id, versionEvento: v, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 1 }] }), { status: 409 });
    const antes = await op.listarAsignaciones(a.id);
    await assert.rejects(op.editarPorcentajes({ eventoId: a.id, cambios: [{ asignacionId: segunda.id, porcentajeCentesimas: 3001 }] }), /100%/);
    await assert.rejects(op.editarPorcentajes({ eventoId: a.id, cambios: [
      { asignacionId: asignacion.id, porcentajeCentesimas: 1000 }, { asignacionId: randomUUID(), porcentajeCentesimas: 0 }] }), { status: 404 });
    assert.deepEqual(await op.listarAsignaciones(a.id), antes);
    await op.editarPorcentajes({ eventoId: a.id, cambios: [
      { asignacionId: asignacion.id, porcentajeCentesimas: 1025 }, { asignacionId: segunda.id, porcentajeCentesimas: 2000 }] });
  });
  await t.test('concurrencia serializa cambios y evita sobreasignación', async () => {
    const resultados = await Promise.allSettled([
      op.editarPorcentajes({ eventoId: a.id, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 6000 }] }),
      op.editarPorcentajes({ eventoId: a.id, cambios: [{ asignacionId: segunda.id, porcentajeCentesimas: 6000 }] }),
    ]);
    assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1);
    assert.ok((await op.listarAsignaciones(a.id)).reduce((s, r) => s + r.porcentaje_centesimas, 0) <= 10000);
    await op.editarPorcentajes({ eventoId: a.id, cambios: [
      { asignacionId: asignacion.id, porcentajeCentesimas: 1025 }, { asignacionId: segunda.id, porcentajeCentesimas: 2000 }] });
  });
  await t.test('transiciones, monto congelado y disponibilidad sin borrar historial', async () => {
    await assert.rejects(liq.previsualizar(a.id), { status: 409 });
    await assert.rejects(liq.registrar(a.id), { status: 409 });
    await assert.rejects(op.cambiarEstado({ eventoId: a.id, estado: 'finalizado' }), { status: 409 });
    assert.equal((await op.listarPersonas()).find(p => p.id === persona.id).disponible, false);
    await op.actualizarMonto({ eventoId: a.id, montoTotalEvento: 350000 });
    const fin = await finalizar(a.id);
    assert.ok(fin.finalizado_en);
    assert.equal((await op.listarPersonas()).find(p => p.id === persona.id).disponible, true);
    assert.equal((await op.listarAsignaciones(a.id)).length, 2);
    await assert.rejects(op.cambiarEstado({ eventoId: a.id, estado: 'en_curso' }), { status: 409 });
    await assert.rejects(op.actualizarMonto({ eventoId: a.id, montoTotalEvento: 1 }), { status: 409 });
    await assert.rejects(op.cambiarRol({ eventoId: a.id, asignacionId: asignacion.id, rolId: sonido.id }), { status: 409 });
    await assert.rejects(op.desasignar({ eventoId: a.id, asignacionId: asignacion.id }), { status: 409 });
    await assert.rejects(op.asignar({ eventoId: a.id, personaId: randomUUID(), rolId: sonido.id }), { status: 409 });
    await op.asignar({ eventoId: b.id, personaId: persona.id, rolId: sonido.id });
    assert.equal((await op.listarPersonas()).find(p => p.id === persona.id).disponible, false);
  });
  let registrada;
  await t.test('porcentajes editables tras finalizar, previsualización y persistencia desde otra conexión', async () => {
    await op.editarPorcentajes({ eventoId: a.id, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 1125 }] });
    const preview = await liq.previsualizar(a.id);
    assert.equal(preview.totalDistribuido, 109375);
    registrada = await liq.registrar(a.id, preview.versionEvento);
    const otraConexion = crearPool({ connectionString: process.env.TEST_DATABASE_URL, schema });
    try { assert.deepEqual(await crearLiquidacionRepository(otraConexion).obtener(a.id), registrada); }
    finally { await otraConexion.end(); }
  });
  await t.test('segunda liquidación y edición posterior rechazadas, instantánea histórica estable', async () => {
    await assert.rejects(liq.registrar(a.id), { status: 409 });
    await assert.rejects(op.editarPorcentajes({ eventoId: a.id, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 0 }] }), { status: 409 });
    await pool.query('UPDATE persona SET nombre=$1 WHERE id=$2', ['Nombre cambiado', persona.id]);
    await pool.query('UPDATE rol_evento SET nombre=$1 WHERE id=$2', ['Rol cambiado', camara.id]);
    await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 2500, vigenteDesde: '2023-01-01' });
    assert.deepEqual(await liq.obtener(a.id), registrada);
  });
  await t.test('error real en detalle revierte cabecera, detalles y versión', async () => {
    await op.asignar({ eventoId: b.id, personaId: otra.id, rolId: camara.id });
    await finalizar(b.id);
    const v = (await estado(b.id)).version;
    await pool.query(`CREATE FUNCTION rechazar_detalle_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo de test'; END; $$`);
    await pool.query('CREATE TRIGGER fallo_test AFTER INSERT ON detalle_liquidacion FOR EACH ROW EXECUTE FUNCTION rechazar_detalle_test()');
    try { await assert.rejects(liq.registrar(b.id), { code: 'P0001' }); }
    finally { await pool.query('DROP TRIGGER fallo_test ON detalle_liquidacion'); }
    assert.equal(await liq.obtener(b.id), null);
    assert.equal((await estado(b.id)).version, v);
    const resultados = await Promise.allSettled([liq.registrar(b.id), liq.registrar(b.id)]);
    assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(resultados.find(r => r.status === 'rejected').reason.status, 409);
    assert.equal((await liq.obtener(b.id)).detalles.length, 2);
  });
  await t.test('datos antiguos incompletos y total inválido se revalidan al guardar', async () => {
    const e = await op.crearEvento({ nombre: 'Incompleto test', montoTotalEvento: 100 });
    const as = await op.asignar({ eventoId: e.id, personaId: persona.id, rolId: camara.id, porcentajeCentesimas: 5000 });
    await op.asignar({ eventoId: e.id, personaId: otra.id, rolId: camara.id, porcentajeCentesimas: 5000 });
    await finalizar(e.id);
    await pool.query('UPDATE asignacion_evento SET porcentaje_centesimas=NULL WHERE id=$1', [as.id]);
    await assert.rejects(liq.registrar(e.id), /Porcentaje individual/);
    await pool.query('UPDATE asignacion_evento SET porcentaje_centesimas=5001 WHERE id=$1', [as.id]);
    await assert.rejects(liq.registrar(e.id), /100%/);
    assert.equal(await liq.obtener(e.id), null);
  });
  await t.test('detecta checksum alterado', async () => {
    await pool.query("UPDATE schema_migrations SET checksum='alterado'");
    await assert.rejects(migrar(pool), /Migración aplicada modificada/);
  });
}));
