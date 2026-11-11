'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { conBaseTemporal } = require('./helpers/postgres');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearApp } = require('../app');

test('API HTTP RF12 con PostgreSQL real', async t => conBaseTemporal(async pool => {
  let servidor;
  try {
    const op = crearOperacionRepository(pool);
    servidor = crearApp(pool).listen(0, '127.0.0.1');
    await once(servidor, 'listening');
    const base = `http://127.0.0.1:${servidor.address().port}/api`;
    async function http(ruta, method = 'GET', body, status = 200) {
      const r = await fetch(base + ruta, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const datos = await r.json();
      assert.equal(r.status, status, `${method} ${ruta}: ${JSON.stringify(datos)}`);
      return datos;
    }
    let evento, asignacion;
    await t.test('lecturas vacías, inexistentes y validación HTTP', async () => {
      assert.deepEqual(await http('/eventos'), []);
      await http('/eventos/no-uuid', 'GET', undefined, 400);
      await http(`/eventos/${randomUUID()}`, 'GET', undefined, 404);
      await http(`/eventos/${randomUUID()}/asignaciones`, 'GET', undefined, 404);
      await http(`/eventos/${randomUUID()}/liquidacion`, 'GET', undefined, 404);
      await http('/ruta-desconocida', 'GET', undefined, 404);
    });
    await t.test('evento real, persona, rol y porcentaje copiado', async () => {
      evento = await op.crearEvento({ nombre: 'Evento HTTP test', montoTotalEvento: 10001 });
      const persona = await op.crearPersona({ nombre: 'Persona HTTP test' });
      const rol = await op.crearRol({ nombre: 'Rol HTTP test' });
      await op.agregarValorRol({ rolId: rol.id, porcentajeCentesimas: 1250, vigenteDesde: '2020-01-01' });
      asignacion = await op.asignar({ eventoId: evento.id, personaId: persona.id, rolId: rol.id });
      evento = await http(`/eventos/${evento.id}`);
      assert.equal((await http('/eventos')).length, 1);
      assert.equal((await http('/personas'))[0].disponible, false);
      assert.equal((await http('/roles'))[0].id, rol.id);
      const filas = await http(`/eventos/${evento.id}/asignaciones`);
      assert.equal(filas[0].porcentaje_centesimas, 1250);
      assert.equal(filas[0].nombre_persona, persona.nombre);
      await http(`/eventos/${evento.id}/liquidacion`, 'GET', undefined, 404);
    });
    const ruta = () => `/eventos/${evento.id}`;
    await t.test('validaciones, edición individual y conflicto de versión', async () => {
      await http(`${ruta()}/liquidacion/previsualizacion`, 'POST', { versionEvento: evento.version }, 409);
      await http(`${ruta()}/liquidacion`, 'POST', { versionEvento: evento.version }, 409);
      await http(`${ruta()}/estado`, 'PATCH', { estado: 'en_curso' }, 400);
      await http(`${ruta()}/estado`, 'PATCH', { versionEvento: evento.version, estado: 'otro' }, 400);
      await http(`${ruta()}/asignaciones/porcentajes`, 'PATCH', { versionEvento: evento.version, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 10001 }] }, 400);
      await http(`${ruta()}/asignaciones/porcentajes`, 'PATCH', { versionEvento: evento.version, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 1.25 }] }, 400);
      const r = await http(`${ruta()}/asignaciones/porcentajes`, 'PATCH', { versionEvento: evento.version, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 3333 }] });
      await http(`${ruta()}/estado`, 'PATCH', { versionEvento: evento.version, estado: 'en_curso' }, 409);
      evento.version = r.versionEvento;
      await http(`${ruta()}/asignaciones/porcentajes`, 'PATCH', { versionEvento: evento.version, cambios: [{ asignacionId: randomUUID(), porcentajeCentesimas: 0 }] }, 404);
      const respuesta = await fetch(base + ruta() + '/estado', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{' });
      assert.equal(respuesta.status, 400);
    });
    await t.test('finalización libera personal y conserva asignaciones', async () => {
      await http(`${ruta()}/estado`, 'PATCH', { versionEvento: evento.version, estado: 'finalizado' }, 409);
      evento = await http(`${ruta()}/estado`, 'PATCH', { versionEvento: evento.version, estado: 'en_curso' });
      evento = await http(`${ruta()}/estado`, 'PATCH', { versionEvento: evento.version, estado: 'finalizado' });
      assert.ok(evento.finalizado_en);
      assert.equal((await http('/personas'))[0].disponible, true);
      assert.equal((await http(`${ruta()}/asignaciones`)).length, 1);
    });
    let guardada;
    await t.test('previsualización, rechazo de confirmación obsoleta y recálculo de importes', async () => {
      const preview = await http(`${ruta()}/liquidacion/previsualizacion`, 'POST', { versionEvento: evento.version });
      assert.equal(preview.totalDistribuido, 3333);
      const cambio = await http(`${ruta()}/asignaciones/porcentajes`, 'PATCH', { versionEvento: evento.version, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 5000 }] });
      evento.version = cambio.versionEvento;
      await http(`${ruta()}/liquidacion`, 'POST', { versionEvento: preview.versionEvento }, 409);
      const actual = await http(`${ruta()}/liquidacion/previsualizacion`, 'POST', { versionEvento: evento.version });
      assert.equal(actual.totalDistribuido, 5001);
      guardada = await http(`${ruta()}/liquidacion`, 'POST', { versionEvento: actual.versionEvento, totalDistribuido: 1, detalles: [{ montoCalculado: 1 }] }, 201);
      assert.equal(guardada.totalDistribuido, 5001);
      assert.equal(guardada.detalles[0].porcentajeAplicado, 50);
    });
    await t.test('recarga histórica, segunda liquidación y datos congelados', async () => {
      assert.deepEqual(await http(`${ruta()}/liquidacion`), guardada);
      evento = await http(ruta());
      await http(`${ruta()}/liquidacion`, 'POST', { versionEvento: evento.version }, 409);
      await http(`${ruta()}/asignaciones/porcentajes`, 'PATCH', { versionEvento: evento.version, cambios: [{ asignacionId: asignacion.id, porcentajeCentesimas: 0 }] }, 409);
      await http(`${ruta()}/estado`, 'PATCH', { versionEvento: evento.version, estado: 'pendiente' }, 409);
    });
    await t.test('error inesperado devuelve 500 sin detalles sensibles', async () => {
      await pool.query('ALTER TABLE evento RENAME TO evento_oculto_test');
      try {
        assert.deepEqual(await http('/eventos', 'GET', undefined, 500), { error: 'Error interno del servidor' });
      } finally { await pool.query('ALTER TABLE evento_oculto_test RENAME TO evento'); }
    });
  } finally {
    if (servidor) await new Promise(resolve => servidor.close(resolve));
  }
}));
