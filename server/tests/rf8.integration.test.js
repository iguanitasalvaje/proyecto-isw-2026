'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { conBaseTemporal } = require('./helpers/postgres');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearAuspiciadorRepository } = require('../repositories/auspiciadorRepository');
const { crearApp } = require('../app');

test('RF8: integración PostgreSQL y endpoints en esquema temporal', async () => {
  // Prueba explícita y aislada. Jamás ejecutar contra DATABASE_URL de producción.
  assert.ok(process.env.TEST_DATABASE_URL, 'Configura TEST_DATABASE_URL de una base de pruebas');
  assert.notEqual(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL,
    'TEST_DATABASE_URL no puede ser igual a DATABASE_URL');
  return conBaseTemporal(async db => {
    const op = crearOperacionRepository(db);
    const repo = crearAuspiciadorRepository(db);
    const evento = await op.crearEvento({ nombre: 'Partido prueba RF8', precioBase: 350000 });
    const otroEvento = await op.crearEvento({ nombre: 'Otro partido RF8', precioBase: 150000 });
    const inicial = await repo.listarCanjesEvento(evento.id);
    assert.deepEqual(inicial, { eventoId: evento.id, canjes: [], totalEstimadoClp: 0 });

    const auspiciante = await repo.crearAuspiciador({ nombre: 'Empresa de prueba' });
    await assert.rejects(repo.crearAuspiciador({ nombre: ' empresa DE PRUEBA ' }), { code: '23505' });
    const canje = await repo.registrarCanje({ eventoId: evento.id, auspiciadorId: auspiciante.id,
      descripcion: 'Servicios de transporte', montoEstimadoClp: 25000 });
    assert.equal(canje.montoEstimadoClp, 25000);
    await repo.registrarCanje({ eventoId: evento.id, auspiciadorId: auspiciante.id, montoEstimadoClp: 15000 });
    await repo.registrarCanje({ eventoId: otroEvento.id, auspiciadorId: auspiciante.id, montoEstimadoClp: 3000 });
    assert.equal((await repo.listarCanjesEvento(evento.id)).totalEstimadoClp, 40000);
    assert.equal((await repo.listarCanjesEvento(otroEvento.id)).totalEstimadoClp, 3000);
    assert.equal((await op.obtenerEvento(evento.id)).monto_total, 350000);
    await assert.rejects(repo.registrarCanje({ eventoId: evento.id, auspiciadorId: randomUUID(), montoEstimadoClp: 1 }), { status: 404 });
    await assert.rejects(db.query(`INSERT INTO canje_auspiciador
      (id, evento_id, auspiciador_id, monto_estimado_clp) VALUES ($1, $2, $3, 0)`,
      [randomUUID(), evento.id, auspiciante.id]), { code: '23514' });

    const servidor = crearApp(db).listen(0, '127.0.0.1');
    await once(servidor, 'listening');
    const base = `http://127.0.0.1:${servidor.address().port}/api`;
    try {
      const listado = await fetch(`${base}/eventos/${evento.id}/canjes`);
      assert.equal(listado.status, 200);
      assert.equal((await listado.json()).totalEstimadoClp, 40000);
      const invalido = await fetch(`${base}/eventos/${evento.id}/canjes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auspiciadorId: auspiciante.id, montoEstimadoClp: '1000' }),
      });
      assert.equal(invalido.status, 400);
      const creado = await fetch(`${base}/eventos/${evento.id}/canjes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auspiciadorId: auspiciante.id, montoEstimadoClp: 2000 }),
      });
      assert.equal(creado.status, 201);
      assert.equal((await creado.json()).montoEstimadoClp, 2000);
      const final = await fetch(`${base}/eventos/${evento.id}/canjes`);
      assert.equal((await final.json()).totalEstimadoClp, 42000);
    } finally {
      await new Promise(resolve => servidor.close(resolve));
    }
  });
});
