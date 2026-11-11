'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { conBaseTemporal } = require('./helpers/postgres');
const { crearApp } = require('../app');
const { crearOperacionRepository } = require('../repositories/operacionRepository');

test('RF5 API HTTP con PostgreSQL real', async t => conBaseTemporal(async db => {
  const servidor = crearApp(db).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}/api`;
  async function http(ruta, method = 'GET', body, status = 200) {
    const respuesta = await fetch(base + ruta, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const datos = await respuesta.json();
    assert.equal(respuesta.status, status, `${method} ${ruta}: ${JSON.stringify(datos)}`);
    return datos;
  }
  try {
    const op = crearOperacionRepository(db);
    const e = await op.crearEvento({ nombre: 'HTTP RF5 test', montoTotalEvento: 500000 });
    const otro = await op.crearEvento({ nombre: 'HTTP otro test', montoTotalEvento: 100 });
    const ruta = `/eventos/${e.id}`;
    let normal, premium, detalle;
    await t.test('lecturas vacías, validaciones y contrato compartido', async () => {
      assert.deepEqual(await http('/kits'), []);
      assert.equal(await http('/configuracion/premium'), null);
      assert.deepEqual(await http(''), { status: 'ok', mensaje: 'Servidor del proyecto funcionando correctamente' });
      const cors = await fetch(base, { headers: { Origin: 'http://localhost:5173' } });
      assert.equal(cors.headers.get('access-control-allow-origin'), '*');
      await http('/kits', 'POST', { nombre: ' ', premium: false }, 400);
      await http('/kits', 'POST', { nombre: 'Inválido', premium: 'true' }, 400);
      await http('/configuracion/premium', 'POST', { porcentajeCentesimas: 1.5, vigenteDesde: '2020-01-01' }, 400);
      await http('/configuracion/premium', 'POST', { porcentajeCentesimas: 1000, vigenteDesde: 'no-fecha' }, 400);
      await http(`/eventos/${randomUUID()}/economia`, 'GET', undefined, 404);
      await http('/eventos/no-uuid/economia', 'GET', undefined, 400);
    });
    await t.test('crea kits físicos y muestra normal sin recargo', async () => {
      normal = await http('/kits', 'POST', { nombre: 'Normal HTTP test', premium: false }, 201);
      premium = await http('/kits', 'POST', { nombre: 'Premium HTTP test', premium: true }, 201);
      await http('/kits', 'POST', { nombre: ' normal HTTP test ', premium: false }, 409);
      detalle = await http(`${ruta}/economia`);
      await http(`${ruta}/kit`, 'PUT', { kitId: normal.id }, 400);
      await http(`${ruta}/kit`, 'PUT', { kitId: randomUUID(), versionEvento: detalle.versionEvento }, 404);
      await http(`${ruta}/kit`, 'PUT', { kitId: 'no-uuid', versionEvento: detalle.versionEvento }, 400);
      detalle = await http(`${ruta}/kit`, 'PUT', { kitId: normal.id, versionEvento: detalle.versionEvento });
      assert.equal(detalle.recargo, 0); assert.equal(detalle.montoTotal, 500000);
    });
    await t.test('falta de configuración, versión obsoleta y recálculo exclusivo del backend', async () => {
      await http(`${ruta}/kit`, 'PUT', { kitId: premium.id, versionEvento: detalle.versionEvento }, 409);
      const config = await http('/configuracion/premium', 'POST', { porcentajeCentesimas: 1250, vigenteDesde: '2020-01-01T00:00:00Z' }, 201);
      assert.equal((await http('/configuracion/premium')).id, config.id);
      await http(`${ruta}/kit`, 'PUT', { kitId: premium.id, versionEvento: detalle.versionEvento - 1 }, 409);
      detalle = await http(`${ruta}/kit`, 'PUT', { kitId: premium.id, versionEvento: detalle.versionEvento, recargo: 1, porcentajeCentesimas: 9999, montoTotal: 1 });
      assert.equal(detalle.recargo, 62500); assert.equal(detalle.montoTotal, 562500);
      assert.equal(detalle.porcentajeCentesimas, 1250);
      assert.equal((await http(`/eventos/${e.id}`)).monto_total, detalle.montoTotal);
      const ocupado = (await http('/kits')).find(k => k.id === premium.id);
      assert.equal(ocupado.disponible, false); assert.equal(ocupado.evento_ocupante_id, e.id);
      await http(`/eventos/${otro.id}/kit`, 'PUT', { kitId: premium.id, versionEvento: otro.version }, 409);
    });
    await t.test('reenvío idempotente, precio base y desasignación', async () => {
      assert.deepEqual(await http(`${ruta}/kit`, 'PUT', { kitId: premium.id, versionEvento: detalle.versionEvento }), detalle);
      detalle = await http(`${ruta}/precio-base`, 'PATCH', { precioBase: 10001, versionEvento: detalle.versionEvento });
      assert.equal(detalle.recargo, 1250); assert.equal(detalle.montoTotal, 11251);
      await http(`${ruta}/precio-base`, 'PATCH', { precioBase: 0, versionEvento: detalle.versionEvento }, 400);
      detalle = await http(`${ruta}/kit`, 'PUT', { kitId: null, versionEvento: detalle.versionEvento });
      assert.equal(detalle.montoTotal, 10001); assert.equal(detalle.kit, null);
      assert.equal((await http('/kits')).find(k => k.id === premium.id).disponible, true);
    });
    await t.test('finalización libera y preserva kit, bloqueando edición económica', async () => {
      detalle = await http(`${ruta}/kit`, 'PUT', { kitId: premium.id, versionEvento: detalle.versionEvento });
      let estado = await http(`${ruta}/estado`, 'PATCH', { estado: 'en_curso', versionEvento: detalle.versionEvento });
      estado = await http(`${ruta}/estado`, 'PATCH', { estado: 'finalizado', versionEvento: estado.version });
      const historico = await http(`${ruta}/economia`);
      assert.equal(historico.kit.id, premium.id);
      assert.equal(historico.estado, 'finalizado');
      assert.equal((await http('/kits')).find(k => k.id === premium.id).disponible, true);
      for (const kitId of [null, normal.id, premium.id]) await http(`${ruta}/kit`, 'PUT', { kitId, versionEvento: estado.version }, 409);
      await http(`${ruta}/precio-base`, 'PATCH', { precioBase: 1, versionEvento: estado.version }, 409);
      assert.deepEqual(await http(`${ruta}/economia`), historico);
    });
  } finally { await new Promise(resolve => servidor.close(resolve)); }
}));
