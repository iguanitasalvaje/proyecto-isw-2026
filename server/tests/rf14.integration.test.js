'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { conBaseTemporal } = require('./helpers/postgres');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearKitRepository } = require('../repositories/kitRepository');
const { crearAuspiciadorRepository } = require('../repositories/auspiciadorRepository');
const { crearReporteFinancieroRepository } = require('../repositories/reporteFinancieroRepository');
const { crearApp } = require('../app');

test('RF14 consulta resultados reales y filtros sin duplicar recargo Premium', async () => {
  // conBaseTemporal verifica una DB de pruebas diferente de producción y limpia el esquema.
  return conBaseTemporal(async db => {
    const op = crearOperacionRepository(db);
    const kitRepo = crearKitRepository(db);
    const aus = crearAuspiciadorRepository(db);
    const reporte = crearReporteFinancieroRepository(db);

    const evento = await op.crearEvento({ nombre: 'Partido RF14', cliente: 'Empresa A',
      fecha: '2026-11-10T15:00:00Z', precioBase: 100000 });
    await op.crearEvento({ nombre: 'Otro partido', cliente: 'Empresa B',
      fecha: '2026-10-10T15:00:00Z', precioBase: 200000 });
    const kit = await kitRepo.crearKit({ nombre: 'Premium RF14', premium: true });
    await kitRepo.configurarPremium({ porcentajeCentesimas: 1000, vigenteDesde: '2020-01-01T00:00:00Z' });
    await kitRepo.asignarKit({ eventoId: evento.id, kitId: kit.id });
    const auspiciador = await aus.crearAuspiciador({ nombre: 'Auspiciador RF14' });
    await aus.registrarCanje({ eventoId: evento.id, auspiciadorId: auspiciador.id,
      montoEstimadoClp: 20000, descripcion: 'Alimentación' });
    await reporte.registrarGasto({ eventoId: evento.id, descripcion: 'Combustible', montoClp: 5000 });
    await db.query(`INSERT INTO liquidacion(id, evento_id, monto_evento_aplicado, version_evento, total_distribuido)
      VALUES ($1,$2,110000,1,30000)`, [randomUUID(), evento.id]);
    const informe = await reporte.obtenerDashboard({ cliente: 'Empresa A', periodo: 'mes', anio: '2026', mes: '11' });
    assert.equal(informe.eventos.length, 1);
    assert.equal(informe.indicadores.montoTotalClp, 110000);
    assert.equal(informe.indicadores.recargosKitIncluidosClp, 10000);
    assert.equal(informe.indicadores.canjesEstimadosClp, 20000);
    assert.equal(informe.indicadores.gastosOperativosClp, 5000);
    assert.equal(informe.indicadores.liquidacionesRegistradasClp, 30000);
    assert.equal(informe.indicadores.resultadoEstimadoClp, 95000);
    assert.equal((await reporte.obtenerDashboard({ periodo: 'temporada', anio: '2026' })).eventos.length, 2);
    assert.equal((await reporte.obtenerDashboard({ periodo: 'mes', anio: '2026', mes: '9' })).eventos.length, 0);

    const servidor = crearApp(db).listen(0, '127.0.0.1');
    await once(servidor, 'listening');
    const base = `http://127.0.0.1:${servidor.address().port}/api`;
    try {
      const respuesta = await fetch(`${base}/reportes/financiero?cliente=Empresa%20A&periodo=mes&anio=2026&mes=11`);
      assert.equal(respuesta.status, 200);
      assert.equal((await respuesta.json()).indicadores.resultadoEstimadoClp, 95000);
      const invalida = await fetch(`${base}/reportes/financiero?periodo=mes&anio=2026&mes=15`);
      assert.equal(invalida.status, 400);
      const gastos = await fetch(`${base}/eventos/${evento.id}/gastos`);
      assert.equal(gastos.status, 200);
      assert.equal((await gastos.json())[0].montoClp, 5000);
    } finally { await new Promise(resolve => servidor.close(resolve)); }
  });
});
