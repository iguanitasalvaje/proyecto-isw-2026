'use strict';
const express = require('express');
const cors = require('cors');
const { crearKitRepository } = require('./repositories/kitRepository');
const { crearOperacionRepository } = require('./repositories/operacionRepository');
const { crearLiquidacionRepository } = require('./repositories/liquidacionRepository');
const { crearAuspiciadorRepository } = require('./repositories/auspiciadorRepository');
const { crearInventarioRepository } = require('./repositories/inventarioRepository');
const { crearReporteFinancieroRepository } = require('./repositories/reporteFinancieroRepository');

function crearApp(pool) {
  const app = express();
  const kits = crearKitRepository(pool);
  const operacion = crearOperacionRepository(pool);
  const liquidaciones = crearLiquidacionRepository(pool);
  const auspiciadores = crearAuspiciadorRepository(pool);
  const inventario = crearInventarioRepository(pool);
  const reportesFinancieros = crearReporteFinancieroRepository(pool);
  
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

  // --- MÓDULO DE INVENTARIO (RF7 / RF9 / RF13) ---

  // Obtener todos los equipos
  app.get('/api/inventario/equipos', async (req, res, next) => {
    try {
      res.json(await inventario.listarEquipos());
    } catch (error) {
      next(error);
    }
  });

  // Obtener equipo por ID
  app.get('/api/inventario/equipos/:equipoId', async (req, res, next) => {
    try {
      const equipo = await inventario.obtenerEquipoPorId(req.params.equipoId);
      if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
      res.json(equipo);
    } catch (error) {
      next(error);
    }
  });

  // Crear un nuevo equipo (RF9)
  app.post('/api/inventario/equipos', async (req, res, next) => {
    try {
      const nuevoEquipo = await inventario.crearEquipo(req.body || {});
      res.status(201).json(nuevoEquipo);
    } catch (error) {
      next(error);
    }
  });

  // Actualizar el estado de un equipo (RF13: marcar dañados, perdidos, dados de baja)
  app.patch('/api/inventario/equipos/:equipoId/estado', async (req, res, next) => {
    try {
      const { estado } = req.body || {};
      if (!estado || typeof estado !== 'string' || !estado.trim()) {
        return res.status(400).json({ error: 'Se requiere el nuevo estado del equipo' });
      }

      const equipoActualizado = await inventario.actualizarEstadoEquipo(req.params.equipoId, estado.trim());
      if (!equipoActualizado) return res.status(404).json({ error: 'Equipo no encontrado' });

      res.json(equipoActualizado);
    } catch (error) {
      next(error);
    }
  });

  // Obtener todos los kits con sus equipos (RF7)
  app.get('/api/inventario/kits', async (req, res, next) => {
    try {
      res.json(await inventario.listarKits());
    } catch (error) {
      next(error);
    }
  });

  // Crear un nuevo kit (RF7)
  app.post('/api/inventario/kits', async (req, res, next) => {
    try {
      const nuevoKit = await inventario.crearKit(req.body || {});
      res.status(201).json(nuevoKit);
    } catch (error) {
      next(error);
    }
  });

  // Asignar o desasignar un equipo a un kit (RF7)
  app.patch('/api/inventario/equipos/:equipoId/kit', async (req, res, next) => {
    try {
      const { kitId } = req.body || {};
      const equipoActualizado = await inventario.asignarEquipoAKit(req.params.equipoId, kitId);
      if (!equipoActualizado) return res.status(404).json({ error: 'Equipo no encontrado' });

      res.json(equipoActualizado);
    } catch (error) {
      next(error);
    }
  });

  // --- FIN MÓDULO DE INVENTARIO ---

  app.param('id', (req, res, next, id) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Identificador de evento inválido' });
    }
    next();
  });
  app.get('/api/eventos/:id', async (req, res, next) => {
    try {
      res.json(await operacion.obtenerEvento(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  // RF8: Registro de auspiciadores y canjes.
  app.get('/api/auspiciadores', async (req, res, next) => {
    try {
      res.json(await auspiciadores.listarAuspiciadores());
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auspiciadores', async (req, res, next) => {
    try {
      const resultado = await auspiciadores.crearAuspiciador(req.body || {});
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/eventos/:id/canjes', async (req, res, next) => {
    try {
      res.json(await auspiciadores.listarCanjesEvento(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/eventos/:id/canjes', async (req, res, next) => {
    try {
      const resultado = await auspiciadores.registrarCanje({
        ...req.body,
        eventoId: req.params.id,
      });

      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
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

  // --- MÓDULO DE KITS Y ECONOMÍA (Rama Dev - RF5) ---

  app.get('/api/kits', async (req, res, next) => {
    try { res.json(await kits.listarKits()); } catch (err) { next(err); }
  });

  app.post('/api/kits', async (req, res, next) => {
    try { res.status(201).json(await kits.crearKit(req.body || {})); } catch (err) { next(err); }
  });

  app.get('/api/configuracion/premium', async (req, res, next) => {
    try { res.json(await kits.obtenerConfiguracion()); } catch (err) { next(err); }
  });

  app.post('/api/configuracion/premium', async (req, res, next) => {
    try { res.status(201).json(await kits.configurarPremium(req.body || {})); } catch (err) { next(err); }
  });

  app.get('/api/eventos/:id/economia', async (req, res, next) => {
    try { res.json(await kits.obtenerDetalle(req.params.id)); } catch (err) { next(err); }
  });

  app.put('/api/eventos/:id/kit', async (req, res, next) => {
    try {
      res.json(await kits.asignarKit({ eventoId: req.params.id, kitId: req.body?.kitId, versionEvento: version(req) }));
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/eventos/:id/precio-base', async (req, res, next) => {
    try {
      res.json(await kits.actualizarPrecioBase({ eventoId: req.params.id, precioBase: req.body?.precioBase, versionEvento: version(req) }));
    } catch (err) {
      next(err);
    }
  });

  // --- FIN MÓDULO DE KITS Y ECONOMÍA ---

  // RF14: Dashboard financiero. Los montos se calculan en PostgreSQL y nunca son fijos.
  app.get('/api/reportes/financiero', async (req, res, next) => {
    try {
      res.json(await reportesFinancieros.obtenerDashboard(req.query));
    } catch (err) { next(err); }
  });

  // Persistencia de gastos para RF14 (debe protegerse con permisos de Contador/RF1).
  app.get('/api/eventos/:id/gastos', async (req, res, next) => {
    try { res.json(await reportesFinancieros.listarGastos(req.params.id)); }
    catch (err) { next(err); }
  });

  app.post('/api/eventos/:id/gastos', async (req, res, next) => {
    try {
      res.status(201).json(await reportesFinancieros.registrarGasto({
        ...req.body, eventoId: req.params.id,
      }));
    } catch (err) { next(err); }
  });



  app.use((req, res) => res.status(404).json({ error: 'Ruta inexistente' }));

  app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
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