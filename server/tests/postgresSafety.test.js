'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { conBaseTemporal } = require('./helpers/postgres');

const env = { DATABASE_URL: 'postgresql://uso/base', TEST_DATABASE_URL: 'postgresql://test/base' };
function simular({ iguales = false, invalida = false, errorConexion = false } = {}) {
  const eventos = [];
  const factory = ({ connectionString, schema }) => {
    const esUso = connectionString === env.DATABASE_URL;
    const registrar = sql => {
      eventos.push({ sql, esUso, schema });
      return { rows: [{ db: esUso || iguales ? 'uso' : 'pruebas', host: invalida ? null : '127.0.0.1', port: 5432 }] };
    };
    return {
      async connect() {
        if (errorConexion) throw new Error('detalle privado de conexión');
        return { query: async sql => registrar(sql), release() { eventos.push({ release: true }); } };
      },
      query: async sql => registrar(sql),
      async end() { eventos.push({ end: true }); }
    };
  };
  return { factory, eventos };
}
for (const variable of ['TEST_DATABASE_URL', 'DATABASE_URL']) {
  test(`rechaza ${variable} ausente sin abrir conexiones`, async () => {
    const config = { ...env }; delete config[variable];
    await assert.rejects(conBaseTemporal(() => assert.fail('No debe escribir'), {
      env: config, factory() { assert.fail('No debe abrir conexiones'); }
    }), new RegExp(variable));
  });
}
for (const [nombre, opciones] of [
  ['misma base aunque las URLs tengan hosts distintos', { iguales: true }],
  ['identidad no verificable', { invalida: true }],
  ['error de conexión', { errorConexion: true }]
]) {
  test(`rechaza ${nombre} antes de cualquier escritura`, async () => {
    const mock = simular(opciones);
    await assert.rejects(conBaseTemporal(() => assert.fail('No debe ejecutar el cuerpo'), {
      env, factory: mock.factory, aplicarMigraciones() { assert.fail('No debe migrar'); }
    }), /^Error: No se pudo verificar/);
    assert.ok(mock.eventos.every(e => !e.sql || /^(BEGIN READ ONLY|SELECT |ROLLBACK)/.test(e.sql)));
    assert.ok(mock.eventos.some(e => e.end));
  });
}
test('bases distintas: verifica antes de escribir y limpia solo el esquema propio', async () => {
  const mock = simular();
  await conBaseTemporal(async (pool, schema) => {
    assert.match(schema, /^test_pg_[a-f0-9]+$/);
    await pool.query('SELECT 1');
  }, { env, factory: mock.factory, aplicarMigraciones: async pool => pool.query('MIGRACION_SIMULADA') });
  const sql = mock.eventos.filter(e => e.sql);
  const crear = sql.findIndex(e => e.sql.startsWith('CREATE SCHEMA'));
  assert.equal(sql.slice(0, crear).filter(e => e.sql.startsWith('SELECT current_database')).length, 2);
  assert.ok(sql.filter(e => e.esUso).every(e => /^(BEGIN READ ONLY|SELECT |ROLLBACK)/.test(e.sql)));
  const schema = sql[crear].sql.slice('CREATE SCHEMA '.length);
  assert.equal(sql.at(-1).sql, `DROP SCHEMA ${schema} CASCADE`);
  assert.ok(sql.filter(e => e.schema).every(e => e.schema === schema));
});
test('error en la prueba cierra pools y limpia su esquema', async () => {
  const mock = simular();
  await assert.rejects(conBaseTemporal(async () => { throw new Error('fallo simulado'); }, {
    env, factory: mock.factory, migraciones: false
  }), /fallo simulado/);
  assert.ok(mock.eventos.some(e => e.sql?.startsWith('DROP SCHEMA test_pg_')));
  assert.equal(mock.eventos.filter(e => e.end).length, 4);
});
