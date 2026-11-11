'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { ROLES } = require('../config/roles');
const { crearUsuarioRepository } = require('../repositories/usuarioRepository');
const { crearAutenticarToken } = require('../middleware/autenticarToken');
const autorizarRol = require('../middleware/autorizarRol');
const { crearAuthRoutes } = require('../routes/authRoutes');
const { crearUsuarioRoutes } = require('../routes/usuarioRoutes');

process.env.JWT_SECRET = 'secreto_super_seguro_de_pruebas_rf1';

// Función auxiliar para despachar peticiones a routers/middlewares Express en memoria
function despachar(appOrRouter, { method = 'GET', url = '/', headers = {}, body = {}, user = null } = {}) {
  return new Promise((resolve) => {
    let statusCode = 200;
    const cabeceras = {};
    let cuerpoRespuesta = null;

    const req = {
      method,
      url,
      originalUrl: url,
      path: url.split('?')[0],
      headers: { ...headers },
      body,
      params: {},
      user
    };

    const res = {
      headersSent: false,
      setHeader(name, val) {
        cabeceras[name.toLowerCase()] = val;
      },
      getHeader(name) {
        return cabeceras[name.toLowerCase()];
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        cuerpoRespuesta = data;
        resolve({ status: statusCode, body: cuerpoRespuesta, headers: cabeceras });
      },
      end() {
        resolve({ status: statusCode, body: cuerpoRespuesta, headers: cabeceras });
      }
    };

    // Si es una función middleware simple
    if (typeof appOrRouter === 'function' && appOrRouter.length === 3) {
      appOrRouter(req, res, (err) => {
        if (err) {
          const code = err.status || 500;
          resolve({ status: code, body: { error: err.message }, err });
        } else {
          resolve({ status: statusCode, body: cuerpoRespuesta, nextLlamado: true, user: req.user });
        }
      });
      return;
    }

    // Si es un router o app Express
    appOrRouter.handle(req, res, (err) => {
      if (err) {
        const code = err.status || 500;
        resolve({ status: code, body: { error: err.message }, err });
      } else {
        resolve({ status: 404, body: { error: 'Ruta no encontrada' } });
      }
    });
  });
}

