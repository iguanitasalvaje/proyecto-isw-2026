# PostgreSQL de pruebas

Todas las suites PostgreSQL usan `conBaseTemporal` de `postgres.js`. Requieren
`DATABASE_URL` y `TEST_DATABASE_URL` explícitas, una base independiente y un
usuario exclusivo de pruebas sin privilegios sobre los objetos de la base de uso.
El usuario de pruebas no debe ser superusuario ni poder crear bases o roles.

Antes de crear esquemas, el helper consulta ambas conexiones en transacciones
`READ ONLY` y compara base actual, dirección y puerto reales del servidor.
Una identidad ausente, un error o una coincidencia cancela la ejecución.
`DATABASE_URL` solo se usa para verificar identidad; nunca como destino de pruebas.

Cada ejecución crea un esquema aleatorio con `search_path` exclusivo y elimina
únicamente ese esquema en `finally`. La prueba de migración califica su `DROP
TABLE` con el esquema propio. No se ejecuta `DROP DATABASE`.

Las conexiones deben ser directas y estables a PostgreSQL: proxies que cambien
de destino o servidores con identidades ambiguas requieren revisión adicional.
Los permisos del usuario exclusivo constituyen la barrera adicional frente a
accesos accidentales fuera del esquema temporal.

Validación sin PostgreSQL: `node --test tests/postgresSafety.test.js` desde
`server`. La preparación de la base y las pruebas reales requieren autorización.
