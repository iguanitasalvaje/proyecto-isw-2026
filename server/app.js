'use strict';
const express = require('express');
const cors = require('cors');
const { crearOperacionRepository } = require('./repositories/operacionRepository');
const { crearLiquidacionRepository } = require('./repositories/liquidacionRepository');

let crearInventarioRepository;
try {
  crearInventarioRepository = require('./repositories/inventarioRepository').crearInventarioRepository;
} catch {
  crearInventarioRepository = null;
}

function crearApp(pool) {
  const app = express();
  const operacion = crearOperacionRepository(pool);
  const liquidaciones = crearLiquidacionRepository(pool);
  const inventario = crearInventarioRepository ? crearInventarioRepository(pool) : null;

  app.use(cors());
  app.use(express.json({ limit: '64kb' }));

  app.get('/api', (req, res) => res.json({ status: 'ok', mensaje: 'Servidor del proyecto funcionando correctamente' }));
  app.get('/api/eventos', async (req, res, next) => {
    try { res.json(await operacion.listarEventos()); } catch (err) { next(err); }
  });
  app.get('/api/personas', async (req, res, next) => {
    try { res.json(await operacion.listarPersonas()); } catch (err) { next(err); }
  });
  app.get('/api/roles', async (req, res, next) => {
    try { res.json(await operacion.listarRoles()); } catch (err) { next(err); }
  });

  // Ruta del módulo de Inventario
  app.get('/api/inventario/equipos', async (req, res, next) => {
    try {
      if (inventario?.listarEquipos) {
        return res.json(await inventario.listarEquipos());
      }
      const resultado = await pool.query('SELECT * FROM equipos');
      res.json(resultado.rows);
    } catch (error) {
      next(error);
    }
  });

  app.param('id', (req, res, next, id) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Identificador de evento inválido' });
    }
    next();
  });

  app.get('/api/eventos/:id', async (req, res, next) => {
    try { res.json(await operacion.obtenerEvento(req.params.id)); } catch (err) { next(err); }
  });

  app.get('/api/eventos/:id/asignaciones', async (req, res, next) => {
    try {
      await operacion.obtenerEvento(req.params.id);
      res.json(await operacion.listarAsignaciones(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  const version = req => {
    const v = req.body?.versionEvento;
    if (!Number.isInteger(v) || v < 1) throw new TypeError('Se requiere versionEvento entera positiva');
    return v;
  };

  app.patch('/api/eventos/:id/asignaciones/porcentajes', async (req, res, next) => {
    try {
      res.json(await operacion.editarPorcentajes({
        eventoId: req.params.id,
        cambios: req.body?.cambios,
        versionEvento: version(req)
      }));
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/eventos/:id/estado', async (req, res, next) => {
    try {
      const estado = req.body?.estado;
      if (typeof estado !== 'string' || !estado.trim()) {
        return res.status(400).json({ error: 'Se requiere el estado del evento' });
      }

      res.json(await operacion.cambiarEstado({
        eventoId: req.params.id,
        estado,
        versionEvento: version(req)
      }));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/eventos/:id/liquidacion/previsualizacion', async (req, res, next) => {
    try {
      res.json(await liquidaciones.previsualizar(req.params.id, version(req)));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/eventos/:id/liquidacion', async (req, res, next) => {
    try {
      res.status(201).json(await liquidaciones.registrar(req.params.id, version(req)));
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/eventos/:id/liquidacion', async (req, res, next) => {
    try {
      await operacion.obtenerEvento(req.params.id);
      const resultado = await liquidaciones.obtener(req.params.id);
      if (!resultado) return res.status(404).json({ error: 'Liquidación inexistente' });
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  });

  app.use((req, res) => res.status(404).json({ error: 'Ruta inexistente' }));

  // Middleware de manejo global de errores
  app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    // Imprime la falla completa en la consola de Node para depurar fácilmente
    console.error('❌ DETALLE DEL ERROR REGISTRADO:', error);

    let status = error.status || (error instanceof TypeError || error instanceof RangeError ? 400 : 500);

    if (['23505', '40001', '40P01'].includes(error.code)) status = 409;
    if (['22P02', '23503', '23514', '23502'].includes(error.code)) status = 400;

    const mensaje = status === 500
      ? 'Error interno del servidor'
      : error.code
        ? (status === 409 ? 'Conflicto al guardar los datos' : 'Datos inválidos')
        : error.message;

    res.status(status).json({ error: mensaje });
  });

  return app;
}

module.exports = { crearApp };