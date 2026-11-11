'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearInventarioRepository } = require('../repositories/inventarioRepository');

function sinBase() {
  return crearInventarioRepository({ query() { assert.fail('La entrada inválida no debe consultar PostgreSQL'); } });
}
const equipo = { nombre: 'Equipo de prueba', tipo: 'Cámara', serie: 'SERIE-TEST', valorReposicion: 100 };

test('Inventario rechaza kits sin nombre, nombres largos y descripciones no textuales', async () => {
  const repo = sinBase();
  for (const nombre of ['', ' ', null, 123, 'x'.repeat(101)]) {
    await assert.rejects(repo.crearKit({ nombre }), TypeError);
  }
  for (const descripcion of [123, {}, false, []]) {
    await assert.rejects(repo.crearKit({ nombre: 'Kit de prueba', descripcion }), /Descripción/);
  }
});
test('Inventario exige serie y respeta longitudes del modelo Prisma', async () => {
  const repo = sinBase();
  for (const cambio of [{ serie: null }, { serie: '' }, { serie: ' ' }, { serie: 123 },
    { serie: 'x'.repeat(51) }, { nombre: 'x'.repeat(151) }, { tipo: 'x'.repeat(51) }, { estado: '' }]) {
    await assert.rejects(repo.crearEquipo({ ...equipo, ...cambio }), TypeError);
  }
});
test('Inventario rechaza valores de reposición no finitos, vacíos o negativos', async () => {
  const repo = sinBase();
  for (const valorReposicion of [null, undefined, '', ' ', true, [], {}, 'NaN', 'abc', NaN, Infinity, -Infinity, -1]) {
    await assert.rejects(repo.crearEquipo({ ...equipo, valorReposicion }), /valor de reposición/);
  }
});
test('Inventario mantiene identificadores enteros y rechaza UUID o entradas inválidas', async () => {
  const repo = sinBase();
  for (const id of [0, -1, 1.5, NaN, Infinity, 2147483648, null, undefined, true, '', '1.2', 'uuid', {}]) {
    await assert.rejects(repo.obtenerEquipoPorId(id), /Identificador/);
    await assert.rejects(repo.actualizarEstadoEquipo(id, 'Disponible'), /Identificador/);
    await assert.rejects(repo.asignarEquipoAKit(id, null), /Identificador/);
  }
  for (const kitId of [undefined, 0, -1, 'uuid', false]) {
    await assert.rejects(repo.asignarEquipoAKit(1, kitId), /Identificador/);
  }
});
test('Inventario valida estados antes de consultar PostgreSQL', async () => {
  const repo = sinBase();
  for (const estado of ['', ' ', null, 1, {}]) {
    await assert.rejects(repo.actualizarEstadoEquipo(1, estado), /Estado/);
  }
});
