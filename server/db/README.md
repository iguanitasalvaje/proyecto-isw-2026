# Persistencia RF12

El backend utiliza PostgreSQL mediante `pg`.

## Configuración

Crear un archivo `.env` en `server` con las URLs de las bases locales:

```dotenv
DATABASE_URL=postgresql://usuario:clave@127.0.0.1:5432/base
TEST_DATABASE_URL=postgresql://usuario_test:clave@127.0.0.1:5432/base_test
```

`TEST_DATABASE_URL` debe apuntar a una base exclusiva de pruebas.

## Migraciones

Desde `server`:

```sh
npm run db:migrate
```

La base de datos se inicializa sin registros de negocio.

## Pruebas

Desde `server`, ejecutar las pruebas unitarias:

```sh
npm test
```

Para las pruebas de integración con PostgreSQL, exportar primero las variables
del archivo `.env` (la suite no lo carga automáticamente):

```sh
set -a
. ./.env
set +a
npm run test:integration
```
