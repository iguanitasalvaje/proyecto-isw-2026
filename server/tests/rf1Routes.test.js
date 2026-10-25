const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const rf1Routes = require('../routes/rf1Routes');
const { ROLES } = require('../config/roles');

// Crea un servidor de pruebas con un usuario simulado.
async function probarAcceso(usuario, ruta) {
  const app = express();

  // Simulación exclusiva de las pruebas.
  app.use((req, res, next) => {
    req.user = usuario;
    next();
  });

  app.use('/api/rf1', rf1Routes);

  const servidor = app.listen(0);

  try {
    const puerto = servidor.address().port;

    const respuesta = await fetch(
      `http://127.0.0.1:${puerto}/api/rf1${ruta}`
    );

    return respuesta.status;
  } finally {
    await new Promise((resolve) => servidor.close(resolve));
  }
}

// Prueba 1: acceso autorizado.
test('Dueño puede acceder a Eventos', async () => {
  const estado = await probarAcceso(
    { rol: ROLES.DUENO },
    '/eventos'
  );

  assert.equal(estado, 200);
});

// Prueba 2: acceso prohibido.
test('Contador no puede acceder a Eventos', async () => {
  const estado = await probarAcceso(
    { rol: ROLES.CONTADOR },
    '/eventos'
  );

  assert.equal(estado, 403);
});

// Prueba 3: usuario sin autenticar.
test('Usuario sin sesión no puede acceder a Eventos', async () => {
  const estado = await probarAcceso(null, '/eventos');

  assert.equal(estado, 401);
});

// Prueba 4: el Contador puede acceder a Finanzas.
test('Contador puede acceder a Finanzas', async () => {
  const estado = await probarAcceso(
    { rol: ROLES.CONTADOR },
    '/finanzas'
  );

  assert.equal(estado, 200);
});

// Prueba 5: el Jefe Técnico no puede acceder a Finanzas.
test('Jefe Técnico no puede acceder a Finanzas', async () => {
  const estado = await probarAcceso(
    { rol: ROLES.JEFE_TECNICO },
    '/finanzas'
  );

  assert.equal(estado, 403);
});

// Prueba 6: el Jefe Técnico puede acceder a Inventario.
test('Jefe Técnico puede acceder a Inventario', async () => {
  const estado = await probarAcceso(
    { rol: ROLES.JEFE_TECNICO },
    '/inventario'
  );

  assert.equal(estado, 200);
});

// Prueba 7: el Dueño no puede acceder a Inventario.
test('Dueño no puede acceder a Inventario', async () => {
  const estado = await probarAcceso(
    { rol: ROLES.DUENO },
    '/inventario'
  );

  assert.equal(estado, 403);
});