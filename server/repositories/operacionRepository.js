'use strict';

const { randomUUID } = require('node:crypto');

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
    async crearEvento({ nombre, montoTotalEvento, cliente = null, fecha = null, lugar = null }) {
      if (!Number.isSafeInteger(montoTotalEvento) || montoTotalEvento <= 0) throw new TypeError('Monto total inválido');
      const { rows } = await db.query(`INSERT INTO evento(id,nombre,monto_total,cliente,fecha,lugar)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [randomUUID(), nombre, montoTotalEvento, cliente, fecha, lugar]);
      return { ...rows[0], monto_total: enteroSeguro(rows[0].monto_total) };
    },
    async listarEventos() {
      const { rows } = await db.query('SELECT * FROM evento ORDER BY id');
      return rows.map(r => ({ ...r, monto_total: enteroSeguro(r.monto_total) }));
    },
    async crearPersona({ nombre, telefono = null }) {
      return (await db.query('INSERT INTO persona(id,nombre,telefono) VALUES ($1,$2,$3) RETURNING *',
        [randomUUID(), nombre, telefono])).rows[0];
    },
    async listarPersonas() { return (await db.query('SELECT * FROM persona ORDER BY id')).rows; },
    async crearRol({ nombre }) {
      return (await db.query('INSERT INTO rol_evento(id,nombre) VALUES ($1,$2) RETURNING *', [randomUUID(), nombre])).rows[0];
    },
    async listarRoles() { return (await db.query('SELECT * FROM rol_evento ORDER BY id')).rows; },
    async agregarValorRol({ rolId, porcentajeCentesimas, vigenteDesde }) {
      validarCentésimas(porcentajeCentesimas);
      return (await db.query(`INSERT INTO valor_rol(id,rol_id,porcentaje_centesimas,vigente_desde)
        VALUES ($1,$2,$3,$4) RETURNING *`, [randomUUID(), rolId, porcentajeCentesimas, vigenteDesde])).rows[0];
    },
    async asignar({ eventoId, personaId, rolId }) {
      return (await db.query(`INSERT INTO asignacion_evento(id,evento_id,persona_id,rol_id)
        VALUES ($1,$2,$3,$4) RETURNING *`, [randomUUID(), eventoId, personaId, rolId])).rows[0];
    },
    async listarAsignaciones(eventoId) {
      return (await db.query('SELECT * FROM asignacion_evento WHERE evento_id=$1 ORDER BY id', [eventoId])).rows;
    },
  };
}

module.exports = { crearOperacionRepository, enteroSeguro, validarCentésimas };
