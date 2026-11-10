'use strict';

const { randomUUID } = require('node:crypto');
const { calcularLiquidacion } = require('../domain/liquidacion');
const { enteroSeguro } = require('./operacionRepository');
const { transaccion, bloquearEvento, exigirSinLiquidacion, errorEstado } = require('./transaccion');

async function cargarInsumos(db, eventoId, versionEsperada) {
  const evento = await bloquearEvento(db, eventoId, versionEsperada);
  if (evento.estado !== 'finalizado') throw errorEstado('El evento debe estar finalizado');
  await exigirSinLiquidacion(db, eventoId);
  const participantes = (await db.query(`SELECT a.*, p.nombre AS nombre_persona, r.nombre AS nombre_rol
    FROM asignacion_evento a JOIN persona p ON p.id=a.persona_id
    JOIN rol_evento r ON r.id=a.rol_id WHERE a.evento_id=$1 ORDER BY a.id`, [eventoId])).rows;
  return {
    versionEvento: evento.version,
    entrada: { eventoId, montoTotalEvento: enteroSeguro(evento.monto_total),
      personas: participantes.map(p => ({ id: p.persona_id, nombre: p.nombre_persona })),
      roles: [...new Map(participantes.map(p => [p.rol_id, { id: p.rol_id, nombre: p.nombre_rol }])).values()],
      asignaciones: participantes.map(p => ({ id: p.id, eventoId, personaId: p.persona_id, rolId: p.rol_id, porcentajeCentesimas: p.porcentaje_centesimas })),
    },
  };
}

function crearLiquidacionRepository(pool) {
  return {
    // La versión vincula la confirmación con los datos previsualizados.
    async previsualizar(eventoId, versionEvento) {
      return transaccion(pool, async db => {
        const insumos = await cargarInsumos(db, eventoId, versionEvento);
        return { versionEvento: insumos.versionEvento, ...calcularLiquidacion(insumos.entrada) };
      });
    },
    async registrar(eventoId, versionEsperada) {
      return transaccion(pool, async db => {
        const instante = (await db.query('SELECT transaction_timestamp() AS instante')).rows[0].instante;
        const { entrada, versionEvento } = await cargarInsumos(db, eventoId, versionEsperada);
        // Nunca se aceptan detalles ni importes calculados por el navegador.
        const resultado = calcularLiquidacion(entrada);
        const id = randomUUID();
        await db.query(`INSERT INTO liquidacion(id,evento_id,monto_evento_aplicado,version_evento,total_distribuido)
          VALUES ($1,$2,$3,$4,$5)`, [id, eventoId, resultado.montoTotalEvento, versionEvento, resultado.totalDistribuido]);
        for (const d of resultado.detalles) {
          await db.query(`INSERT INTO detalle_liquidacion(id,liquidacion_id,asignacion_id,persona_id,
            nombre_persona,rol_id,nombre_rol,valor_rol_id,porcentaje_centesimas,monto_calculado)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [randomUUID(), id, d.asignacionId, d.personaId, d.nombrePersona, d.rolId, d.nombreRol,
            null, entrada.asignaciones.find(a => a.id === d.asignacionId).porcentajeCentesimas, d.montoCalculado]);
        }
        await db.query('UPDATE evento SET version=version+1 WHERE id=$1', [eventoId]);
        return { id, creadaEn: instante, versionEvento, ...resultado };
      });
    },
    async obtener(eventoId) {
      const cabecera = (await pool.query('SELECT * FROM liquidacion WHERE evento_id=$1', [eventoId])).rows[0];
      if (!cabecera) return null;
      const filas = (await pool.query('SELECT * FROM detalle_liquidacion WHERE liquidacion_id=$1 ORDER BY asignacion_id', [cabecera.id])).rows;
      return { id: cabecera.id, eventoId, creadaEn: cabecera.creada_en, versionEvento: cabecera.version_evento,
        montoTotalEvento: enteroSeguro(cabecera.monto_evento_aplicado), totalDistribuido: enteroSeguro(cabecera.total_distribuido),
        detalles: filas.map(d => ({ asignacionId: d.asignacion_id, personaId: d.persona_id,
          nombrePersona: d.nombre_persona, rolId: d.rol_id, nombreRol: d.nombre_rol,
          porcentajeAplicado: d.porcentaje_centesimas / 100,
          montoCalculado: enteroSeguro(d.monto_calculado) })) };
    },
  };
}

module.exports = { crearLiquidacionRepository };
