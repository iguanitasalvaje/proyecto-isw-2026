'use strict';

const { randomUUID } = require('node:crypto');
const { errorEstado } = require('./transaccion');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validarFiltros({ cliente, periodo = 'todos', anio, mes } = {}) {
  if (!['todos', 'mes', 'temporada'].includes(periodo)) {
    throw new TypeError('Período inválido. Utiliza todos, mes o temporada');
  }
  const clienteNormalizado = cliente == null || cliente === '' || cliente === 'Todos' ? null : cliente;
  if (clienteNormalizado !== null && (typeof clienteNormalizado !== 'string' || !clienteNormalizado.trim() || clienteNormalizado.length > 200)) {
    throw new TypeError('Cliente inválido');
  }
  const a = periodo === 'todos' ? null : Number(anio);
  const m = periodo !== 'mes' ? null : Number(mes);
  if (periodo !== 'todos' && (!/^\d{4}$/.test(String(anio)) || !Number.isInteger(a) || a < 2000 || a > 2100)) {
    throw new TypeError('Año inválido');
  }
  if (periodo === 'mes' && (!/^(?:[1-9]|1[0-2])$/.test(String(mes)) || !Number.isInteger(m) || m < 1 || m > 12)) {
    throw new TypeError('Mes inválido');
  }
  return { cliente: clienteNormalizado?.trim() ?? null, periodo, anio: a, mes: m };
}

function dinero(valor) {
  const n = Number(valor);
  if (!Number.isSafeInteger(n)) throw errorEstado('Monto financiero fuera del rango permitido', 409);
  return n;
}

function sumarSeguro(numeros) {
  return dinero(numeros.reduce((acumulado, n) => acumulado + BigInt(n), 0n));
}

function formatearEvento(r) {
  const montoTotalClp = dinero(r.monto_total);
  const precioBaseClp = dinero(r.precio_base);
  const recargoKitIncluidoClp = dinero(r.recargo_kit);
  const canjesEstimadosClp = dinero(r.total_canjes);
  const liquidacionesRegistradasClp = dinero(r.total_liquidaciones);
  const gastosOperativosClp = dinero(r.total_gastos);
  return {
    id: r.id, nombre: r.nombre, cliente: r.cliente, fecha: r.fecha, estado: r.estado,
    montoTotalClp, precioBaseClp, recargoKitIncluidoClp, canjesEstimadosClp,
    liquidacionesRegistradasClp, gastosOperativosClp,
    liquidacionRegistrada: r.liquidacion_registrada,
    resultadoEstimadoClp: sumarSeguro([montoTotalClp, canjesEstimadosClp, -liquidacionesRegistradasClp, -gastosOperativosClp]),
  };
}

function crearReporteFinancieroRepository(db) {
  return {
    async obtenerDashboard(parametros = {}) {
      const filtros = validarFiltros(parametros);
      // CTEs agregados por evento: evitan multiplicar importes por joins 1:N.
      // monto_total YA incluye el recargo del kit Premium.
      const { rows } = await db.query(`
        SELECT e.id, e.nombre, e.cliente, e.fecha, e.estado,
               e.precio_base, e.monto_total,
               COALESCE(k.recargo, 0) AS recargo_kit,
               COALESCE(c.total, 0) AS total_canjes,
               COALESCE(l.total_distribuido, 0) AS total_liquidaciones,
               (l.id IS NOT NULL) AS liquidacion_registrada,
               COALESCE(g.total, 0) AS total_gastos
        FROM evento e
        LEFT JOIN asignacion_kit_evento k ON k.evento_id = e.id
        LEFT JOIN (
          SELECT evento_id, SUM(monto_estimado_clp) AS total
          FROM canje_auspiciador GROUP BY evento_id
        ) c ON c.evento_id = e.id
        LEFT JOIN liquidacion l ON l.evento_id = e.id
        LEFT JOIN (
          SELECT evento_id, SUM(monto_clp) AS total
          FROM gasto_operativo GROUP BY evento_id
        ) g ON g.evento_id = e.id
        WHERE ($1::text IS NULL OR btrim(e.cliente) = $1)
          AND ($2::integer IS NULL OR EXTRACT(YEAR FROM (e.fecha AT TIME ZONE 'America/Santiago')) = $2)
          AND ($3::integer IS NULL OR EXTRACT(MONTH FROM (e.fecha AT TIME ZONE 'America/Santiago')) = $3)
        ORDER BY e.fecha DESC NULLS LAST, e.id
      `, [filtros.cliente, filtros.anio, filtros.mes]);
      const eventos = rows.map(formatearEvento);
      const { rows: clientesRows } = await db.query(`
        SELECT DISTINCT btrim(cliente) AS nombre FROM evento
        WHERE cliente IS NOT NULL AND btrim(cliente) <> '' ORDER BY nombre
      `);
      const total = campo => sumarSeguro(eventos.map(e => e[campo]));
      return {
        filtros, clientes: clientesRows.map(c => c.nombre),
        indicadores: {
          cantidadEventos: eventos.length,
          montoTotalClp: total('montoTotalClp'),
          recargosKitIncluidosClp: total('recargoKitIncluidoClp'),
          canjesEstimadosClp: total('canjesEstimadosClp'),
          liquidacionesRegistradasClp: total('liquidacionesRegistradasClp'),
          gastosOperativosClp: total('gastosOperativosClp'),
          resultadoEstimadoClp: total('resultadoEstimadoClp'),
          eventosSinLiquidacion: eventos.filter(e => !e.liquidacionRegistrada).length,
        },
        // No existe una tabla de cobros efectivos: aquí NO se informan ingresos cobrados.
        eventos,
      };
    },

    async registrarGasto({ eventoId, descripcion, montoClp } = {}) {
      if (typeof eventoId !== 'string' || !UUID.test(eventoId)) throw new TypeError('Evento inválido');
      if (typeof descripcion !== 'string' || !descripcion.trim() || descripcion.trim().length > 500) {
        throw new TypeError('Descripción de gasto inválida');
      }
      if (!Number.isSafeInteger(montoClp) || montoClp <= 0) throw new TypeError('Monto de gasto inválido');
      const id = randomUUID();
      const { rows } = await db.query(`
        INSERT INTO gasto_operativo(id, evento_id, descripcion, monto_clp)
        SELECT $1, id, $3, $4 FROM evento WHERE id = $2
        RETURNING id, evento_id, descripcion, monto_clp, creado_en
      `, [id, eventoId, descripcion.trim(), montoClp]);
      if (!rows.length) throw errorEstado('Evento inexistente', 404);
      return {
        id: rows[0].id, eventoId: rows[0].evento_id,
        descripcion: rows[0].descripcion, montoClp: dinero(rows[0].monto_clp),
        creadoEn: rows[0].creado_en,
      };
    },
    async listarGastos(eventoId) {
      if (typeof eventoId !== 'string' || !UUID.test(eventoId)) throw new TypeError('Evento inválido');
      const { rows: existe } = await db.query('SELECT id FROM evento WHERE id=$1', [eventoId]);
      if (!existe.length) throw errorEstado('Evento inexistente', 404);
      const { rows } = await db.query(`
        SELECT id, evento_id, descripcion, monto_clp, creado_en
        FROM gasto_operativo WHERE evento_id=$1 ORDER BY creado_en DESC, id
      `, [eventoId]);
      return rows.map(r => ({ id: r.id, eventoId: r.evento_id,
        descripcion: r.descripcion, montoClp: dinero(r.monto_clp), creadoEn: r.creado_en }));
    },
  };
}

module.exports = { crearReporteFinancieroRepository, validarFiltros, formatearEvento, sumarSeguro };
