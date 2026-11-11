'use strict';

const express = require('express');
const cors = require('cors');
const { crearKitRepository } = require('./repositories/kitRepository');
const { crearOperacionRepository } = require('./repositories/operacionRepository');
const { crearLiquidacionRepository } = require('./repositories/liquidacionRepository');
const { crearUsuarioRepository } = require('./repositories/usuarioRepository');
const { crearAutenticarToken } = require('./middleware/autenticarToken');
const autorizarRol = require('./middleware/autorizarRol');
const { ROLES } = require('./config/roles');
const { crearAuthRoutes } = require('./routes/authRoutes');
const { crearUsuarioRoutes } = require('./routes/usuarioRoutes');

function crearApp(pool, { requerirAutenticacion = true } = {}) {
  const app = express();
  const kits = crearKitRepository(pool);
  const operacion = crearOperacionRepository(pool);
  const liquidaciones = crearLiquidacionRepository(pool);
  const usuarios = crearUsuarioRepository(pool);

  // Middleware de autenticación de token JWT
  const autenticarToken = requerirAutenticacion
    ? crearAutenticarToken(usuarios)
    : (req, res, next) => {
        // Modo bypass exclusivo para pruebas unitarias de HTTP previo si se solicita
        req.user = req.user || { id: 'test-admin', rol: ROLES.DUENO, email: 'admin@sixseven.cl' };
        next();
      };

  app.use(cors());
  app.use(express.json({ limit: '64kb' }));

  // 1. Estado del servidor (público)
  app.get('/api', (req, res) => res.json({
    status: 'ok',
    mensaje: 'Servidor del proyecto funcionando correctamente'
  }));

  // 2. Rutas de autenticación pública y perfil (/api/auth/login, /api/auth/me)
  app.use('/api/auth', crearAuthRoutes({ usuarioRepository: usuarios, autenticarToken }));

  // 3. Rutas de administración de usuarios (/api/usuarios) - Exclusivo para el Dueño
  app.use('/api/usuarios', crearUsuarioRoutes({ usuarioRepository: usuarios, autenticarToken, autorizarRol }));

  // Middlewares de autorización por área operativa (según Matriz Definitiva de Permisos)
  // Eventos y Finanzas: Dueño y Contador
  const authEventosFinanzas = [autenticarToken, autorizarRol(ROLES.DUENO, ROLES.CONTADOR)];

  // Inventario: Dueño y Jefe Técnico para modificaciones operativas
  const authInventarioModificacion = [autenticarToken, autorizarRol(ROLES.DUENO, ROLES.JEFE_TECNICO)];

  // Catálogo de Kits: Dueño, Jefe Técnico y Contador (Finanzas necesita kits para liquidación y economía)
  const authKitsLectura = [autenticarToken, autorizarRol(ROLES.DUENO, ROLES.JEFE_TECNICO, ROLES.CONTADOR)];

  // Rutas de Eventos (Dueño y Contador)
  app.get('/api/eventos', authEventosFinanzas, async (req, res, next) => {
    try { res.json(await operacion.listarEventos()); } catch (e) { next(e); }
  });

  app.get('/api/personas', authEventosFinanzas, async (req, res, next) => {
    try { res.json(await operacion.listarPersonas()); } catch (e) { next(e); }
  });

  app.get('/api/roles', authEventosFinanzas, async (req, res, next) => {
    try { res.json(await operacion.listarRoles()); } catch (e) { next(e); }
  });

  app.param('id', (req, res, next, id) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Identificador de evento inválido' });
    }
    next();
  });

  app.get('/api/eventos/:id', authEventosFinanzas, async (req, res, next) => {
    try { res.json(await operacion.obtenerEvento(req.params.id)); } catch (e) { next(e); }
  });

  app.get('/api/eventos/:id/asignaciones', authEventosFinanzas, async (req, res, next) => {
    try {
      await operacion.obtenerEvento(req.params.id);
      res.json(await operacion.listarAsignaciones(req.params.id));
    } catch (e) { next(e); }
  });

  const version = req => {
    const v = req.body?.versionEvento;
    if (!Number.isInteger(v) || v < 1) throw new TypeError('Se requiere versionEvento entera positiva');
    return v;
  };

  app.patch('/api/eventos/:id/asignaciones/porcentajes', authEventosFinanzas, async (req, res, next) => {
    try {
      res.json(await operacion.editarPorcentajes({
        eventoId: req.params.id,
        cambios: req.body?.cambios,
        versionEvento: version(req)
      }));
    } catch (e) { next(e); }
  });

  app.patch('/api/eventos/:id/estado', authEventosFinanzas, async (req, res, next) => {
    try {
      res.json(await operacion.cambiarEstado({
        eventoId: req.params.id,
        estado: req.body?.estado,
        versionEvento: version(req)
      }));
    } catch (e) { next(e); }
  });

  // Rutas de Liquidaciones (Dueño y Contador)
  app.post('/api/eventos/:id/liquidacion/previsualizacion', authEventosFinanzas, async (req, res, next) => {
    try {
      res.json(await liquidaciones.previsualizar(req.params.id, version(req)));
    } catch (e) { next(e); }
  });

  app.post('/api/eventos/:id/liquidacion', authEventosFinanzas, async (req, res, next) => {
    try {
      res.status(201).json(await liquidaciones.registrar(req.params.id, version(req)));
    } catch (e) { next(e); }
  });

  app.get('/api/eventos/:id/liquidacion', authEventosFinanzas, async (req, res, next) => {
    try {
      await operacion.obtenerEvento(req.params.id);
      const resultado = await liquidaciones.obtener(req.params.id);
      if (!resultado) return res.status(404).json({ error: 'Liquidación inexistente' });
      res.json(resultado);
    } catch (e) { next(e); }
  });

  // Rutas de Kits e Inventario (Dueño y Jefe Técnico para modificar, Contador puede consultar)
  app.get('/api/kits', authKitsLectura, async (req, res, next) => {
    try { res.json(await kits.listarKits()); } catch (e) { next(e); }
  });

  app.post('/api/kits', authInventarioModificacion, async (req, res, next) => {
    try { res.status(201).json(await kits.crearKit(req.body || {})); } catch (e) { next(e); }
  });

  app.get('/api/configuracion/premium', authKitsLectura, async (req, res, next) => {
    try { res.json(await kits.obtenerConfiguracion()); } catch (e) { next(e); }
  });

  app.post('/api/configuracion/premium', authInventarioModificacion, async (req, res, next) => {
    try { res.status(201).json(await kits.configurarPremium(req.body || {})); } catch (e) { next(e); }
  });

  // Economía y asignación de Kits en Eventos (Dueño y Contador)
  app.get('/api/eventos/:id/economia', authEventosFinanzas, async (req, res, next) => {
    try { res.json(await kits.obtenerDetalle(req.params.id)); } catch (e) { next(e); }
  });

  app.put('/api/eventos/:id/kit', authEventosFinanzas, async (req, res, next) => {
    try {
      res.json(await kits.asignarKit({
        eventoId: req.params.id,
        kitId: req.body?.kitId,
        versionEvento: version(req)
      }));
    } catch (e) { next(e); }
  });

  app.patch('/api/eventos/:id/precio-base', authEventosFinanzas, async (req, res, next) => {
    try {
      res.json(await kits.actualizarPrecioBase({
        eventoId: req.params.id,
        precioBase: req.body?.precioBase,
        versionEvento: version(req)
      }));
    } catch (e) { next(e); }
  });

  // Ruta 404
  app.use((req, res) => res.status(404).json({ error: 'Ruta inexistente' }));

  // Manejador global de errores
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
