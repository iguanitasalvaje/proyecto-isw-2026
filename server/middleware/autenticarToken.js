'use strict';

const jwt = require('jsonwebtoken');

function crearAutenticarToken(usuarioRepository) {
  return async function autenticarToken(req, res, next) {
    try {
      const encabezado = req.headers.authorization;

      if (!encabezado || !encabezado.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Debes iniciar sesión para acceder.'
        });
      }

      const token = encabezado.slice(7).trim();

      if (!token) {
        return res.status(401).json({
          error: 'Token no proporcionado.'
        });
      }

      const contenido = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await usuarioRepository.buscarPorId(contenido.id);

      if (!usuario || !usuario.activo) {
        return res.status(401).json({
          error: 'La sesión no es válida o la cuenta está desactivada.'
        });
      }

      req.user = {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' ||
          error.name === 'TokenExpiredError' ||
          error.name === 'NotBeforeError') {
        return res.status(401).json({
          error: 'Token inválido o expirado.'
        });
      }

      next(error);
    }
  };
}

module.exports = { crearAutenticarToken };
