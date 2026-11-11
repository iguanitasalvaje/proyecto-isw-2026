'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { crearReporteFinancieroRepository, validarFiltros, sumarSeguro } = require('../repositories/reporteFinancieroRepository');

test('RF14 valida filtros de cliente, mes y temporada', () => {
  assert.deepEqual(validarFiltros(), { cliente: null, periodo: 'todos', anio: null, mes: null });
  assert.deepEqual(validarFiltros({ cliente: ' Taller ', periodo: 'mes', anio: '2026', mes: '11' }),
    { cliente: 'Taller', periodo: 'mes', anio: 2026, mes: 11 });
  assert.deepEqual(validarFiltros({ periodo: 'temporada', anio: '2026' }),
    { cliente: null, periodo: 'temporada', anio: 2026, mes: null });
  for (const filtro of [
    { periodo: 'semana' }, { periodo: 'mes', anio: '2026', mes: '13' },
    { periodo: 'mes', anio: 'ayer', mes: '2' }, { periodo: 'temporada', anio: '9999' },
    { cliente: ' '.repeat(2), periodo: 'todos' },
  ]) assert.throws(() => validarFiltros(filtro), TypeError);
});

test('RF14 suma correctamente sin duplicar recargos, canjes ni liquidaciones', async () => {
  const db = {
    async query(sql, args) {
      if (sql.includes('FROM evento e')) {
        assert.deepEqual(args, [null, 2026, 11]);
        assert.match(sql, /FROM canje_auspiciador GROUP BY evento_id/);
        assert.match(sql, /FROM gasto_operativo GROUP BY evento_id/);
        return { rows: [
          { id: randomUUID(), nombre: 'Partido', cliente: 'Cliente A', fecha: new Date(), estado: 'finalizado',
            precio_base: '100000', monto_total: '110000', recargo_kit: '10000',
            total_canjes: '20000', total_liquidaciones: '30000', total_gastos: '5000', liquidacion_registrada: true },
          { id: randomUUID(), nombre: 'Partido sin liquidación', cliente: 'Cliente B', fecha: new Date(), estado: 'pendiente',
            precio_base: '50000', monto_total: '50000', recargo_kit: '0',
            total_canjes: '0', total_liquidaciones: '0', total_gastos: '0', liquidacion_registrada: false },
        ] };
      }
      if (sql.includes('SELECT DISTINCT')) return { rows: [{ nombre: 'Cliente A' }, { nombre: 'Cliente B' }] };
      throw new Error('Consulta inesperada');
    },
  };
  const dashboard = await crearReporteFinancieroRepository(db).obtenerDashboard({ periodo: 'mes', anio: '2026', mes: '11' });
  assert.equal(dashboard.eventos[0].resultadoEstimadoClp, 95000); // 110000 + 20000 - 30000 - 5000
  assert.equal(dashboard.indicadores.montoTotalClp, 160000);
  assert.equal(dashboard.indicadores.recargosKitIncluidosClp, 10000);
  assert.equal(dashboard.indicadores.canjesEstimadosClp, 20000);
  assert.equal(dashboard.indicadores.resultadoEstimadoClp, 145000);
  assert.equal(dashboard.indicadores.eventosSinLiquidacion, 1);
  assert.deepEqual(dashboard.clientes, ['Cliente A', 'Cliente B']);
});

test('RF14 rechaza sumas fuera de rango seguro', () => {
  assert.throws(() => sumarSeguro([Number.MAX_SAFE_INTEGER, 1]), /rango/);
});

test('RF14 registra un gasto operativo validado y parametrizado', async () => {
  const eventoId = randomUUID();
  let llamada;
  const db = { query: async (sql, args) => {
    llamada = { sql, args };
    return { rows: [{ id: args[0], evento_id: eventoId, descripcion: args[2], monto_clp: String(args[3]), creado_en: new Date() }] };
  } };
  const repo = crearReporteFinancieroRepository(db);
  const gasto = await repo.registrarGasto({ eventoId, descripcion: '  Combustible  ', montoClp: 7000 });
  assert.equal(gasto.montoClp, 7000);
  assert.equal(gasto.descripcion, 'Combustible');
  assert.match(llamada.sql, /INSERT INTO gasto_operativo/);
  assert.equal(llamada.args[3], 7000);
  for (const montoClp of [0, -1, '100', 2.5, null]) {
    await assert.rejects(repo.registrarGasto({ eventoId, descripcion: 'Test', montoClp }), TypeError);
  }
});

test('RF14 devuelve 404 para un gasto asociado a evento inexistente', async () => {
  const db = { query: async () => ({ rows: [] }) };
  await assert.rejects(crearReporteFinancieroRepository(db).registrarGasto({
    eventoId: randomUUID(), descripcion: 'Test', montoClp: 1000,
  }), { status: 404 });
});
