// Rutas de prueba para RF1
const express = require('express');
const autorizarRol = require('../middleware/autorizarRol');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Esta ruta solo debe ser accesible para el Dueño.
router.get('/eventos', autorizarRol(ROLES.DUENO), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Eventos'
  });
});

// Esta ruta solo debe ser accesible para el Contador.
router.get('/finanzas', autorizarRol(ROLES.CONTADOR), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Finanzas'
  });
});

// Esta ruta solo debe ser accesible para el Jefe Técnico.
router.get('/inventario', autorizarRol(ROLES.JEFE_TECNICO), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Inventario'
  });
});

module.exports = router;