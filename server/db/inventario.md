# Persistencia de Inventario

La migración 004 define `kits`, `equipos` y `log_autorizaciones` según el esquema
Prisma. Es independiente de `kit` UUID, RF5 y las liquidaciones RF12. No inserta
registros ni modifica tablas previas. Si las tablas ya existen en otro entorno,
se debe revisar su esquema antes de autorizar la aplicación; no se ocultan
incompatibilidades mediante `CREATE TABLE IF NOT EXISTS`.

Los IDs son enteros autoincrementales. `equipos.kitId` es opcional y usa
`ON DELETE SET NULL`; `log_autorizaciones.kitId` es obligatorio y restringe
borrados. Ambas FK propagan cambios de ID. `eventoId` en autorizaciones es
solo un entero: no referencia al evento UUID de RF12.

`kits` no tiene fechas. La consulta de creación no escribe `updatedAt`.
Las fechas de equipos y autorizaciones usan `TIMESTAMP(3)` sin zona horaria,
como el tipo PostgreSQL predeterminado de `DateTime` en este esquema Prisma.
El repositorio mantiene `equipos.updatedAt` en cada escritura, ya que
`@updatedAt` es una función de Prisma Client y las rutas activas utilizan `pg`.
La serie es obligatoria y única; el valor de reposición es un `DOUBLE PRECISION`
finito no negativo. No se añade una enumeración de estados ni unicidad al nombre
del kit, porque esos contratos no están definidos en Prisma.

Las pruebas unitarias sin conexión están en `tests/inventarioRepository.test.js`.
Las pruebas PostgreSQL preparadas están en `tests/inventario.integration.test.js`:
comprueban DDL, conservación de RF5/RF12, relaciones, autorizaciones y rollback.
Antes de escribir crean un esquema temporal exclusivamente en la base de pruebas
y comprueban que ambas conexiones no resuelvan a la misma base. No deben
ejecutarse hasta disponer de una base de pruebas independiente y autorización.

Todas las suites PostgreSQL utilizan la protección común descrita en
[`tests/helpers/README.md`](../tests/helpers/README.md). Se requiere una base
independiente y un usuario exclusivo sin privilegios sobre los objetos de uso.