// Suite 1: Repositorio de Usuarios
test('RF1 - usuarioRepository', async (t) => {
  const usuariosEnMemoria = new Map();

  const fakePool = {
    async query(sql, params) {
      if (sql.includes('FROM usuario') && sql.includes('WHERE email = $1')) {
        const email = params[0];
        const u = [...usuariosEnMemoria.values()].find((x) => x.email === email);
        return { rowCount: u ? 1 : 0, rows: u ? [u] : [] };
      }

      if (sql.includes('FROM usuario') && sql.includes('WHERE id = $1')) {
        const id = params[0];
        const u = usuariosEnMemoria.get(id);
        return { rowCount: u ? 1 : 0, rows: u ? [u] : [] };
      }

      if (sql.includes('FROM usuario') && sql.includes('ORDER BY creado_en DESC')) {
        return { rowCount: usuariosEnMemoria.size, rows: [...usuariosEnMemoria.values()] };
      }

      if (sql.includes('INSERT INTO usuario')) {
        const [id, email, passwordHash, rol] = params;
        if ([...usuariosEnMemoria.values()].some((x) => x.email === email)) {
          const err = new Error('duplicate key');
          err.code = '23505';
          throw err;
        }
        const nuevo = { id, email, password_hash: passwordHash, rol, activo: true, creado_en: new Date() };
        usuariosEnMemoria.set(id, nuevo);
        return { rowCount: 1, rows: [nuevo] };
      }

      if (sql.includes('UPDATE usuario') && sql.includes('SET email = $1,') && sql.includes('rol = $2')) {
        const [email, rol, id] = params;
        const u = usuariosEnMemoria.get(id);
        if (!u) return { rowCount: 0, rows: [] };
        u.email = email;
        u.rol = rol;
        return { rowCount: 1, rows: [u] };
      }

      if (sql.includes('UPDATE usuario') && sql.includes('SET activo = $1')) {
        const [activo, id] = params;
        const u = usuariosEnMemoria.get(id);
        if (!u) return { rowCount: 0, rows: [] };
        u.activo = activo;
        return { rowCount: 1, rows: [u] };
      }

      if (sql.includes('UPDATE usuario') && sql.includes('SET password_hash = $1')) {
        const [passwordHash, id] = params;
        const u = usuariosEnMemoria.get(id);
        if (!u) return { rowCount: 0, rows: [] };
        u.password_hash = passwordHash;
        return { rowCount: 1, rows: [u] };
      }

      return { rowCount: 0, rows: [] };
    }
  };

  const repo = crearUsuarioRepository(fakePool);

  await t.test('no permite crear usuario con rol DUENO', async () => {
    await assert.rejects(
      () => repo.crear({ email: 'dueno@test.cl', passwordHash: 'hash', rol: ROLES.DUENO }),
      /No está permitido crear cuentas con rol Dueño/
    );
  });

  await t.test('no permite crear usuario con rol desconocido', async () => {
    await assert.rejects(
      () => repo.crear({ email: 'inv@test.cl', passwordHash: 'hash', rol: 'ADMIN_DESCONOCIDO' }),
      /Rol inválido/
    );
  });

  await t.test('permite crear Contador y normaliza correo a minúsculas', async () => {
    const contador = await repo.crear({ email: '  Conta1@Empresa.CL ', passwordHash: 'hash123', rol: ROLES.CONTADOR });
    assert.equal(contador.email, 'conta1@empresa.cl');
    assert.equal(contador.rol, ROLES.CONTADOR);
  });

  await t.test('rechaza correo duplicado con error 409', async () => {
    await assert.rejects(
      () => repo.crear({ email: 'conta1@empresa.cl', passwordHash: 'hash123', rol: ROLES.CONTADOR }),
      (err) => err.status === 409
    );
  });

  await t.test('impide modificar o desactivar la cuenta del Dueño', async () => {
    usuariosEnMemoria.set('id-dueno', { id: 'id-dueno', email: 'jefe@empresa.cl', rol: ROLES.DUENO, activo: true });

    await assert.rejects(
      () => repo.actualizar({ id: 'id-dueno', email: 'nuevo@empresa.cl', rol: ROLES.CONTADOR }),
      /No está permitido modificar la cuenta del Dueño/
    );

    await assert.rejects(
      () => repo.cambiarEstado({ id: 'id-dueno', activo: false }),
      /No está permitido desactivar la cuenta del Dueño/
    );
  });
});

