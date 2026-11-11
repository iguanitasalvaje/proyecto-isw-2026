'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../app');

async function conServidorSimulado(trabajo) {
  const equipo = { id: 1, kitId: 7 };
  const consultas = [];
  const pool = {
    async query(sql, valores) {
      assert.match(sql, /UPDATE equipos\s+SET "kitId"/);
      assert.equal(valores[1], equipo.id);
      consultas.push({ sql, valores });
      equipo.kitId = valores[0];
      return { rows: [{ ...equipo }], rowCount: 1 };
    },
  };
  const servidor = crearApp(pool).listen(0, '127.0.0.1');
  try {
    await once(servidor, 'listening');
    async function solicitar(body) {
      const respuesta = await fetch(`http://127.0.0.1:${servidor.address().port}/api/inventario/equipos/1/kit`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: respuesta.status, datos: await respuesta.json() };
    }
    await trabajo({ equipo, consultas, solicitar });
  } finally { await new Promise(resolve => servidor.close(resolve)); }
}

test('HTTP Inventario: asocia un entero positivo sin PostgreSQL', async () => conServidorSimulado(async ({ equipo, consultas, solicitar }) => {
  const respuesta = await solicitar({ kitId: 12 });
  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.datos.kitId, 12);
  assert.equal(equipo.kitId, 12);
  assert.equal(consultas.length, 1);
}));

test('HTTP Inventario: conserva compatibilidad con identificadores enteros como texto', async () => conServidorSimulado(async ({ equipo, solicitar }) => {
  const respuesta = await solicitar({ kitId: '12' });
  assert.equal(respuesta.status, 200);
  assert.equal(equipo.kitId, 12);
}));

test('HTTP Inventario: solo null explícito desasigna', async () => conServidorSimulado(async ({ equipo, consultas, solicitar }) => {
  const respuesta = await solicitar({ kitId: null });
  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.datos.kitId, null);
  assert.equal(equipo.kitId, null);
  assert.equal(consultas.length, 1);
}));

const invalidos = [
  ['sin cuerpo', undefined],
  ['propiedad ausente', {}],
  ['cero', { kitId: 0 }],
  ['false', { kitId: false }],
  ['true', { kitId: true }],
  ['cadena vacía', { kitId: '' }],
  ['espacios', { kitId: ' ' }],
  ['negativo', { kitId: -1 }],
  ['negativo como texto', { kitId: '-1' }],
  ['decimal', { kitId: 1.5 }],
  ['decimal como texto', { kitId: '1.5' }],
  ['texto no numérico', { kitId: 'abc' }],
  ['UUID de RF5', { kitId: '1c049076-b866-411e-a34e-3c9e8dfcb001' }],
  ['objeto', { kitId: {} }],
  ['arreglo', { kitId: [] }],
  ['fuera del rango INTEGER', { kitId: 2147483648 }],
];
for (const [nombre, body] of invalidos) {
  test(`HTTP Inventario: ${nombre} devuelve 400 y conserva la asociación`, async t => {
    t.mock.method(console, 'error', () => {});
    await conServidorSimulado(async ({ equipo, consultas, solicitar }) => {
      const antes = { ...equipo };
      const respuesta = await solicitar(body);
      assert.equal(respuesta.status, 400);
      assert.match(respuesta.datos.error, /Identificador de Inventario inválido/);
      assert.deepEqual(equipo, antes);
      assert.equal(consultas.length, 0, 'Una solicitud inválida no debe ejecutar SQL');
    });
  });
}
