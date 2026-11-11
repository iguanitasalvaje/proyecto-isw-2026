'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function crearAuthRoutes({ usuarioRepository, autenticarToken }) {
  const router = express.Router();

  // POST /api/auth/login
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};

      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          error: 'Debes ingresar correo y contraseña.'
        });
      }

      const usuario = await usuarioRepository.buscarPorEmail(email);

      // Verificamos existencia, estado activo y contraseña con bcrypt
      if (
        !usuario ||
        !usuario.activo ||
        !(await bcrypt.compare(password, usuario.password_hash))
      ) {
        return res.status(401).json({
          error: 'Correo o contraseña incorrectos, o la cuenta se encuentra desactivada.'
        });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado en las variables de entorno.');
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/auth/me
  router.get('/me', autenticarToken, (req, res) => {
    res.json({
      usuario: {
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol
      }
    });
  });

  return router;
}

module.exports = { crearAuthRoutes };
