'use strict';

const { Pool } = require('pg');

function crearPool({ connectionString, schema = 'public' } = {}) {
  if (typeof connectionString !== 'string' || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new TypeError('Se requiere una URL PostgreSQL explícita');
  }
  if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new TypeError('Esquema inválido');
  // Pool es perezoso: importar este archivo o crear el pool no abre conexiones.
  return new Pool({ connectionString, options: `-c search_path=${schema}`,
    connectionTimeoutMillis: 5000 });
}

module.exports = { crearPool };
