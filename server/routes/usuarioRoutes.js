'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function crearUsuarioRoutes({ usuarioRepository, autenticarToken, autorizarRol }) {
  const router = express.Router();

  // Todas las rutas de administración de usuarios requieren autenticación y rol DUEÑO
  router.use(autenticarToken);
  router.use(autorizarRol(ROLES.DUENO));

  // Validador de parámetro :id
  router.param('id', (req, res, next, id) => {
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Identificador de usuario inválido.' });
    }
    next();
  });

  // GET /api/usuarios - Listar todos los usuarios
  router.get('/', async (req, res, next) => {
    try {
      const usuarios = await usuarioRepository.listar();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/usuarios - Crear cuenta de Contador o Jefe Técnico
  router.post('/', async (req, res, next) => {
    try {
      const { email, password, rol } = req.body || {};

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Debes proporcionar un correo electrónico válido.' });
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      }

      if (rol === ROLES.DUENO) {
        return res.status(400).json({ error: 'No está permitido crear cuentas con rol Dueño.' });
      }

      if (![ROLES.CONTADOR, ROLES.JEFE_TECNICO].includes(rol)) {
        return res.status(400).json({ error: 'El rol debe ser CONTADOR o JEFE_TECNICO.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const nuevoUsuario = await usuarioRepository.crear({
        email,
        passwordHash,
        rol
      });

      res.status(201).json(nuevoUsuario);
    } catch (error) {
      if (error.code === '23505' || error.status === 409) {
        return res.status(409).json({ error: 'El correo electrónico ya se encuentra registrado.' });
      }
      next(error);
    }
  });

  // PATCH /api/usuarios/:id - Modificar cuenta (correo y rol)
  router.patch('/:id', async (req, res, next) => {
    try {
      const { email, rol } = req.body || {};

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Debes proporcionar un correo electrónico válido.' });
      }

      if (rol === ROLES.DUENO) {
        return res.status(400).json({ error: 'No está permitido asignar el rol Dueño.' });
      }

      if (![ROLES.CONTADOR, ROLES.JEFE_TECNICO].includes(rol)) {
        return res.status(400).json({ error: 'El rol debe ser CONTADOR o JEFE_TECNICO.' });
      }

      // Evitar que el Dueño degrade o modifique su propia cuenta a través de este endpoint
      if (req.user.id === req.params.id) {
        return res.status(400).json({ error: 'No puedes modificar tu propia cuenta desde este panel.' });
      }

      const usuarioActualizado = await usuarioRepository.actualizar({
        id: req.params.id,
        email,
        rol
      });

      if (!usuarioActualizado) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      res.json(usuarioActualizado);
    } catch (error) {
      if (error.code === '23505' || error.status === 409) {
        return res.status(409).json({ error: 'El correo electrónico ya pertenece a otro usuario.' });
      }
      if (error.message && error.message.includes('Dueño')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  });

  // PATCH /api/usuarios/:id/estado - Activar o desactivar cuenta
  router.patch('/:id/estado', async (req, res, next) => {
    try {
      const { activo } = req.body || {};

      if (typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'Se requiere el estado activo como booleano (true o false).' });
      }

      // El Dueño no puede desactivarse a sí mismo
      if (req.user.id === req.params.id && !activo) {
        return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta de Dueño.' });
      }

      const usuarioModificado = await usuarioRepository.cambiarEstado({
        id: req.params.id,
        activo
      });

      if (!usuarioModificado) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      res.json(usuarioModificado);
    } catch (error) {
      if (error.message && error.message.includes('Dueño')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  });

  // PATCH /api/usuarios/:id/password - Restablecer contraseña
  router.patch('/:id/password', async (req, res, next) => {
    try {
      const { password } = req.body || {};

      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const usuarioActualizado = await usuarioRepository.cambiarPassword({
        id: req.params.id,
        passwordHash
      });

      if (!usuarioActualizado) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      res.json({
        mensaje: 'Contraseña restablecida exitosamente.',
        usuario: usuarioActualizado
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { crearUsuarioRoutes };
