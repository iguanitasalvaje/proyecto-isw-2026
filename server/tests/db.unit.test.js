'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { crearPool, enmascararUrl, resolverConfigSsl } = require('../db/pool');
const { conBaseTemporal } = require('./helpers/postgres');

test('Arquitectura PostgreSQL - Pruebas Unitarias sin servidor activo', async (t) => {
  await t.test('enmascararUrl oculta credenciales sensibles', () => {
    const urlConClave = 'postgresql://admin_sixseven:MiClaveSecreta123!@127.0.0.1:5432/sixseven_prod';
    const resultado = enmascararUrl(urlConClave);

    assert.equal(resultado.includes('MiClaveSecreta123!'), false);
    assert.equal(resultado.includes('admin_sixseven:***@127.0.0.1:5432/sixseven_prod'), true);
  });

  await t.test('crearPool valida formato de connectionString', () => {
    assert.throws(
      () => crearPool({ connectionString: '' }),
      /Se requiere una URL PostgreSQL explícita/
    );

    assert.throws(
      () => crearPool({ connectionString: 'mysql://root:pass@localhost:3306/db' }),
      /Se requiere una URL PostgreSQL explícita/
    );

    assert.throws(
      () => crearPool({ connectionString: null }),
      /Se requiere una URL PostgreSQL explícita/
    );
  });

  await t.test('crearPool valida nombre de esquema seguro', () => {
    assert.throws(
      () => crearPool({ connectionString: 'postgresql://u:p@localhost:5432/db', schema: 'EsquemaMayusculas' }),
      /Esquema inválido/
    );

    assert.throws(
      () => crearPool({ connectionString: 'postgresql://u:p@localhost:5432/db', schema: 'schema;DROP TABLE usuario;' }),
      /Esquema inválido/
    );
  });

  await t.test('resolverConfigSsl detecta SSL para servicios en la nube', () => {
    // 1. Local por defecto: sin SSL
    assert.equal(resolverConfigSsl({ connectionString: 'postgresql://u:p@localhost:5432/db' }), undefined);

    // 2. Por parámetro sslmode=require en URL (Neon, Supabase, Render, etc.)
    const sslPorUrl = resolverConfigSsl({ connectionString: 'postgresql://u:p@db.supabase.co:5432/postgres?sslmode=require' });
    assert.deepEqual(sslPorUrl, { rejectUnauthorized: true });

    // 3. Por variable de entorno DATABASE_SSL=true
    const envOriginal = process.env.DATABASE_SSL;
    try {
      process.env.DATABASE_SSL = 'true';
      const sslPorEnv = resolverConfigSsl({ connectionString: 'postgresql://u:p@localhost:5432/db' });
      assert.deepEqual(sslPorEnv, { rejectUnauthorized: true });
    } finally {
      process.env.DATABASE_SSL = envOriginal;
    }
  });

  await t.test('Integridad de archivos de migración SQL', async () => {
    const dir = path.join(__dirname, '../db/migrations');
    const archivos = (await fs.readdir(dir)).sort();

    assert.ok(archivos.length >= 4, 'Deben existir al menos 4 migraciones');

    const regexMigracion = /^\d{3}_[a-z0-9_]+\.sql$/;
    for (const archivo of archivos) {
      assert.match(archivo, regexMigracion, `El archivo ${archivo} debe seguir el formato 00X_nombre.sql`);
      const contenido = await fs.readFile(path.join(dir, archivo), 'utf8');
      assert.ok(contenido.trim().length > 0, `La migración ${archivo} no debe estar vacía`);
    }

    // Comprobar orden secuencial exacto
    assert.equal(archivos[0].startsWith('001_'), true, 'Migración 001');
    assert.equal(archivos[1].startsWith('002_'), true, 'Migración 002');
    assert.equal(archivos[2].startsWith('003_'), true, 'Migración 003');
    assert.equal(archivos[3].startsWith('004_'), true, 'Migración 004');

    // Comprobar que la migración 004 contiene la estructura requerida de RF1
    const sql004 = await fs.readFile(path.join(dir, '004_rf1_usuarios.sql'), 'utf8');
    assert.ok(sql004.includes('CREATE TABLE usuario'), '004 debe crear la tabla usuario');
    assert.ok(sql004.includes('email TEXT NOT NULL'), '004 debe validar email');
    assert.ok(sql004.includes('password_hash TEXT NOT NULL'), '004 debe almacenar password_hash');
    assert.ok(sql004.includes("'DUENO'"), '004 debe contemplar rol DUENO');
    assert.ok(sql004.includes("'CONTADOR'"), '004 debe contemplar rol CONTADOR');
    assert.ok(sql004.includes("'JEFE_TECNICO'"), '004 debe contemplar rol JEFE_TECNICO');
  });

  await t.test('Guardia de seguridad: pruebas no deben ejecutarse sobre la base principal', async () => {
    const backupDb = process.env.DATABASE_URL;
    const backupTestDb = process.env.TEST_DATABASE_URL;

    try {
      process.env.DATABASE_URL = 'postgresql://usuario:pass@localhost:5432/mibase_produccion';
      process.env.TEST_DATABASE_URL = 'postgresql://usuario:pass@localhost:5432/mibase_produccion';

      await assert.rejects(
        () => conBaseTemporal(async () => {}),
        /TEST_DATABASE_URL no debe ser idéntica a DATABASE_URL/
      );
    } finally {
      process.env.DATABASE_URL = backupDb;
      process.env.TEST_DATABASE_URL = backupTestDb;
    }
  });
});
