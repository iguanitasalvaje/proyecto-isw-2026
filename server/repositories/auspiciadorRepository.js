'use strict';

const { randomUUID } = require('node:crypto');
const { errorEstado } = require('./transaccion');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validarId(id, nombre) {
  if (typeof id !== 'string' || !UUID.test(id)) {
    throw new TypeError(`${nombre} inválido`);
  }
  return id;
}

function validarNombre(nombre) {
  if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.trim().length > 150) {
    throw new TypeError('El nombre del auspiciador debe tener entre 1 y 150 caracteres');
  }
  return nombre.trim();
}

function validarMonto(monto) {
  // Los montos en CLP se reciben como números enteros JSON, nunca strings ni decimales.
  if (!Number.isSafeInteger(monto) || monto <= 0) {
    throw new TypeError('El monto estimado debe ser un entero positivo en CLP');
  }
  return monto;
}

function validarDescripcion(descripcion) {
  if (descripcion === undefined || descripcion === null) return null;
  if (typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.trim().length > 1000) {
    throw new TypeError('La descripción debe tener entre 1 y 1000 caracteres');
  }
  return descripcion.trim();
}

function enteroSeguro(valor) {
  const numero = Number(valor); // PostgreSQL devuelve bigint como cadena.
  if (!Number.isSafeInteger(numero) || numero < 0) {
    throw errorEstado('El total de canjes supera el rango monetario permitido', 409);
  }
  return numero;
}

function convertirCanje(row) {
  return {
    id: row.id,
    eventoId: row.evento_id,
    auspiciadorId: row.auspiciador_id,
    auspiciadorNombre: row.auspiciador_nombre ?? null,
    descripcion: row.descripcion,
    montoEstimadoClp: enteroSeguro(row.monto_estimado_clp),
    registradoEn: row.registrado_en,
  };
}

function crearAuspiciadorRepository(db) {
  return {
    async listarAuspiciadores() {
      const { rows } = await db.query('SELECT id, nombre FROM auspiciador ORDER BY nombre, id');
      return rows;
    },

    async crearAuspiciador({ nombre } = {}) {
      const nombreValido = validarNombre(nombre);
      const { rows } = await db.query(
        'INSERT INTO auspiciador (id, nombre) VALUES ($1, $2) RETURNING id, nombre',
        [randomUUID(), nombreValido]
      );
      return rows[0];
    },

    async registrarCanje({ eventoId, auspiciadorId, descripcion, montoEstimadoClp } = {}) {
      validarId(eventoId, 'Evento');
      validarId(auspiciadorId, 'Auspiciador');
      const monto = validarMonto(montoEstimadoClp);
      const detalle = validarDescripcion(descripcion);

      // Inserción condicional: ambos registros deben existir. No modifica evento.monto_total.
      const { rows } = await db.query(`
        INSERT INTO canje_auspiciador
          (id, evento_id, auspiciador_id, descripcion, monto_estimado_clp)
        SELECT $1, e.id, a.id, $4, $5
        FROM evento e
        CROSS JOIN auspiciador a
        WHERE e.id = $2 AND a.id = $3
        RETURNING id, evento_id, auspiciador_id, descripcion, monto_estimado_clp, registrado_en
      `, [randomUUID(), eventoId, auspiciadorId, detalle, monto]);

      if (!rows.length) throw errorEstado('Evento o auspiciador inexistente', 404);
      const creado = convertirCanje(rows[0]);
      return { ...creado, auspiciadorNombre: (await db.query(
        'SELECT nombre FROM auspiciador WHERE id=$1', [auspiciadorId]
      )).rows[0]?.nombre ?? null };
    },

    async listarCanjesEvento(eventoId) {
      validarId(eventoId, 'Evento');
      const existe = await db.query('SELECT id FROM evento WHERE id=$1', [eventoId]);
      if (!existe.rowCount) throw errorEstado('Evento inexistente', 404);

      const { rows } = await db.query(`
        SELECT c.id, c.evento_id, c.auspiciador_id, a.nombre AS auspiciador_nombre,
               c.descripcion, c.monto_estimado_clp, c.registrado_en
        FROM canje_auspiciador c
        JOIN auspiciador a ON a.id = c.auspiciador_id
        WHERE c.evento_id = $1
        ORDER BY c.registrado_en DESC, c.id
      `, [eventoId]);

      const canjes = rows.map(convertirCanje);
      let totalEstimadoClp = 0;
      for (const canje of canjes) {
        totalEstimadoClp += canje.montoEstimadoClp;
        if (!Number.isSafeInteger(totalEstimadoClp)) {
          throw errorEstado('El total de canjes supera el rango monetario permitido', 409);
        }
      }
      return { eventoId, canjes, totalEstimadoClp };
    },
  };
}

module.exports = { crearAuspiciadorRepository, validarMonto, validarNombre, validarDescripcion };
