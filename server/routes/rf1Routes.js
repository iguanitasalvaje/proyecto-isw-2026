// Rutas de prueba para RF1 - Matriz Definitiva
const express = require('express');
const autorizarRol = require('../middleware/autorizarRol');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Eventos: Accesible para Dueño y Contador
router.get('/eventos', autorizarRol(ROLES.DUENO, ROLES.CONTADOR), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Eventos'
  });
});

// Finanzas: Accesible para Dueño y Contador
router.get('/finanzas', autorizarRol(ROLES.DUENO, ROLES.CONTADOR), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Finanzas'
  });
});

// Auspiciadores: Accesible para Dueño y Contador
router.get('/auspiciadores', autorizarRol(ROLES.DUENO, ROLES.CONTADOR), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Auspiciadores'
  });
});

// Calculadora de Pagos: Accesible para Dueño y Contador
router.get('/calculadora-pagos', autorizarRol(ROLES.DUENO, ROLES.CONTADOR), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Calculadora de Pagos'
  });
});

// Inventario: Accesible para Dueño y Jefe Técnico
router.get('/inventario', autorizarRol(ROLES.DUENO, ROLES.JEFE_TECNICO), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Inventario'
  });
});

// Personal: Exclusivo para el Dueño (Contador y Jefe Técnico no tienen acceso)
router.get('/personal', autorizarRol(ROLES.DUENO), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado al módulo Personal'
  });
});

module.exports = router;
