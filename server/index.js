'use strict';

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const { crearPool, enmascararUrl } = require('./db/pool');
const { crearApp } = require('./app');

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  console.error('\n✕ Error: DATABASE_URL no está configurada en server/.env.');
  console.error('Revisa server/.env.example y configura la conexión a PostgreSQL antes de iniciar el backend.\n');
  process.exit(1);
}

try {
  const pool = crearPool({ connectionString: process.env.DATABASE_URL });
  const port = process.env.PORT || 1303;

  console.log(`Conectando base de datos: ${enmascararUrl(process.env.DATABASE_URL)}`);
  const servidor = crearApp(pool).listen(port, () => {
    console.log(`✓ Backend corriendo exitosamente en http://localhost:${port}`);
  });

  const cerrar = () => {
    console.log('\nCerrando servidor backend y liberando pool de conexiones...');
    servidor.close(() => {
      pool.end().then(() => {
        console.log('✓ Conexiones a PostgreSQL cerradas correctamente.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', cerrar);
  process.on('SIGINT', cerrar);
} catch (error) {
  console.error('\n✕ No se pudo iniciar el backend:', error.message);
  console.error('Verifica la conectividad a PostgreSQL y el archivo server/.env.\n');
  process.exit(1);
}
