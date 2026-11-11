'use strict';

const { Pool } = require('pg');

/**
 * Enmascara contraseñas en una URL de conexión PostgreSQL para evitar filtraciones en logs y errores.
 * Ejemplo: postgresql://usuario:clave123@servidor.com:5432/bd -> postgresql://usuario:***@servidor.com:5432/bd
 */
function enmascararUrl(cadenaConexion) {
  if (typeof cadenaConexion !== 'string') return '';
  return cadenaConexion.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/i, '$1***$3');
}

/**
 * Determina las opciones de SSL/TLS para la conexión PostgreSQL.
 * Soporta proveedores en la nube (Supabase, Neon, Render, Railway, AWS RDS)
 * y desarrollo local sin SSL.
 */
function resolverConfigSsl({ connectionString, sslExplicito } = {}) {
  if (sslExplicito !== undefined) {
    return sslExplicito;
  }

  const envSsl = (process.env.DATABASE_SSL || '').toLowerCase().trim();
  const tieneParametroSsl = /[?&]sslmode=(?:require|verify-ca|verify-full|no-verify)/i.test(connectionString || '');

  if (envSsl === 'true' || envSsl === '1' || tieneParametroSsl) {
    const rejectUnauthorized = (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || '').toLowerCase().trim() !== 'false';
    return { rejectUnauthorized };
  }

  return undefined;
}

/**
 * Crea y configura un pool de conexiones PostgreSQL reutilizable, seguro y adaptable a local o nube.
 */
function crearPool({ connectionString, schema = 'public', ssl } = {}) {
  if (typeof connectionString !== 'string' || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new TypeError('Se requiere una URL PostgreSQL explícita (formato postgresql://...)');
  }

  if (!/^[a-z][a-z0-9_]*$/.test(schema)) {
    throw new TypeError('Esquema inválido. Debe contener únicamente caracteres alfanuméricos en minúsculas y guiones bajos.');
  }

  const sslConfig = resolverConfigSsl({ connectionString, sslExplicito: ssl });

  const maxConexiones = process.env.DATABASE_POOL_MAX
    ? parseInt(process.env.DATABASE_POOL_MAX, 10)
    : 10;

  const poolConfig = {
    connectionString,
    options: `-c search_path=${schema}`,
    max: Number.isInteger(maxConexiones) && maxConexiones > 0 ? maxConexiones : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };

  if (sslConfig !== undefined) {
    poolConfig.ssl = sslConfig;
  }

  const pool = new Pool(poolConfig);

  // Prevenir que desconexiones de sockets en clientes inactivos detengan la aplicación
  pool.on('error', (err) => {
    console.error('Error en cliente inactivo del pool de PostgreSQL:', err.message);
  });

  return pool;
}

module.exports = {
  crearPool,
  enmascararUrl,
  resolverConfigSsl
};
