'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { crearPool } = require('../db/pool');
const { migrar } = require('../db/migrate');
const { crearOperacionRepository } = require('../repositories/operacionRepository');
const { crearLiquidacionRepository } = require('../repositories/liquidacionRepository');

test('persistencia RF12 contra PostgreSQL real', async t => {
  // Nunca usa DATABASE_URL como alternativa ni se omite silenciosamente.
  assert.ok(process.env.TEST_DATABASE_URL, 'Falta TEST_DATABASE_URL: se requiere una base PostgreSQL exclusiva de test');
  const schema = `rf12_test_${randomUUID().replaceAll('-', '')}`;
  const admin = crearPool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = crearPool({ connectionString: process.env.TEST_DATABASE_URL, schema });
  let creado = false;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    creado = true;
    await migrar(pool);
    const op = crearOperacionRepository(pool);
    const liquidaciones = crearLiquidacionRepository(pool);

    await t.test('migraciones idempotentes y base vacía', async () => {
      await migrar(pool);
      assert.equal((await pool.query('SELECT * FROM schema_migrations')).rowCount, 1);
      for (const tabla of ['evento', 'persona', 'rol_evento', 'valor_rol', 'asignacion_evento', 'liquidacion', 'detalle_liquidacion']) {
        assert.equal((await pool.query(`SELECT * FROM ${tabla}`)).rowCount, 0);
      }
    });

    // Dos personas/eventos, exclusivamente fixtures de este esquema temporal.
    const a = await op.crearEvento({ nombre: 'Evento de test A', montoTotalEvento: 350000 });
    const b = await op.crearEvento({ nombre: 'Evento de test B', montoTotalEvento: 10001 });
    const persona = await op.crearPersona({ nombre: 'Persona de test 1' });
    const otra = await op.crearPersona({ nombre: 'Persona de test 2' });
    const camara = await op.crearRol({ nombre: 'Cámara de test' });
    const sonido = await op.crearRol({ nombre: 'Sonido de test' });
    const anterior = await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 1000, vigenteDesde: '2020-01-01T00:00:00Z' });
    await op.agregarValorRol({ rolId: sonido.id, porcentajeCentesimas: 2000, vigenteDesde: '2020-01-01T00:00:00Z' });
    const asignacion = await op.asignar({ eventoId: a.id, personaId: persona.id, rolId: camara.id });
    await op.asignar({ eventoId: b.id, personaId: persona.id, rolId: sonido.id });

    await t.test('consultas y roles diferentes para la misma persona', async () => {
      assert.equal((await op.listarEventos()).length, 2);
      assert.equal((await op.listarPersonas()).length, 2);
      assert.equal((await op.listarRoles()).length, 2);
      assert.equal((await op.listarAsignaciones(a.id))[0].id, asignacion.id);
      assert.equal((await liquidaciones.previsualizar(a.id, '2021-01-01')).totalDistribuido, 35000);
      assert.equal((await liquidaciones.previsualizar(b.id, '2021-01-01')).totalDistribuido, 2000);
    });

    await t.test('restricciones de monto, referencias, roles y duplicados', async () => {
      await assert.rejects(op.crearEvento({ nombre: 'Inválido', montoTotalEvento: 0 }));
      await assert.rejects(pool.query('INSERT INTO evento(id,nombre,monto_total) VALUES ($1,$2,$3)', [randomUUID(), 'Inválido', -1]), { code: '23514' });
      await assert.rejects(op.crearRol({ nombre: ' cámara de test ' }), { code: '23505' });
      await assert.rejects(op.asignar({ eventoId: a.id, personaId: persona.id, rolId: sonido.id }), { code: '23505' });
      await assert.rejects(op.asignar({ eventoId: a.id, personaId: randomUUID(), rolId: sonido.id }), { code: '23503' });
      await assert.rejects(op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 10001, vigenteDesde: '2021-01-01' }));
      await assert.rejects(pool.query('INSERT INTO valor_rol(id,rol_id,porcentaje_centesimas,vigente_desde) VALUES ($1,$2,10001,now())', [randomUUID(), camara.id]), { code: '23514' });
    });

    await t.test('selecciona porcentaje por vigencia sin modificar registros anteriores', async () => {
      const nuevo = await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 1025, vigenteDesde: '2022-01-01T00:00:00Z' });
      const futuro = await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 9900, vigenteDesde: '9999-01-01T00:00:00Z' });
      assert.equal((await liquidaciones.previsualizar(a.id, '2021-01-01')).detalles[0].valorRolId, anterior.id);
      assert.equal((await liquidaciones.previsualizar(a.id, '2023-01-01')).detalles[0].valorRolId, nuevo.id);
      assert.equal((await liquidaciones.previsualizar(a.id, '9999-01-02')).detalles[0].valorRolId, futuro.id);
      await assert.rejects(op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 2000, vigenteDesde: '2022-01-01T00:00:00Z' }), { code: '23505' });
    });

    let registrada;
    await t.test('guarda cabecera/detalles y los recupera desde otra conexión', async () => {
      registrada = await liquidaciones.registrar(a.id);
      assert.equal(registrada.totalDistribuido, 35875);
      const otraConexion = crearPool({ connectionString: process.env.TEST_DATABASE_URL, schema });
      try {
        assert.deepEqual(await crearLiquidacionRepository(otraConexion).obtener(a.id), registrada);
      } finally { await otraConexion.end(); }
    });

    await t.test('rechaza segunda liquidación y conserva instantánea histórica', async () => {
      await assert.rejects(liquidaciones.registrar(a.id), { code: '23505' });
      await pool.query('UPDATE persona SET nombre=$1 WHERE id=$2', ['Nombre cambiado', persona.id]);
      await pool.query('UPDATE rol_evento SET nombre=$1 WHERE id=$2', ['Rol cambiado', camara.id]);
      await op.agregarValorRol({ rolId: camara.id, porcentajeCentesimas: 2500, vigenteDesde: '2023-01-01T00:00:00Z' });
      assert.deepEqual(await liquidaciones.obtener(a.id), registrada);
      await assert.rejects(pool.query('DELETE FROM valor_rol WHERE id=$1', [registrada.detalles[0].valorRolId]), { code: '23503' });
    });

    await t.test('error al insertar detalle revierte cabecera y todos los detalles', async () => {
      await op.asignar({ eventoId: b.id, personaId: otra.id, rolId: camara.id });
      // Fallo de almacenamiento real después del INSERT; no simula PostgreSQL.
      await pool.query(`CREATE FUNCTION rechazar_detalle_test() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Fallo de test'; END; $$`);
      await pool.query(`CREATE TRIGGER fallo_test AFTER INSERT ON detalle_liquidacion
        FOR EACH ROW EXECUTE FUNCTION rechazar_detalle_test()`);
      try { await assert.rejects(liquidaciones.registrar(b.id), { code: 'P0001' }); }
      finally { await pool.query('DROP TRIGGER fallo_test ON detalle_liquidacion'); }
      assert.equal(await liquidaciones.obtener(b.id), null);
      assert.equal((await pool.query('SELECT * FROM detalle_liquidacion WHERE liquidacion_id=$1', [registrada.id])).rowCount, 1);
      const resultado = await liquidaciones.registrar(b.id);
      assert.equal(resultado.detalles.length, 2);
      assert.equal(resultado.totalDistribuido, resultado.detalles.reduce((s, d) => s + d.montoCalculado, 0));
    });

    await t.test('detecta checksum alterado de migración', async () => {
      await pool.query("UPDATE schema_migrations SET checksum='alterado'");
      await assert.rejects(migrar(pool), /Migración aplicada modificada/);
    });
  } finally {
    await pool.end();
    if (creado) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
});
