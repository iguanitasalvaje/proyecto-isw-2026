'use strict';
const { randomUUID } = require('node:crypto');
const { calcularRecargo } = require('../domain/recargoPremium');
const { transaccion, bloquearEvento, exigirSinLiquidacion, errorEstado } = require('./transaccion');

function nombreValido(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) throw new TypeError('Nombre de kit requerido');
  return nombre.trim();
}
function crearKitRepository(pool) {
  async function detalle(db, eventoId) {
    const r = (await db.query(`SELECT e.id, e.nombre, e.estado, e.version, e.precio_base, e.monto_total,
      a.kit_id, a.nombre_kit, a.premium, a.porcentaje_centesimas, a.recargo, a.configuracion_id, a.asignado_en
      FROM evento e LEFT JOIN asignacion_kit_evento a ON a.evento_id=e.id WHERE e.id=$1`, [eventoId])).rows[0];
    if (!r) throw errorEstado('Evento inexistente', 404);
    return { eventoId: r.id, nombre: r.nombre, estado: r.estado, versionEvento: r.version,
      precioBase: Number(r.precio_base), montoTotal: Number(r.monto_total),
      porcentajeCentesimas: r.porcentaje_centesimas ?? 0, recargo: Number(r.recargo ?? 0),
      kit: r.kit_id ? { id: r.kit_id, nombre: r.nombre_kit, premium: r.premium,
        configuracionId: r.configuracion_id, asignadoEn: r.asignado_en } : null };
  }
  async function editable(db, eventoId, versionEvento) {
    const e = await bloquearEvento(db, eventoId, versionEvento);
    await exigirSinLiquidacion(db, eventoId);
    if (e.estado === 'finalizado') throw errorEstado('El evento está finalizado');
    return e;
  }
  async function vigente(db) {
    return (await db.query(`SELECT * FROM configuracion_recargo WHERE tipo='premium'
      AND vigente_desde <= statement_timestamp() ORDER BY vigente_desde DESC LIMIT 1`)).rows[0] || null;
  }
  return {
    async crearKit({ nombre, premium }) {
      nombre = nombreValido(nombre);
      if (typeof premium !== 'boolean') throw new TypeError('Tipo Premium inválido');
      return (await pool.query('INSERT INTO kit(id,nombre,premium) VALUES ($1,$2,$3) RETURNING *',
        [randomUUID(), nombre, premium])).rows[0];
    },
    async listarKits() {
      return (await pool.query(`SELECT k.*, o.evento_id AS evento_ocupante_id, (o.evento_id IS NULL) AS disponible
        FROM kit k LEFT JOIN LATERAL (SELECT a.evento_id FROM asignacion_kit_evento a
          JOIN evento e ON e.id=a.evento_id WHERE a.kit_id=k.id AND e.estado <> 'finalizado' LIMIT 1) o ON true
        ORDER BY k.nombre, k.id`)).rows;
    },
    async configurarPremium({ porcentajeCentesimas, vigenteDesde }) {
      calcularRecargo(1, porcentajeCentesimas);
      if (typeof vigenteDesde !== 'string' || !Number.isFinite(Date.parse(vigenteDesde))) throw new TypeError('Vigencia inválida');
      return (await pool.query(`INSERT INTO configuracion_recargo(id,porcentaje_centesimas,vigente_desde)
        VALUES ($1,$2,$3) RETURNING *`, [randomUUID(), porcentajeCentesimas, vigenteDesde])).rows[0];
    },
    async obtenerConfiguracion() { return vigente(pool); },
    async obtenerDetalle(eventoId) { return detalle(pool, eventoId); },
    async asignarKit({ eventoId, kitId, versionEvento }) {
      if (kitId !== null && (typeof kitId !== 'string' || !kitId)) throw new TypeError('Kit inválido');
      return transaccion(pool, async db => {
        const evento = await editable(db, eventoId, versionEvento);
        const anterior = (await db.query('SELECT * FROM asignacion_kit_evento WHERE evento_id=$1', [eventoId])).rows[0];
        if ((anterior?.kit_id ?? null) === kitId) return detalle(db, eventoId);
        // Orden estable para cambios concurrentes entre dos kits físicos.
        const ids = [...new Set([anterior?.kit_id, kitId].filter(Boolean))].sort();
        const kits = (await db.query('SELECT * FROM kit WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [ids])).rows;
        const kit = kits.find(k => k.id === kitId);
        if (kitId !== null && !kit) throw errorEstado('Kit inexistente', 404);
        if (kit && (await db.query(`SELECT 1 FROM asignacion_kit_evento a JOIN evento e ON e.id=a.evento_id
          WHERE a.kit_id=$1 AND e.estado <> 'finalizado' AND e.id <> $2`, [kitId, eventoId])).rowCount) {
          throw errorEstado('El kit está ocupado por otro evento');
        }
        const config = kit?.premium ? await vigente(db) : null;
        if (kit?.premium && !config) throw errorEstado('No hay un porcentaje Premium vigente configurado');
        const calculo = calcularRecargo(Number(evento.precio_base), config?.porcentaje_centesimas ?? 0);
        if (kit) {
          await db.query(`INSERT INTO asignacion_kit_evento(evento_id,kit_id,nombre_kit,premium,configuracion_id,porcentaje_centesimas,recargo)
            VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (evento_id) DO UPDATE SET
            kit_id=EXCLUDED.kit_id, nombre_kit=EXCLUDED.nombre_kit, premium=EXCLUDED.premium,
            configuracion_id=EXCLUDED.configuracion_id, porcentaje_centesimas=EXCLUDED.porcentaje_centesimas,
            recargo=EXCLUDED.recargo, asignado_en=transaction_timestamp()`,
          [eventoId, kitId, kit.nombre, kit.premium, config?.id ?? null, calculo.porcentajeCentesimas, calculo.recargo]);
        } else {
          await db.query('DELETE FROM asignacion_kit_evento WHERE evento_id=$1', [eventoId]);
        }
        await db.query('UPDATE evento SET monto_total=$1, version=version+1 WHERE id=$2', [calculo.montoTotal, eventoId]);
        return detalle(db, eventoId);
      });
    },
    async actualizarPrecioBase({ eventoId, precioBase, versionEvento }) {
      calcularRecargo(precioBase, 0);
      return transaccion(pool, async db => {
        await editable(db, eventoId, versionEvento);
        const asignacion = (await db.query('SELECT * FROM asignacion_kit_evento WHERE evento_id=$1', [eventoId])).rows[0];
        const calculo = calcularRecargo(precioBase, asignacion?.porcentaje_centesimas ?? 0);
        await db.query('UPDATE asignacion_kit_evento SET recargo=$1 WHERE evento_id=$2', [calculo.recargo, eventoId]);
        await db.query('UPDATE evento SET precio_base=$1, monto_total=$2, version=version+1 WHERE id=$3',
          [precioBase, calculo.montoTotal, eventoId]);
        return detalle(db, eventoId);
      });
    },
  };
}
module.exports = { crearKitRepository };
