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
- **PostgreSQL**: Versión 14 o superior (instalado localmente o instancia en la nube). Configurar `DATABASE_URL` y `TEST_DATABASE_URL` en `server/.env`; la segunda debe ser una base exclusiva de pruebas con permiso para crear esquemas temporales. No publicar ese archivo.

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

### Paso 5: Iniciar los servicios
Desde la raíz, iniciar el backend:
```bash
cd server
npm ci
npm run db:migrate
npm start
```

En otra terminal, iniciar el cliente frontend:
```bash
cd client
npm ci
npm run dev
```

Abrir la URL que informa Vite y entrar a `/` o `/calculadora-pagos`. El proxy `/api` apunta al backend en `http://localhost:1303`. En despliegues separados se puede configurar `VITE_API_URL` y el proxy/origen correspondiente.

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

## 6. API y Endpoints

### Estado del Servidor
- `GET /api`: Estado del servidor (`{ status: 'ok', mensaje: '...' }`). Público.

### Autenticación y Usuarios (RF1)
- `POST /api/auth/login`: `{ email, password }` -> Inicia sesión y devuelve JWT y perfil.
- `GET /api/auth/me`: Perfil del usuario autenticado (requiere cabecera `Authorization: Bearer <token>`).
- `GET /api/usuarios`: Listado de usuarios del sistema (exclusivo Dueño).
- `POST /api/usuarios`: `{ nombre, email, password, rol }` (exclusivo Dueño).
- `PATCH /api/usuarios/:id/estado`: `{ activo }` (exclusivo Dueño).
- `PATCH /api/usuarios/:id/password`: `{ password }` (exclusivo Dueño).

### Eventos y Asignaciones (RF12)
*Acceso autorizado: Dueño y Contador.*
- Lecturas: `GET /api/eventos`, `GET /api/eventos/:id`, `GET /api/eventos/:id/asignaciones`, `GET /api/eventos/:id/liquidacion`, `GET /api/personas` y `GET /api/roles`. Una liquidación aún no guardada devuelve 404.
- Las escrituras requieren `versionEvento`, entero positivo leído del evento:
  - `PATCH /api/eventos/:id/estado`: además `estado` (`en_curso` o `finalizado`).
  - `PATCH /api/eventos/:id/asignaciones/porcentajes`: además `cambios: [{ asignacionId, porcentajeCentesimas }]` (10000 = 100%).
  - `POST /api/eventos/:id/liquidacion/previsualizacion`.
  - `POST /api/eventos/:id/liquidacion`: usar la versión de la previsualización.

Una edición por lote es atómica. El backend calcula los pagos y descarta los importes recibidos. Respuestas: 400 validación, 401 no autenticado, 403 no autorizado, 404 inexistente, 409 conflicto de versión/estado/liquidación y 500 inesperado sin detalles internos.

Las migraciones no insertan datos de negocio. La calculadora utiliza eventos, personas, roles y asignaciones existentes; no implementa su administración. Las operaciones de preparación están en `operacionRepository.js`. Una asignación sin sugerencia vigente requiere porcentaje explícito; los porcentajes históricos NULL deben completarse antes de liquidar.

### Kits y Recargo Premium (RF5)
*Acceso autorizado: Lectura para Dueño, Jefe Técnico y Contador; Modificación para Dueño y Jefe Técnico.*
- `GET /api/kits`: catálogo con disponibilidad y evento ocupante.
- `POST /api/kits`: `{ nombre, premium }` (booleano).
- `GET /api/configuracion/premium`: configuración vigente o `null`.
- `POST /api/configuracion/premium`: `{ porcentajeCentesimas, vigenteDesde }` (fecha ISO con zona horaria).
- `GET /api/eventos/:id/economia`: base, kit, porcentaje aplicado, recargo, total, estado y versión. Es la misma fuente para Inventario y Finanzas.
- `PUT /api/eventos/:id/kit`: `{ kitId, versionEvento }`; `kitId: null` desasigna. Los importes enviados por el cliente no se utilizan.
- `PATCH /api/eventos/:id/precio-base`: `{ precioBase, versionEvento }`.

Para crear eventos desde la integración existente, `crearEvento` acepta `precioBase`; el nombre anterior `montoTotalEvento` se conserva por compatibilidad y representa el importe inicial sin recargo. No se implementa administración de eventos en RF5. `actualizarMonto` rechaza totales manuales cuando existe un kit; en ese caso se utiliza `actualizarPrecioBase` del repositorio de kits.

---

## 7. Recorrido Manual con Registros Reales (RF5 / RF12)

1. Registrar un kit normal y uno Premium en Inventario → Kits.
2. Registrar el porcentaje autorizado y su vigencia. No hay valor predeterminado.
3. Seleccionar un evento pendiente o en curso y guardar un kit normal: recargo cero.
4. Cambiar a Premium: verificar porcentaje aplicado y total = base + recargo.
5. Guardar el mismo kit: comprobar que total y porcentaje se conservan.
6. Cambiar la configuración: el evento anterior debe conservar su instantánea.
7. Cambiar de kit o desasignar y comprobar que el recargo no se acumula.
8. Intentar asignar el kit ocupado desde otro evento: debe rechazarse con 409.
9. Finalizar desde Calculadora de Pagos; recargar Kits: el recurso queda disponible y el evento finalizado conserva su kit en modo consulta.
10. Consultar Finanzas y liquidar en RF12: ambos utilizan el total persistido.

Contrato y alcance: `server/domain/recargoPremium.md` y `server/domain/liquidacion.md`.

---

## 8. Scripts Disponibles en `server/package.json`

| Comando | Descripción |
|---|---|
| `npm test` | Suite de pruebas unitarias automáticas (RF1, RF5, RF12 y arquitectura DB) sin BD activa. |
| `npm run test:rf1` | Pruebas unitarias de RF1 (modelos, roles, autenticación JWT, autorización). |
| `npm run test:db` | Pruebas unitarias de arquitectura PostgreSQL (validación de URLs, esquemas, SSL, checksum). |
| `npm run db:check` | Diagnostica conexión a PostgreSQL, versión del servidor y migraciones aplicadas. |
| `npm run db:migrate` | Aplica todas las migraciones SQL pendientes de forma transaccional. |
| `npm run db:crear-dueno` | Asistente interactivo para registrar la cuenta inicial del Dueño con bcrypt. |
| `npm run test:integration` | Pruebas de persistencia contra base temporal `TEST_DATABASE_URL`. |
| `npm run test:migration` | Pruebas de la migración 002 contra base temporal `TEST_DATABASE_URL`. |
| `npm run test:http` | Pruebas de integración de API HTTP RF12 con base temporal `TEST_DATABASE_URL`. |
| `npm run test:rf5:integration` | Pruebas de persistencia e integración de RF5 con PostgreSQL real. |
| `npm run test:rf5:http` | Pruebas de API HTTP de RF5 con base temporal `TEST_DATABASE_URL`. |
| `npm run start` | Inicia el servidor backend en el puerto configurado (`PORT=1303`). |