// Suite 2: Middleware autenticarToken y autorizarRol
test('RF1 - Middlewares de autenticación y autorización', async (t) => {
  const usuariosFake = {
    async buscarPorId(id) {
      if (id === 'user-activo') return { id: 'user-activo', email: 'activo@test.cl', rol: ROLES.CONTADOR, activo: true };
      if (id === 'user-inactivo') return { id: 'user-inactivo', email: 'inactivo@test.cl', rol: ROLES.JEFE_TECNICO, activo: false };
      return null;
    }
  };

  const autenticar = crearAutenticarToken(usuariosFake);

  await t.test('rechaza petición sin cabecera Authorization con 401', async () => {
    const r = await despachar(autenticar, { headers: {} });
    assert.equal(r.status, 401);
    assert.match(r.body.error, /Debes iniciar sesión/);
  });

  await t.test('rechaza token JWT corrupto o inválido con 401', async () => {
    const r = await despachar(autenticar, { headers: { authorization: 'Bearer token-falso' } });
    assert.equal(r.status, 401);
    assert.match(r.body.error, /Token inválido/);
  });

  await t.test('rechaza sesión de usuario desactivado con 401', async () => {
    const token = jwt.sign({ id: 'user-inactivo' }, process.env.JWT_SECRET);
    const r = await despachar(autenticar, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(r.status, 401);
    assert.match(r.body.error, /desactivada/);
  });

  await t.test('acepta token válido de usuario activo y carga req.user', async () => {
    const token = jwt.sign({ id: 'user-activo' }, process.env.JWT_SECRET);
    const r = await despachar(autenticar, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(r.nextLlamado, true);
    assert.equal(r.user.rol, ROLES.CONTADOR);
  });

  await t.test('autorizarRol permite rol autorizado y bloquea rol no autorizado con 403', async () => {
    const soloDueno = autorizarRol(ROLES.DUENO);

    const rBloqueado = await despachar(soloDueno, { user: { rol: ROLES.CONTADOR } });
    assert.equal(rBloqueado.status, 403);
    assert.match(rBloqueado.body.error, /No tienes permisos/);

    const rPermitido = await despachar(soloDueno, { user: { rol: ROLES.DUENO } });
    assert.equal(rPermitido.nextLlamado, true);
  });
});

// Suite 3: Endpoints de Autenticación y Login
test('RF1 - Endpoints de Login y Me (/api/auth)', async (t) => {
  const hashValido = await bcrypt.hash('PasswordSeguro123!', 10);
  const usuariosFake = {
    async buscarPorEmail(email) {
      if (email === 'dueno@sixseven.cl') {
        return { id: 'd-1', email: 'dueno@sixseven.cl', password_hash: hashValido, rol: ROLES.DUENO, activo: true };
      }
      if (email === 'inactivo@sixseven.cl') {
        return { id: 'i-1', email: 'inactivo@sixseven.cl', password_hash: hashValido, rol: ROLES.CONTADOR, activo: false };
      }
      return null;
    },
    async buscarPorId(id) {
      if (id === 'd-1') return { id: 'd-1', email: 'dueno@sixseven.cl', rol: ROLES.DUENO, activo: true };
      return null;
    }
  };

  const autenticar = crearAutenticarToken(usuariosFake);
  const authRoutes = crearAuthRoutes({ usuarioRepository: usuariosFake, autenticarToken: autenticar });

  await t.test('rechaza login con datos vacíos (400)', async () => {
    const r = await despachar(authRoutes, { method: 'POST', url: '/login', body: {} });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /Debes ingresar correo y contraseña/);
  });

  await t.test('rechaza login con usuario inexistente (401)', async () => {
    const r = await despachar(authRoutes, { method: 'POST', url: '/login', body: { email: 'nadie@test.cl', password: 'pass' } });
    assert.equal(r.status, 401);
  });

  await t.test('rechaza login con contraseña incorrecta (401)', async () => {
    const r = await despachar(authRoutes, { method: 'POST', url: '/login', body: { email: 'dueno@sixseven.cl', password: 'claveIncorrecta' } });
    assert.equal(r.status, 401);
  });

  await t.test('rechaza login de usuario desactivado (401)', async () => {
    const r = await despachar(authRoutes, { method: 'POST', url: '/login', body: { email: 'inactivo@sixseven.cl', password: 'PasswordSeguro123!' } });
    assert.equal(r.status, 401);
  });

  await t.test('permite login exitoso y devuelve token JWT y usuario sin hash (200)', async () => {
    const r = await despachar(authRoutes, { method: 'POST', url: '/login', body: { email: 'dueno@sixseven.cl', password: 'PasswordSeguro123!' } });
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
    assert.equal(r.body.usuario.email, 'dueno@sixseven.cl');
    assert.equal(r.body.usuario.rol, ROLES.DUENO);
    assert.equal(r.body.usuario.password_hash, undefined);
  });
});

// Suite 4: Verificación de la Matriz Definitiva de Permisos
test('RF1 - Verificación de la Matriz Definitiva de Permisos', async (t) => {
  const { PERMISOS } = require('../config/roles');

  await t.test('Dueño tiene acceso completo a todos los módulos', () => {
    const modulosEsperados = [
      'dashboard', 'eventos', 'inventario', 'personal',
      'auspiciadores', 'finanzas', 'reportes', 'calculadora-pagos'
    ];
    for (const mod of modulosEsperados) {
      assert.ok(PERMISOS[ROLES.DUENO].includes(mod), `Dueño debe tener acceso a ${mod}`);
    }
  });

  await t.test('Contador tiene acceso a Eventos, Finanzas, Auspiciadores, Reportes y Calculadora de Pagos', () => {
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('inventario'), false);
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('personal'), false);
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('eventos'), true);
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('finanzas'), true);
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('auspiciadores'), true);
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('reportes'), true);
    assert.equal(PERMISOS[ROLES.CONTADOR].includes('calculadora-pagos'), true);
  });

  await t.test('Jefe Técnico solo tiene acceso a Dashboard e Inventario', () => {
    assert.deepEqual([...PERMISOS[ROLES.JEFE_TECNICO]].sort(), ['dashboard', 'inventario'].sort());
  });
});
