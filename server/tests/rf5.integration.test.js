'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { conBaseTemporal } = require('./helpers/postgres');
const { migrar } = require('../db/migrate');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearKitRepository } = require('../repositories/kitRepository');
const { crearLiquidacionRepository } = require('../repositories/liquidacionRepository');

test('003 conserva eventos y liquidaciones existentes sin recalcular', async () => conBaseTemporal(async db => {
  for (const nombre of ['001_rf12.sql', '002_rf12_porcentaje_individual.sql']) {
    await db.query(await readFile(path.join(__dirname, '../db/migrations', nombre), 'utf8'));
  }
  const op = crearOperacionRepository(db);
  const liq = crearLiquidacionRepository(db);
  const eventoId = randomUUID();
  await db.query("INSERT INTO evento(id,nombre,monto_total) VALUES ($1,'Histórico test',10001)", [eventoId]);
  const persona = await op.crearPersona({ nombre: 'Persona histórica test' });
  const rol = await op.crearRol({ nombre: 'Rol histórico test' });
  await op.asignar({ eventoId, personaId: persona.id, rolId: rol.id, porcentajeCentesimas: 5000 });
  await db.query("UPDATE evento SET estado='finalizado', finalizado_en=now(), version=version+2 WHERE id=$1", [eventoId]);
  const guardada = await liq.registrar(eventoId);
  const antes = (await db.query('SELECT * FROM evento')).rows[0];
  await db.query(await readFile(path.join(__dirname, '../db/migrations/003_rf5_kit_premium.sql'), 'utf8'));
  const despues = (await db.query('SELECT * FROM evento')).rows[0];
  assert.deepEqual(despues, { ...antes, precio_base: antes.monto_total });
  assert.deepEqual(await liq.obtener(eventoId), guardada);
  assert.equal((await crearKitRepository(db).obtenerDetalle(eventoId)).recargo, 0);
  for (const tabla of ['kit', 'configuracion_recargo', 'asignacion_kit_evento']) assert.equal((await db.query(`SELECT * FROM ${tabla}`)).rowCount, 0);
}, { migraciones: false }));

