'use strict';
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const { crearPool } = require('./db/pool');
const { crearApp } = require('./app');
try {
  const pool = crearPool({ connectionString: process.env.DATABASE_URL });
  const port = process.env.PORT || 1303;
  const servidor = crearApp(pool).listen(port, () => console.log(`Backend corriendo en el puerto ${port}`));
  const cerrar = () => servidor.close(() => pool.end());
  process.on('SIGTERM', cerrar);
  process.on('SIGINT', cerrar);
} catch {
  console.error('No se pudo iniciar el backend. Verifica la configuración PostgreSQL.');
  process.exitCode = 1;
}
