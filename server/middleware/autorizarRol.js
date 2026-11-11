'use strict';

// Middleware de autorización por roles - RF1
const { ROLES } = require('../config/roles');

// Comprueba que los roles indicados sean válidos.
const autorizarRol = (...rolesPermitidos) => {
  const rolesValidos = Object.values(ROLES);

  if (
    rolesPermitidos.length === 0 ||
    rolesPermitidos.some((rol) => !rolesValidos.includes(rol))
  ) {
    throw new Error('Configuración de roles permitidos inválida.');
  }

  return (req, res, next) => {
    // El usuario debe haber sido autenticado previamente por autenticarToken
    const usuario = req.user;

    if (!usuario) {
      return res.status(401).json({
        error: 'Debes iniciar sesión para acceder.'
      });
    }

    // Verificamos que su rol esté autorizado para esta ruta/operación
    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para acceder a este módulo o realizar esta operación.'
      });
    }

    next();
  };
};

module.exports = autorizarRol;
