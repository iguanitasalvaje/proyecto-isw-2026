const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const rf1Routes = require('../routes/rf1Routes');
const { ROLES } = require('../config/roles');

// Despacha peticiones al router de prueba directamente
async function probarAcceso(usuario, ruta) {
  return new Promise((resolve) => {
    const app = express();

    app.use((req, res, next) => {
      req.user = usuario;
      next();
    });

    app.use('/api/rf1', rf1Routes);

    const req = {
      method: 'GET',
      url: `/api/rf1${ruta}`,
      headers: {}
    };

    let statusCode = 200;
    const cabeceras = {};

    const res = {
      headersSent: false,
      setHeader(name, val) { cabeceras[name.toLowerCase()] = val; },
      getHeader(name) { return cabeceras[name.toLowerCase()]; },
      status(code) {
        statusCode = code;
        return this;
      },
      json() {
        resolve(statusCode);
      },
      end() {
        resolve(statusCode);
      }
    };

    app.handle(req, res, () => {
      resolve(404);
    });
  });
}

// Prueba 1: Dueño puede acceder a Eventos (200)
test('Dueño puede acceder a Eventos', async () => {
  const estado = await probarAcceso({ rol: ROLES.DUENO }, '/eventos');
  assert.equal(estado, 200);
});

// Prueba 2: Contador puede acceder a Eventos según Matriz Definitiva (200)
test('Contador puede acceder a Eventos', async () => {
  const estado = await probarAcceso({ rol: ROLES.CONTADOR }, '/eventos');
  assert.equal(estado, 200);
});

// Prueba 3: Jefe Técnico NO puede acceder a Eventos (403)
test('Jefe Técnico no puede acceder a Eventos', async () => {
  const estado = await probarAcceso({ rol: ROLES.JEFE_TECNICO }, '/eventos');
  assert.equal(estado, 403);
});

// Prueba 4: Usuario sin sesión no puede acceder a Eventos (401)
test('Usuario sin sesión no puede acceder a Eventos', async () => {
  const estado = await probarAcceso(null, '/eventos');
  assert.equal(estado, 401);
});

// Prueba 5: Dueño puede acceder a Finanzas (200)
test('Dueño puede acceder a Finanzas', async () => {
  const estado = await probarAcceso({ rol: ROLES.DUENO }, '/finanzas');
  assert.equal(estado, 200);
});

// Prueba 6: Contador puede acceder a Finanzas (200)
test('Contador puede acceder a Finanzas', async () => {
  const estado = await probarAcceso({ rol: ROLES.CONTADOR }, '/finanzas');
  assert.equal(estado, 200);
});

// Prueba 7: Jefe Técnico no puede acceder a Finanzas (403)
test('Jefe Técnico no puede acceder a Finanzas', async () => {
  const estado = await probarAcceso({ rol: ROLES.JEFE_TECNICO }, '/finanzas');
  assert.equal(estado, 403);
});

// Prueba 8: Dueño puede acceder a Inventario según Matriz Definitiva (200)
test('Dueño puede acceder a Inventario', async () => {
  const estado = await probarAcceso({ rol: ROLES.DUENO }, '/inventario');
  assert.equal(estado, 200);
});

// Prueba 9: Jefe Técnico puede acceder a Inventario (200)
test('Jefe Técnico puede acceder a Inventario', async () => {
  const estado = await probarAcceso({ rol: ROLES.JEFE_TECNICO }, '/inventario');
  assert.equal(estado, 200);
});

// Prueba 10: Contador NO puede acceder a Inventario (403)
test('Contador no puede acceder a Inventario', async () => {
  const estado = await probarAcceso({ rol: ROLES.CONTADOR }, '/inventario');
  assert.equal(estado, 403);
});

// Prueba 11: Dueño puede acceder a Auspiciadores (200)
test('Dueño puede acceder a Auspiciadores', async () => {
  const estado = await probarAcceso({ rol: ROLES.DUENO }, '/auspiciadores');
  assert.equal(estado, 200);
});

// Prueba 12: Contador puede acceder a Auspiciadores según Matriz Definitiva (200)
test('Contador puede acceder a Auspiciadores', async () => {
  const estado = await probarAcceso({ rol: ROLES.CONTADOR }, '/auspiciadores');
  assert.equal(estado, 200);
});

// Prueba 13: Jefe Técnico NO puede acceder a Auspiciadores (403)
test('Jefe Técnico no puede acceder a Auspiciadores', async () => {
  const estado = await probarAcceso({ rol: ROLES.JEFE_TECNICO }, '/auspiciadores');
  assert.equal(estado, 403);
});

// Prueba 14: Dueño puede acceder a Calculadora de Pagos (200)
test('Dueño puede acceder a Calculadora de Pagos', async () => {
  const estado = await probarAcceso({ rol: ROLES.DUENO }, '/calculadora-pagos');
  assert.equal(estado, 200);
});

// Prueba 15: Contador puede acceder a Calculadora de Pagos según Matriz Definitiva (200)
test('Contador puede acceder a Calculadora de Pagos', async () => {
  const estado = await probarAcceso({ rol: ROLES.CONTADOR }, '/calculadora-pagos');
  assert.equal(estado, 200);
});

// Prueba 16: Jefe Técnico NO puede acceder a Calculadora de Pagos (403)
test('Jefe Técnico no puede acceder a Calculadora de Pagos', async () => {
  const estado = await probarAcceso({ rol: ROLES.JEFE_TECNICO }, '/calculadora-pagos');
  assert.equal(estado, 403);
});
