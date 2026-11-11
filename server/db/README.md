# Arquitectura de Persistencia y Base de Datos (PostgreSQL)
**Proyecto:** Six Seven Transmisiones  
**Módulos integrados:** RF1 (Usuarios y Roles), RF5 (Kits Premium), RF12 (Liquidaciones y Eventos)

Este directorio gestiona la persistencia de datos en PostgreSQL, el pool de conexiones del paquete `pg`, el sistema transaccional de migraciones y la compatibilidad entre entornos locales y en la nube.

---

## 1. Principios de la Arquitectura de Datos

1. **Independencia de GitHub**: La base de datos no se almacena en el repositorio de Git. Solo se versionan las definiciones DDL en archivos de migración SQL (`server/db/migrations/`).
2. **Reconstrucción determinista**: Cualquier integrante del equipo puede clonar el repositorio y reconstruir la estructura completa de tablas, índices y restricciones ejecutando `npm run db:migrate`.
3. **Agnóstico al proveedor**: El backend funciona indistintamente con:
   - PostgreSQL instalado localmente en Windows / Linux / macOS.
   - PostgreSQL en contenedores Docker.
   - PostgreSQL gestionado en la nube (Neon, Supabase, Render, Railway, AWS RDS).
4. **Protección de credenciales**: Las URLs de conexión y contraseñas jamás se exponen en logs, errores de consola ni commits (`.env` está excluido por `.gitignore`).
5. **Aislamiento estricto de pruebas**: Las pruebas destructivas requieren `TEST_DATABASE_URL` y rechazan ejecutarse si apunta a la base de desarrollo o producción (`DATABASE_URL`).

---

## 2. Requisitos Previos

- **Node.js**: Versión 20 o superior (recomendado 24 LTS).
- **PostgreSQL**: Versión 14 o superior (instalado localmente o instancia en la nube).

---

## 3. Guía de Configuración Rápida

### Paso 1: Configurar variables de entorno
Copia la plantilla de variables:
```bash
# Windows PowerShell o CMD
copy .env.example .env

# Git Bash o Linux/macOS
cp .env.example .env
```
Edita `server/.env` con los datos de tu conexión local o en la nube.

### Paso 2: Verificar la conexión
Antes de ejecutar migraciones, puedes verificar que PostgreSQL esté accesible ejecutando:
```bash
npm run db:check
```
*Este comando realiza un ping, comprueba la versión del motor y te informa qué migraciones están aplicadas sin alterar ningún dato.*

### Paso 3: Aplicar las migraciones
Para crear o actualizar las tablas en la base de datos:
```bash
npm run db:migrate
```
*Aplica las migraciones en orden transaccional (`BEGIN ... COMMIT`) utilizando un advisory lock para evitar condiciones de carrera.*

### Paso 4: Crear la cuenta inicial del Dueño (RF1)
Una vez aplicadas las migraciones, crea el usuario inicial con rol Dueño:
```bash
npm run db:crear-dueno
```
*Solicita el correo y contraseña de forma segura (sin mostrar los caracteres en pantalla) y genera el hash bcrypt correspondiente.*

---

## 4. Estructura de Migraciones Existentes

Las migraciones se encuentran en `server/db/migrations/` y se ejecutan en orden estricto:

| Archivo | Requisito | Propósito |
|---|---|---|
| `001_rf12.sql` | RF12 | Tablas base: `evento`, `persona`, `rol_evento`, `valor_rol`, `asignacion_evento`, `liquidacion`, `detalle_liquidacion`. |
| `002_rf12_porcentaje_individual.sql` | RF12 | Porcentajes individuales en asignaciones y estados del evento (`pendiente`, `en_curso`, `finalizado`). |
| `003_rf5_kit_premium.sql` | RF5 | Soporte para Kits físicos, kits Premium y configuración de recargos porcentuales (`kit`, `configuracion_recargo`, `asignacion_kit_evento`). |
| `004_rf1_usuarios.sql` | RF1 | Tabla `usuario` con identificador UUID, email único en minúsculas, contraseña con hash bcrypt, roles (`DUENO`, `CONTADOR`, `JEFE_TECNICO`), estado activo y timestamps. |

### Reglas para nuevas migraciones:
- Deben nombrarse con formato secuencial: `005_nombre_descriptivo.sql`.
- **Nunca modificar migraciones ya aplicadas**: El script `migrate.js` valida el checksum SHA-256 de cada archivo contra la tabla `schema_migrations`. Si detecta que un archivo fue alterado tras su aplicación, aborta por seguridad.

---

## 5. Conexión a PostgreSQL en la Nube

Para conectar el backend a un proveedor externo (Neon, Supabase, Render, Railway, AWS RDS):

1. Obtén la cadena de conexión de tu panel de control (ejemplo: `postgresql://usuario:clave@ep-xyz.us-east-1.aws.neon.tech/neondb?sslmode=require`).
2. Colócala en `server/.env`:
   ```env
   DATABASE_URL=postgresql://usuario:clave@ep-xyz.us-east-1.aws.neon.tech/neondb?sslmode=require
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=true
   ```
3. Ejecuta `npm run db:check` para verificar conectividad y latencia.
4. Ejecuta `npm run db:migrate` para inicializar el esquema en la nube.
5. Ejecuta `npm run db:crear-dueno` para registrar al administrador inicial.

---

## 6. Scripts Disponibles en `server/package.json`

| Comando | Descripción |
|---|---|
| `npm run db:check` | Diagnostica la conexión a PostgreSQL, versión del servidor y migraciones aplicadas. |
| `npm run db:migrate` | Aplica todas las migraciones SQL pendientes de forma transaccional. |
| `npm run db:crear-dueno` | Script interactivo para registrar la cuenta inicial del Dueño con bcrypt. |
| `npm test` | Ejecuta la suite de pruebas unitarias (RF1, RF5, RF12 y arquitectura DB) sin necesidad de servidor de BD. |
| `npm run test:integration` | Ejecuta pruebas de persistencia contra la base temporal `TEST_DATABASE_URL`. |
| `npm run start` | Inicia el servidor backend en el puerto configurado (`PORT=1303`). |