test('RF5 persistencia PostgreSQL y compatibilidad RF12', async t => conBaseTemporal(async db => {
  const op = crearOperacionRepository(db);
  const kits = crearKitRepository(db);
  const liq = crearLiquidacionRepository(db);
  const normal = await kits.crearKit({ nombre: 'Normal test', premium: false });
  const premium = await kits.crearKit({ nombre: 'Premium test', premium: true });
  const otroPremium = await kits.crearKit({ nombre: 'Otro Premium test', premium: true });
  const e = await op.crearEvento({ nombre: 'RF5 test', precioBase: 500000 });
  const segundo = await op.crearEvento({ nombre: 'Segundo test', montoTotalEvento: 200000 });
  const guardar = kitId => kits.asignarKit({ eventoId: e.id, kitId });
  const detalle = () => kits.obtenerDetalle(e.id);
  await t.test('migración idempotente y eventos nuevos con precio base', async () => {
    await migrar(db);
    assert.equal((await db.query('SELECT * FROM schema_migrations')).rowCount, 3);
    assert.equal(e.precio_base, 500000);
    assert.equal(e.monto_total, 500000);
  });
  await t.test('kit normal no necesita configuración ni genera recargo', async () => {
    const r = await guardar(normal.id);
    assert.equal(r.recargo, 0); assert.equal(r.montoTotal, r.precioBase);
    assert.equal(r.kit.premium, false);
    assert.equal((await kits.listarKits()).find(k => k.id === normal.id).disponible, false);
  });
  await t.test('sin configuración vigente se rechaza Premium conservando kit anterior', async () => {
    const antes = await detalle();
    await kits.configurarPremium({ porcentajeCentesimas: 9000, vigenteDesde: '9999-01-01T00:00:00Z' });
    await assert.rejects(guardar(premium.id), { status: 409 });
    assert.deepEqual(await detalle(), antes);
    assert.equal(await kits.obtenerConfiguracion(), null);
  });
  let config;
  await t.test('Premium usa porcentaje persistido vigente y total base más recargo', async () => {
    config = await kits.configurarPremium({ porcentajeCentesimas: 1025, vigenteDesde: '2020-01-01T00:00:00Z' });
    const r = await guardar(premium.id);
    assert.equal(r.porcentajeCentesimas, 1025); assert.equal(r.recargo, 51250);
    assert.equal(r.montoTotal, 551250); assert.equal(r.kit.configuracionId, config.id);
    assert.equal((await op.obtenerEvento(e.id)).monto_total, r.precioBase + r.recargo);
    assert.equal((await kits.listarKits()).find(k => k.id === normal.id).disponible, true);
  });
  await t.test('cambio de configuración y reenvío del mismo kit conservan instantánea y versión', async () => {
    const antes = await detalle();
    await kits.configurarPremium({ porcentajeCentesimas: 2000, vigenteDesde: '2021-01-01T00:00:00Z' });
    assert.deepEqual(await detalle(), antes);
    assert.deepEqual(await guardar(premium.id), antes);
    assert.equal((await kits.obtenerConfiguracion()).porcentaje_centesimas, 2000);
  });
  await t.test('Premium a Premium recalcula sin acumular y Premium a normal quita recargo', async () => {
    let r = await guardar(otroPremium.id);
    assert.equal(r.recargo, 100000); assert.equal(r.montoTotal, 600000);
    r = await guardar(normal.id);
    assert.equal(r.recargo, 0); assert.equal(r.montoTotal, 500000);
  });
  await t.test('desasignación elimina recargo y libera kit, con reenvío idempotente', async () => {
    await guardar(premium.id);
    const r = await guardar(null);
    assert.equal(r.kit, null); assert.equal(r.recargo, 0); assert.equal(r.montoTotal, 500000);
    assert.deepEqual(await guardar(null), r);
    assert.equal((await kits.listarKits()).find(k => k.id === premium.id).disponible, true);
  });
  await t.test('ocupación física exclusiva y reversiones ante kit ajeno o inexistente', async () => {
    await guardar(premium.id);
    await assert.rejects(kits.asignarKit({ eventoId: segundo.id, kitId: premium.id }), { status: 409 });
    const antes = await detalle();
    await assert.rejects(guardar(randomUUID()), { status: 404 });
    assert.deepEqual(await detalle(), antes);
  });
  await t.test('concurrencia de dos eventos por el mismo kit permite solo uno', async () => {
    const tercero = await op.crearEvento({ nombre: 'Tercero test', montoTotalEvento: 100 });
    const resultados = await Promise.allSettled([
      kits.asignarKit({ eventoId: segundo.id, kitId: normal.id }),
      kits.asignarKit({ eventoId: tercero.id, kitId: normal.id }),
    ]);
    assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(resultados.find(r => r.status === 'rejected').reason.status, 409);
  });
  await t.test('precio base recalcula con porcentaje aplicado, sin sobrescribir total manualmente', async () => {
    await kits.configurarPremium({ porcentajeCentesimas: 3000, vigenteDesde: '2022-01-01T00:00:00Z' });
    await assert.rejects(op.actualizarMonto({ eventoId: e.id, montoTotalEvento: 1 }), { status: 409 });
    const antes = await detalle();
    await assert.rejects(kits.actualizarPrecioBase({ eventoId: e.id, precioBase: 10001, versionEvento: antes.versionEvento - 1 }), { status: 409 });
    const r = await kits.actualizarPrecioBase({ eventoId: e.id, precioBase: 10001, versionEvento: antes.versionEvento });
    assert.equal(r.porcentajeCentesimas, 2000); assert.equal(r.recargo, 2000); assert.equal(r.montoTotal, 12001);
  });
  await t.test('fallo real revierte asignación, total y versión en una sola transacción', async () => {
    const antes = await detalle();
    await db.query(`CREATE FUNCTION fallo_rf5_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo test'; END; $$`);
    await db.query('CREATE TRIGGER fallo_rf5_test AFTER UPDATE ON evento FOR EACH ROW EXECUTE FUNCTION fallo_rf5_test()');
    try { await assert.rejects(guardar(otroPremium.id), { code: 'P0001' }); }
    finally { await db.query('DROP TRIGGER fallo_rf5_test ON evento'); }
    assert.deepEqual(await detalle(), antes);
    assert.equal((await kits.listarKits()).find(k => k.id === otroPremium.id).disponible, true);
  });
  await t.test('finalización libera kit sin borrar histórico y bloquea todas sus mutaciones', async () => {
    await op.cambiarEstado({ eventoId: e.id, estado: 'en_curso' });
    assert.equal((await kits.listarKits()).find(k => k.id === premium.id).disponible, false);
    const p = await op.crearPersona({ nombre: 'Persona RF5 test' });
    const rol = await op.crearRol({ nombre: 'Rol RF5 test' });
    await op.asignar({ eventoId: e.id, personaId: p.id, rolId: rol.id, porcentajeCentesimas: 5000 });
    await op.cambiarEstado({ eventoId: e.id, estado: 'finalizado' });
    const antes = await detalle();
    assert.equal((await kits.listarKits()).find(k => k.id === premium.id).disponible, true);
    for (const kitId of [premium.id, otroPremium.id, null]) await assert.rejects(guardar(kitId), { status: 409 });
    await assert.rejects(kits.actualizarPrecioBase({ eventoId: e.id, precioBase: 1 }), { status: 409 });
    await assert.rejects(op.actualizarMonto({ eventoId: e.id, montoTotalEvento: 1 }), { status: 409 });
    await kits.configurarPremium({ porcentajeCentesimas: 4000, vigenteDesde: '2023-01-01T00:00:00Z' });
    await db.query("UPDATE kit SET nombre='Renombrado test', premium=false WHERE id=$1", [premium.id]);
    assert.deepEqual(await detalle(), antes);
    await kits.asignarKit({ eventoId: segundo.id, kitId: premium.id });
    assert.deepEqual(await detalle(), antes);
    const preview = await liq.previsualizar(e.id);
    assert.equal(preview.montoTotalEvento, 12001); assert.equal(preview.totalDistribuido, 6001);
    const guardada = await liq.registrar(e.id, preview.versionEvento);
    assert.deepEqual(await liq.obtener(e.id), guardada);
    await assert.rejects(liq.registrar(e.id), { status: 409 });
  });
}));
