'use strict';

const { randomUUID } = require('node:crypto');
const { ROLES } = require('../config/roles');

const ROLES_GESTIONABLES = Object.freeze([
  ROLES.CONTADOR,
  ROLES.JEFE_TECNICO
]);

function crearUsuarioRepository(pool) {
  return {
    async crear({ email, passwordHash, rol }) {
      if (typeof email !== 'string' || !email.trim()) {
        throw new TypeError('Correo requerido');
      }

      if (typeof passwordHash !== 'string' || !passwordHash.trim()) {
        throw new TypeError('Hash de contraseña requerido');
      }

      if (rol === ROLES.DUENO) {
        throw new Error('No está permitido crear cuentas con rol Dueño');
      }

      if (!ROLES_GESTIONABLES.includes(rol)) {
        throw new TypeError('Rol inválido');
      }

      const correo = email.trim().toLowerCase();

      try {
        const resultado = await pool.query(
          `INSERT INTO usuario (id, email, password_hash, rol)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, rol, activo, creado_en, actualizado_en`,
          [randomUUID(), correo, passwordHash, rol]
        );

        return resultado.rows[0];
      } catch (error) {
        if (error.code === '23505') {
          const err = new Error('El correo electrónico ya está registrado');
          err.code = '23505';
          err.status = 409;
          throw err;
        }
        throw error;
      }
    },

    async buscarPorEmail(email) {
      if (typeof email !== 'string' || !email.trim()) {
        return null;
      }

      const correo = email.trim().toLowerCase();

      const resultado = await pool.query(
        `SELECT id, email, password_hash, rol, activo
         FROM usuario
         WHERE email = $1`,
        [correo]
      );

      return resultado.rows[0] || null;
    },

    async buscarPorId(id) {
      if (!id || typeof id !== 'string') {
        return null;
      }

      const resultado = await pool.query(
        `SELECT id, email, rol, activo, creado_en, actualizado_en
         FROM usuario
         WHERE id = $1`,
        [id]
      );

      return resultado.rows[0] || null;
    },

    async listar() {
      const resultado = await pool.query(
        `SELECT id, email, rol, activo, creado_en, actualizado_en
         FROM usuario
         ORDER BY creado_en DESC`
      );

      return resultado.rows;
    },

    async actualizar({ id, email, rol }) {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new TypeError('Identificador requerido');
      }

      if (typeof email !== 'string' || !email.trim()) {
        throw new TypeError('Correo requerido');
      }

      if (rol === ROLES.DUENO) {
        throw new Error('No está permitido asignar el rol Dueño');
      }

      if (!ROLES_GESTIONABLES.includes(rol)) {
        throw new TypeError('Rol inválido para actualización');
      }

      const usuarioActual = await pool.query(
        `SELECT id, rol FROM usuario WHERE id = $1`,
        [id]
      );

      if (usuarioActual.rowCount === 0) {
        return null;
      }

      if (usuarioActual.rows[0].rol === ROLES.DUENO) {
        throw new Error('No está permitido modificar la cuenta del Dueño');
      }

      const correo = email.trim().toLowerCase();

      try {
        const resultado = await pool.query(
          `UPDATE usuario
           SET email = $1,
               rol = $2,
               actualizado_en = transaction_timestamp()
           WHERE id = $3 AND rol != $4
           RETURNING id, email, rol, activo, creado_en, actualizado_en`,
          [correo, rol, id, ROLES.DUENO]
        );

        return resultado.rows[0] || null;
      } catch (error) {
        if (error.code === '23505') {
          const err = new Error('El correo electrónico ya está registrado');
          err.code = '23505';
          err.status = 409;
          throw err;
        }
        throw error;
      }
    },

    async cambiarEstado({ id, activo }) {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new TypeError('Identificador requerido');
      }

      if (typeof activo !== 'boolean') {
        throw new TypeError('Estado de usuario inválido');
      }

      const usuarioActual = await pool.query(
        `SELECT id, rol FROM usuario WHERE id = $1`,
        [id]
      );

      if (usuarioActual.rowCount === 0) {
        return null;
      }

      if (usuarioActual.rows[0].rol === ROLES.DUENO && !activo) {
        throw new Error('No está permitido desactivar la cuenta del Dueño');
      }

      const resultado = await pool.query(
        `UPDATE usuario
         SET activo = $1,
             actualizado_en = transaction_timestamp()
         WHERE id = $2
         RETURNING id, email, rol, activo, actualizado_en`,
        [activo, id]
      );

      return resultado.rows[0] || null;
    },

    async cambiarPassword({ id, passwordHash }) {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new TypeError('Identificador requerido');
      }

      if (typeof passwordHash !== 'string' || !passwordHash.trim()) {
        throw new TypeError('Hash de contraseña requerido');
      }

      const resultado = await pool.query(
        `UPDATE usuario
         SET password_hash = $1,
             actualizado_en = transaction_timestamp()
         WHERE id = $2
         RETURNING id, email, rol, activo, actualizado_en`,
        [passwordHash, id]
      );

      return resultado.rows[0] || null;
    }
  };
}

module.exports = { crearUsuarioRepository };
