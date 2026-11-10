'use strict';

const { randomUUID } = require('node:crypto');
const { transaccion, bloquearEvento, exigirSinLiquidacion, errorEstado } = require('./transaccion');

function enteroSeguro(valor) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero)) throw new RangeError('Entero fuera del rango seguro');
  return numero;
}

function validarCentésimas(valor) {
  if (!Number.isInteger(valor) || valor < 0 || valor > 10000) {
    throw new TypeError('Porcentaje en centésimas debe ser entero entre 0 y 10000');
  }
  return valor;
}

function crearOperacionRepository(db) {
  return {
    async crearEvento({ nombre, montoTotalEvento, precioBase = montoTotalEvento, cliente = null, fecha = null, lugar = null }) {
      if (montoTotalEvento !== undefined && montoTotalEvento !== precioBase) throw new TypeError('El monto inicial debe coincidir con el precio base');
      if (!Number.isSafeInteger(precioBase) || precioBase <= 0) throw new TypeError('Monto total inválido');
      const { rows } = await db.query(`INSERT INTO evento(id,nombre,monto_total,precio_base,cliente,fecha,lugar)
        VALUES ($1,$2,$3,$3,$4,$5,$6) RETURNING *`, [randomUUID(), nombre, precioBase, cliente, fecha, lugar]);
      return { ...rows[0], monto_total: enteroSeguro(rows[0].monto_total), precio_base: enteroSeguro(rows[0].precio_base) };
    },
    async listarEventos() {
      const { rows } = await db.query('SELECT * FROM evento ORDER BY id');
      return rows.map(r => ({ ...r, monto_total: enteroSeguro(r.monto_total), precio_base: enteroSeguro(r.precio_base) }));
    },
    async crearPersona({ nombre, telefono = null }) {
      return (await db.query('INSERT INTO persona(id,nombre,telefono) VALUES ($1,$2,$3) RETURNING *',
        [randomUUID(), nombre, telefono])).rows[0];
    },
    async listarPersonas() {
      return (await db.query(`SELECT p.*, NOT EXISTS (SELECT 1 FROM asignacion_evento a
        JOIN evento e ON e.id=a.evento_id WHERE a.persona_id=p.id AND e.estado <> 'finalizado') AS disponible
        FROM persona p ORDER BY p.id`)).rows;
    },
    async obtenerEvento(id) {
      const r = (await db.query('SELECT * FROM evento WHERE id=$1', [id])).rows[0];
      if (!r) throw errorEstado('Evento inexistente', 404);
      return { ...r, monto_total: enteroSeguro(r.monto_total), precio_base: enteroSeguro(r.precio_base) };
    },
    async crearRol({ nombre }) {
      return (await db.query('INSERT INTO rol_evento(id,nombre) VALUES ($1,$2) RETURNING *', [randomUUID(), nombre])).rows[0];
    },
    async listarRoles() { return (await db.query('SELECT * FROM rol_evento ORDER BY id')).rows; },
    async agregarValorRol({ rolId, porcentajeCentesimas, vigenteDesde }) {
      validarCentésimas(porcentajeCentesimas);
      return (await db.query(`INSERT INTO valor_rol(id,rol_id,porcentaje_centesimas,vigente_desde)
        VALUES ($1,$2,$3,$4) RETURNING *`, [randomUUID(), rolId, porcentajeCentesimas, vigenteDesde])).rows[0];
    },
    async asignar({ eventoId, personaId, rolId, porcentajeCentesimas, versionEvento }) {
      return modificar(eventoId, versionEvento, true, async tx => {
        const sugerencia = await sugerir(tx, rolId);
        const porcentaje = porcentajeCentesimas === undefined ? sugerencia?.porcentaje_centesimas : porcentajeCentesimas;
        validarCentésimas(porcentaje);
        return (await tx.query(`INSERT INTO asignacion_evento(id,evento_id,persona_id,rol_id,porcentaje_centesimas,valor_rol_origen_id)
          VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [randomUUID(), eventoId, personaId, rolId, porcentaje, porcentajeCentesimas === undefined ? sugerencia?.id : null])).rows[0];
      });
    },
    async editarPorcentajes({ eventoId, cambios, versionEvento }) {
      if (!Array.isArray(cambios) || !cambios.length) throw new TypeError('Se requieren cambios');
      if (new Set(cambios.map(c => c.asignacionId)).size !== cambios.length) throw new TypeError('Asignaciones duplicadas');
      for (const c of cambios) validarCentésimas(c.porcentajeCentesimas);
      return modificar(eventoId, versionEvento, false, async tx => {
        for (const c of cambios) {
          const r = await tx.query(`UPDATE asignacion_evento SET porcentaje_centesimas=$1
            WHERE id=$2 AND evento_id=$3`, [c.porcentajeCentesimas, c.asignacionId, eventoId]);
          if (!r.rowCount) throw errorEstado('Asignación inexistente', 404);
        }
      });
    },
    async cambiarRol({ eventoId, asignacionId, rolId, usarSugerencia = false, versionEvento }) {
      return modificar(eventoId, versionEvento, true, async tx => {
        const sugerencia = usarSugerencia ? await sugerir(tx, rolId) : null;
        if (usarSugerencia) validarCentésimas(sugerencia?.porcentaje_centesimas);
        const r = await tx.query(`UPDATE asignacion_evento SET rol_id=$1,
          porcentaje_centesimas=CASE WHEN $2 THEN $3 ELSE porcentaje_centesimas END,
          valor_rol_origen_id=CASE WHEN $2 THEN $4 ELSE valor_rol_origen_id END
          WHERE id=$5 AND evento_id=$6 RETURNING *`,
        [rolId, usarSugerencia, sugerencia?.porcentaje_centesimas, sugerencia?.id, asignacionId, eventoId]);
        if (!r.rowCount) throw errorEstado('Asignación inexistente', 404);
        return r.rows[0];
      });
    },
    async desasignar({ eventoId, asignacionId, versionEvento }) {
      return modificar(eventoId, versionEvento, true, async tx => {
        if (!(await tx.query('DELETE FROM asignacion_evento WHERE id=$1 AND evento_id=$2', [asignacionId, eventoId])).rowCount) {
          throw errorEstado('Asignación inexistente', 404);
        }
      });
    },
    async actualizarMonto({ eventoId, montoTotalEvento, versionEvento }) {
      if (!Number.isSafeInteger(montoTotalEvento) || montoTotalEvento <= 0) throw new TypeError('Monto total inválido');
      return modificar(eventoId, versionEvento, true, async tx => {
        if ((await tx.query('SELECT 1 FROM asignacion_kit_evento WHERE evento_id=$1', [eventoId])).rowCount) {
          throw errorEstado('El total se calcula desde el precio base y el kit. Usa actualizarPrecioBase.');
        }
        await tx.query('UPDATE evento SET precio_base=$1, monto_total=$1 WHERE id=$2', [montoTotalEvento, eventoId]);
      });
    },
    async cambiarEstado({ eventoId, estado, versionEvento }) {
      if (!['pendiente', 'en_curso', 'finalizado'].includes(estado)) throw new TypeError('Estado inválido');
      return transaccion(db, async tx => {
        const evento = await bloquearEvento(tx, eventoId, versionEvento);
        await exigirSinLiquidacion(tx, eventoId);
        if (!((evento.estado === 'pendiente' && estado === 'en_curso') ||
          (evento.estado === 'en_curso' && estado === 'finalizado'))) throw errorEstado('Transición de estado incompatible');
        const actualizado = (await tx.query(`UPDATE evento SET estado=$1, version=version+1,
          finalizado_en=CASE WHEN $1='finalizado' THEN transaction_timestamp() ELSE finalizado_en END
          WHERE id=$2 RETURNING *`, [estado, eventoId])).rows[0];
        // La disponibilidad de personal y kits se deriva del estado, conservando sus asignaciones.
        return { ...actualizado, monto_total: enteroSeguro(actualizado.monto_total), precio_base: enteroSeguro(actualizado.precio_base) };
      });
    },
    async listarAsignaciones(eventoId) {
      return (await db.query(`SELECT a.*, p.nombre AS nombre_persona, r.nombre AS nombre_rol
        FROM asignacion_evento a JOIN persona p ON p.id=a.persona_id
        JOIN rol_evento r ON r.id=a.rol_id WHERE evento_id=$1 ORDER BY a.id`, [eventoId])).rows;
    },
  };

  async function sugerir(tx, rolId) {
    return (await tx.query(`SELECT * FROM valor_rol WHERE rol_id=$1 AND vigente_desde <= transaction_timestamp()
      ORDER BY vigente_desde DESC LIMIT 1`, [rolId])).rows[0];
  }
  async function modificar(eventoId, versionEvento, antesDeFinalizar, trabajo) {
    return transaccion(db, async tx => {
      const evento = await bloquearEvento(tx, eventoId, versionEvento);
      await exigirSinLiquidacion(tx, eventoId);
      if (antesDeFinalizar && evento.estado === 'finalizado') throw errorEstado('El evento está finalizado');
      const resultado = await trabajo(tx);
      const suma = (await tx.query('SELECT sum(porcentaje_centesimas) AS total FROM asignacion_evento WHERE evento_id=$1', [eventoId])).rows[0].total;
      if (Number(suma) > 10000) throw new TypeError('La suma de porcentajes no puede superar el 100%');
      const version = (await tx.query('UPDATE evento SET version=version+1 WHERE id=$1 RETURNING version', [eventoId])).rows[0].version;
      return resultado?.id ? { ...resultado, versionEvento: version } : { versionEvento: version };
    });
  }
}

module.exports = { crearOperacionRepository, enteroSeguro, validarCentésimas };
