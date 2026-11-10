'use strict';
const express = require('express');
const cors = require('cors');
const { crearOperacionRepository } = require('./repositories/operacionRepository');
const { crearLiquidacionRepository } = require('./repositories/liquidacionRepository');

function crearApp(pool) {
  const app = express();
  const operacion = crearOperacionRepository(pool);
  const liquidaciones = crearLiquidacionRepository(pool);
  app.use(cors());
  app.use(express.json({ limit: '64kb' }));
  app.get('/api', (req, res) => res.json({ status: 'ok', mensaje: 'Servidor del proyecto funcionando correctamente' }));
  app.get('/api/eventos', async (req, res) => res.json(await operacion.listarEventos()));
  app.get('/api/personas', async (req, res) => res.json(await operacion.listarPersonas()));
  app.get('/api/roles', async (req, res) => res.json(await operacion.listarRoles()));
  app.param('id', (req, res, next, id) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Identificador de evento inválido' });
    }
    next();
  });
  app.get('/api/eventos/:id', async (req, res) => res.json(await operacion.obtenerEvento(req.params.id)));
  app.get('/api/eventos/:id/asignaciones', async (req, res) => {
    await operacion.obtenerEvento(req.params.id);
    res.json(await operacion.listarAsignaciones(req.params.id));
  });
  const version = req => {
    const v = req.body?.versionEvento;
    if (!Number.isInteger(v) || v < 1) throw new TypeError('Se requiere versionEvento entera positiva');
    return v;
  };
  app.patch('/api/eventos/:id/asignaciones/porcentajes', async (req, res) => {
    res.json(await operacion.editarPorcentajes({ eventoId: req.params.id, cambios: req.body?.cambios, versionEvento: version(req) }));
  });
  app.patch('/api/eventos/:id/estado', async (req, res) => {
    res.json(await operacion.cambiarEstado({ eventoId: req.params.id, estado: req.body?.estado, versionEvento: version(req) }));
  });
  app.post('/api/eventos/:id/liquidacion/previsualizacion', async (req, res) => {
    res.json(await liquidaciones.previsualizar(req.params.id, version(req)));
  });
  app.post('/api/eventos/:id/liquidacion', async (req, res) => {
    res.status(201).json(await liquidaciones.registrar(req.params.id, version(req)));
  });
  app.get('/api/eventos/:id/liquidacion', async (req, res) => {
    await operacion.obtenerEvento(req.params.id);
    const resultado = await liquidaciones.obtener(req.params.id);
    if (!resultado) return res.status(404).json({ error: 'Liquidación inexistente' });
    res.json(resultado);
  });
  app.use((req, res) => res.status(404).json({ error: 'Ruta inexistente' }));
  app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    let status = error.status || (error instanceof TypeError || error instanceof RangeError ? 400 : 500);
    if (['23505', '40001', '40P01'].includes(error.code)) status = 409;
    if (['22P02', '23503', '23514', '23502'].includes(error.code)) status = 400;
    const mensaje = status === 500 ? 'Error interno del servidor' :
      error.code ? (status === 409 ? 'Conflicto al guardar los datos' : 'Datos inválidos') : error.message;
    res.status(status).json({ error: mensaje });
  });
  return app;
}
module.exports = { crearApp };
