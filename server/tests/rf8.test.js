'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const {
  crearAuspiciadorRepository, validarMonto, validarNombre, validarDescripcion,
} = require('../repositories/auspiciadorRepository');

test('RF8 rechaza montos inválidos sin consultar PostgreSQL', async () => {
  for (const monto of [0, -1, 2.5, '1000', null, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validarMonto(monto), /entero positivo/);
  }
  assert.equal(validarMonto(1), 1);
  assert.equal(validarMonto(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
  assert.throws(() => validarNombre('   '), /nombre/i);
  assert.equal(validarNombre('  Empresa  '), 'Empresa');
  assert.equal(validarDescripcion(undefined), null);
  assert.throws(() => validarDescripcion('  '), /descripción/i);
});

test('RF8 crea un auspiciador con consulta parametrizada', async () => {
  let ejecutada;
  const db = { query: async (sql, args) => {
    ejecutada = { sql, args };
    return { rows: [{ id: args[0], nombre: args[1] }] };
  } };
  const resultado = await crearAuspiciadorRepository(db).crearAuspiciador({ nombre: '  Auspiciador  ' });
  assert.equal(resultado.nombre, 'Auspiciador');
  assert.match(resultado.id, /^[0-9a-f-]{36}$/);
  assert.match(ejecutada.sql, /INSERT INTO auspiciador/);
  assert.equal(ejecutada.args[1], 'Auspiciador');
});

test('RF8 registra canje vinculado a auspiciador y evento, sin modificar montos de RF5/12', async () => {
  const eventoId = randomUUID();
  const auspiciadorId = randomUUID();
  const llamadas = [];
  const db = { query: async (sql, args) => {
    llamadas.push({ sql, args });
    if (sql.includes('INSERT INTO canje_auspiciador')) {
      return { rows: [{
        id: args[0], evento_id: args[1], auspiciador_id: args[2],
        descripcion: args[3], monto_estimado_clp: String(args[4]), registrado_en: new Date(),
      }] };
    }
    if (sql.includes('SELECT nombre FROM auspiciador')) return { rows: [{ nombre: 'Empresa A' }] };
    throw new Error('Consulta inesperada');
  } };
  const canje = await crearAuspiciadorRepository(db).registrarCanje({
    eventoId, auspiciadorId, descripcion: '  Servicios  ', montoEstimadoClp: 25000,
  });
  assert.equal(canje.montoEstimadoClp, 25000);
  assert.equal(canje.auspiciadorNombre, 'Empresa A');
  assert.equal(canje.descripcion, 'Servicios');
  assert.equal(llamadas[0].args[4], 25000);
  assert.ok(!llamadas.some(c => /UPDATE\s+evento/i.test(c.sql)));
});

test('RF8 consulta el total valorizado sin contar ingresos monetarios', async () => {
  const eventoId = randomUUID();
  const auspiciadorId = randomUUID();
  const db = { query: async sql => {
    if (sql.includes('SELECT id FROM evento')) return { rowCount: 1 };
    if (sql.includes('FROM canje_auspiciador c')) return { rows: [
      { id: randomUUID(), evento_id: eventoId, auspiciador_id: auspiciadorId, auspiciador_nombre: 'A', descripcion: null, monto_estimado_clp: '10000' },
      { id: randomUUID(), evento_id: eventoId, auspiciador_id: auspiciadorId, auspiciador_nombre: 'A', descripcion: null, monto_estimado_clp: '5000' },
    ] };
    throw new Error('Consulta inesperada');
  } };
  const resultado = await crearAuspiciadorRepository(db).listarCanjesEvento(eventoId);
  assert.equal(resultado.totalEstimadoClp, 15000);
  assert.equal(resultado.canjes.length, 2);
});

test('RF8 devuelve 404 si el evento no existe', async () => {
  const db = { query: async () => ({ rowCount: 0, rows: [] }) };
  const repo = crearAuspiciadorRepository(db);
  await assert.rejects(repo.listarCanjesEvento(randomUUID()), { status: 404 });
  await assert.rejects(repo.registrarCanje({ eventoId: randomUUID(), auspiciadorId: randomUUID(), montoEstimadoClp: 1 }), { status: 404 });
});
