# Six Seven Transmisiones – Sistema de Gestión Operativa

Sistema integral de gestión de transmisiones en vivo, eventos, inventario técnico, finanzas y control de acceso basado en roles para la productora **Six Seven Transmisiones**.

---

## 1. Tecnologías del Proyecto

- **Frontend**: React 19, React Router 7, TailwindCSS y Vite 8.
- **Backend**: Node.js 20+ (CommonJS) y Express 5.
- **Base de Datos**: PostgreSQL 14+ con el cliente nativo `pg`.
- **Autenticación y Seguridad**: JSON Web Tokens (JWT) y cifrado de contraseñas con `bcryptjs`.
- **Estructura del Repositorio**:
  - `client/`: Código fuente de la aplicación frontend (React/Vite).
  - `server/`: API REST, controladores, repositorios, middlewares y migraciones SQL.

---

## 2. Requisitos Previos de Instalación

Antes de comenzar, debes tener instalado en tu computadora:

1. **Node.js**: Versión 20 LTS o 24 LTS ([Descargar Node.js](https://nodejs.org/)).
2. **PostgreSQL**: Versión 14, 15, 16 o 17 ([Descargar PostgreSQL para Windows](https://www.postgresql.org/download/windows/)).
   - *Nota:* Durante la instalación de PostgreSQL en Windows, recuerda la contraseña que le asignes al usuario `postgres` y conserva el puerto predeterminado `5432`.
3. **Git**: Para el control de versiones local.

---

## 3. Instalación y Puesta en Marcha Paso a Paso

### Paso 1: Clonar el repositorio
Abre una terminal (PowerShell o Git Bash) y navega a tu carpeta de trabajo:
```bash
git clone <URL_DEL_REPOSITORIO>
cd proyecto-isw-2026
```

---

### Paso 2: Crear las bases de datos en PostgreSQL Local

Abre la herramienta de consola de PostgreSQL (`psql` o el programa **SQL Shell (psql)** en Windows):

```sql
-- Conectado como usuario postgres en psql:
CREATE DATABASE sixseven_db;
CREATE DATABASE sixseven_test;
```

*Alternativamente, puedes crearlas desde una terminal de PowerShell si tienes `psql` en tu PATH:*
```powershell
psql -U postgres -c "CREATE DATABASE sixseven_db;"
psql -U postgres -c "CREATE DATABASE sixseven_test;"
```

---

### Paso 3: Configurar las variables de entorno del Backend

En la carpeta `server/`, crea tu archivo `.env` a partir de la plantilla:

**En Windows PowerShell:**
```powershell
cd server
Copy-Item .env.example .env
```

**En Git Bash o Linux/macOS:**
```bash
cd server
cp .env.example .env
```

Abre `server/.env` con tu editor de texto y completa los valores con tu contraseña de PostgreSQL:

```env
# Conexión local a la base de datos de desarrollo
DATABASE_URL=postgresql://postgres:TU_PASSWORD_AQUI@127.0.0.1:5432/sixseven_db

# Base de datos exclusiva para pruebas (debe ser distinta a DATABASE_URL)
TEST_DATABASE_URL=postgresql://postgres:TU_PASSWORD_AQUI@127.0.0.1:5432/sixseven_test

# Clave secreta para firmar tokens JWT (mínimo 32 caracteres)
JWT_SECRET=clave_secreta_super_segura_sixseven_2026_jwt

# Puerto del backend
PORT=1303

# Entorno
NODE_ENV=development
DATABASE_SSL=false
```

---

### Paso 4: Instalar dependencias del Backend y verificar conexión

Dentro de la carpeta `server`:
```bash
npm install
```

Verifica que el backend se conecte correctamente a tu PostgreSQL local:
```bash
npm run db:check
```
*Deberás ver una respuesta con la versión de PostgreSQL y el mensaje:* `✓ Conexión exitosa a PostgreSQL`.

---

### Paso 5: Reconstruir la estructura de la base de datos (Migraciones)

Ejecuta las migraciones transaccionales para crear todas las tablas, índices y restricciones:
```bash
npm run db:migrate
```
*Aplica secuencialmente:*
- `001_rf12.sql`: Eventos, personas, roles operativos y liquidaciones.
- `002_rf12_porcentaje_individual.sql`: Porcentajes individuales de pago y estados de eventos.
- `003_rf5_kit_premium.sql`: Kits físicos, kits Premium y recargos porcentuales.
- `004_rf1_usuarios.sql`: Tabla de usuarios, credenciales bcrypt y roles (`DUENO`, `CONTADOR`, `JEFE_TECNICO`).

---

### Paso 6: Crear la cuenta inicial del Dueño (RF1)

Crea la cuenta administradora mediante el script seguro interactivo:
```bash
npm run db:crear-dueno
```
1. Ingresa el correo electrónico del Dueño (ej: `dueno@sixseven.cl`).
2. Ingresa la contraseña (mínimo 12 caracteres; los caracteres se ocultan al escribir).
3. El sistema generará el hash seguro con bcrypt y registrará la cuenta en PostgreSQL.

---

### Paso 7: Iniciar el servidor Backend

Dentro de `server/`:
```bash
npm run start
```
*El servidor Express estará corriendo en:* `http://localhost:1303`

---

### Paso 8: Instalar dependencias e iniciar el Frontend

Abre **otra ventana de terminal** en la raíz del proyecto y navega a `client/`:
```bash
cd client
npm install
npm run dev
```
*Abre tu navegador en:* `http://localhost:5173`

---

## 4. Control de Acceso por Roles (RF1)

El sistema restringe las operaciones estrictamente según el perfil operativo autenticado:

| Módulo | Dueño | Contador | Jefe Técnico | Descripción |
|---|:---:|:---:|:---:|---|
| **Dashboard** | Sí | Sí | Sí | Resumen general y métricas operativas. |
| **Eventos** | Sí | Sí | No | Consulta y administración de eventos de transmisión. |
| **Inventario** | Sí | No | Sí | Equipos técnicos, estado físico y asignación de Kits. |
| **Personal** | Sí | No | No | Nómina de técnicos, camarógrafos y tarifas. |
| **Auspiciadores** | Sí | Sí | No | Acuerdos comerciales, canjes y cobros pendientes. |
| **Finanzas** | Sí | Sí | No | Consolidado económico, costos y rentabilidad. |
| **Reportes** | Sí | Sí | No | Informes descargables mensuales y de cierre. |
| **Calculadora de Pagos** | Sí | Sí | No | Liquidación de eventos con porcentajes individuales (RF12). |
| **Gestión de Usuarios** | Sí | No | No | Creación y administración de cuentas de Contador y Jefe Técnico. |

### Administración de usuarios por el Dueño:
Desde el módulo **Gestión de Usuarios** (`/usuarios`), el Dueño puede:
- Crear cuentas operativas de **Contador** y **Jefe Técnico**.
- Modificar correos y reasignar roles.
- Activar o desactivar usuarios (las cuentas desactivadas pierden acceso inmediato).
- Restablecer contraseñas de acceso.

---

## 5. Configuración de PostgreSQL en la Nube

Para conectar el proyecto a un proveedor en la nube (Neon, Supabase, AWS RDS, Render, Railway) sin modificar código:

1. Crea tu base de datos en el proveedor elegido y copia la cadena de conexión SSL.
2. Modifica en `server/.env`:
   ```env
   DATABASE_URL=postgresql://usuario:password@ep-ejemplo.us-east-1.aws.neon.tech/neondb?sslmode=require
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=true
   ```
3. Ejecuta `npm run db:check` para verificar conectividad y latencia.
4. Ejecuta `npm run db:migrate` para inicializar el esquema completo.
5. Ejecuta `npm run db:crear-dueno` para dar de alta al administrador.

---

## 6. Ejecución de Pruebas Automatizadas

El proyecto incluye pruebas unitarias y de integración que validan lógica de negocio, seguridad y compatibilidad.

### Pruebas Unitarias (No requieren PostgreSQL activo)
Desde la carpeta `server`:
```bash
npm test
```
*Valida 54 aserciones: cálculo de liquidaciones (RF12), recargos de kits (RF5), seguridad de contraseñas bcrypt, tokens JWT, matriz de permisos de roles (RF1) y arquitectura de conexión de base de datos.*

### Pruebas de Persistencia e Integración (Requieren `TEST_DATABASE_URL`)
```bash
npm run test:integration
npm run test:http
npm run test:rf5:integration
npm run test:rf5:http
```

### Comprobaciones del Frontend
Desde la carpeta `client`:
```bash
npm run build    # Verifica empaquetado y tipos con Vite
npm run lint     # Comprueba reglas de código estático con ESLint
```

---

## 7. Preguntas Frecuentes y Solución de Problemas

### Error: `ECONNREFUSED 127.0.0.1:5432`
- **Causa:** El servicio de PostgreSQL no está ejecutándose en tu máquina.
- **Solución en Windows:** Abre `Servicios` (presiona `Win + R` y escribe `services.msc`), busca `postgresql-x64-XX` y haz clic en **Iniciar**.

### Error: `password authentication failed for user "postgres"`
- **Causa:** La contraseña ingresada en `DATABASE_URL` no coincide con la configurada durante la instalación de PostgreSQL.
- **Solución:** Corrige la contraseña en `server/.env`.

### Error: `database "sixseven_db" does not exist`
- **Causa:** No has creado la base de datos antes de migrar.
- **Solución:** Abre `psql` y ejecuta `CREATE DATABASE sixseven_db;`.

---

## 8. Licencia y Equipo de Trabajo

Proyecto desarrollado para la asignatura de Ingeniería de Software (ISW) 2026.
