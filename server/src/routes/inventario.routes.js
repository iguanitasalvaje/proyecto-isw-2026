// server/src/routes/inventario.routes.js
const { Router } = require('express');
const {
  getEquipos,
  createEquipo,
  updateEstadoEquipo
} = require('../controllers/inventario.controller.js');

const router = Router();

router.get('/equipos', getEquipos);
router.post('/equipos', createEquipo);
router.patch('/equipos/:id/estado', updateEstadoEquipo);

module.exports = router;