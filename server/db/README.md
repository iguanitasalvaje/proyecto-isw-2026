# Persistencia local

Requiere Node.js 24 y PostgreSQL. Configurar `DATABASE_URL` y
`TEST_DATABASE_URL` en `server/.env`; la segunda debe ser una base exclusiva
de pruebas con permiso para crear esquemas temporales. No publicar ese archivo.

Desde la raíz, iniciar el backend:

```sh
cd server
npm ci
npm run db:migrate
npm start
```

En otra terminal, desde la raíz:

```sh
cd client
npm ci
npm run dev
```

Abrir la URL que informa Vite y entrar a `/calculadora-pagos`. El proxy `/api`
apunta al backend en `http://localhost:1303`. En despliegues separados se puede
configurar `VITE_API_URL` y el proxy/origen correspondiente.

Las migraciones no insertan datos de negocio. La calculadora utiliza eventos,
personas, roles y asignaciones existentes; no implementa su administración.
Las operaciones de preparación están en `operacionRepository.js`.
Una asignación sin sugerencia vigente requiere porcentaje explícito; los
porcentajes históricos NULL deben completarse antes de liquidar.

Pruebas desde `server` (los scripts PostgreSQL cargan `.env` sin imprimirlo):

```sh
npm test
npm run test:migration
npm run test:integration
npm run test:http
```

Desde `client`: `npm run build` y `npm run lint`.

## API

Lecturas: `GET /api/eventos`, `/api/eventos/:id`,
`/api/eventos/:id/asignaciones`, `/api/eventos/:id/liquidacion`,
`/api/personas` y `/api/roles`. Una liquidación aún no guardada devuelve 404.

Las escrituras requieren `versionEvento`, entero positivo leído del evento:

- `PATCH /api/eventos/:id/estado`: además `estado` (`en_curso` o `finalizado`).
- `PATCH /api/eventos/:id/asignaciones/porcentajes`: además
  `cambios: [{ asignacionId, porcentajeCentesimas }]` (10000 = 100%).
- `POST /api/eventos/:id/liquidacion/previsualizacion`.
- `POST /api/eventos/:id/liquidacion`: usar la versión de la previsualización.

Una edición por lote es atómica. El backend calcula los pagos y descarta los
importes recibidos. Respuestas: 400 validación, 404 inexistente, 409 conflicto
de versión/estado/liquidación y 500 inesperado sin detalles internos.

## Kit Premium (RF5)

Aplicar `npm run db:migrate` antes de iniciar la nueva versión. La migración 003
conserva los totales históricos y no inserta datos de negocio. En Inventario →
Kits se registran los kits físicos y el porcentaje real del negocio, con su
vigencia. Si no hay configuración vigente, asignar un Premium devuelve 409.

API adicional:

- `GET /api/kits`: catálogo con disponibilidad y evento ocupante.
- `POST /api/kits`: `{ nombre, premium }` (booleano).
- `GET /api/configuracion/premium`: configuración vigente o `null`.
- `POST /api/configuracion/premium`:
  `{ porcentajeCentesimas, vigenteDesde }` (fecha ISO con zona horaria).
- `GET /api/eventos/:id/economia`: base, kit, porcentaje aplicado, recargo,
  total, estado y versión. Es la misma fuente para Inventario y Finanzas.
- `PUT /api/eventos/:id/kit`: `{ kitId, versionEvento }`;
  `kitId: null` desasigna. Los importes enviados por el cliente no se utilizan.
- `PATCH /api/eventos/:id/precio-base`: `{ precioBase, versionEvento }`.

Para crear eventos desde la integración existente, `crearEvento` acepta
`precioBase`; el nombre anterior `montoTotalEvento` se conserva por compatibilidad
y representa el importe inicial sin recargo. No se implementa administración de
eventos en RF5. `actualizarMonto` rechaza totales manuales cuando existe un kit;
en ese caso se utiliza `actualizarPrecioBase` del repositorio de kits.

Pruebas RF5 desde `server`:

```sh
npm test
npm run test:rf5:integration
npm run test:rf5:http
```

Recorrido manual con registros reales existentes:

1. Registrar un kit normal y uno Premium en Inventario → Kits.
2. Registrar el porcentaje autorizado y su vigencia. No hay valor predeterminado.
3. Seleccionar un evento pendiente o en curso y guardar un kit normal: recargo cero.
4. Cambiar a Premium: verificar porcentaje aplicado y total = base + recargo.
5. Guardar el mismo kit: comprobar que total y porcentaje se conservan.
6. Cambiar la configuración: el evento anterior debe conservar su instantánea.
7. Cambiar de kit o desasignar y comprobar que el recargo no se acumula.
8. Intentar asignar el kit ocupado desde otro evento: debe rechazarse con 409.
9. Finalizar desde Calculadora de Pagos; recargar Kits: el recurso queda disponible
   y el evento finalizado conserva su kit en modo consulta.
10. Consultar Finanzas y liquidar en RF12: ambos utilizan el total persistido.

Contrato y alcance: `server/domain/recargoPremium.md`.

## RF8 – Canjes de auspiciadores

La migración `004_rf8_canjes.sql` crea `auspiciador` y `canje_auspiciador`.
El valor estimado en CLP se almacena por separado del dinero efectivo y **no
modifica** `evento.monto_total`. Este dato se utilizará más adelante en el
indicador económico estimado de RF14.

Endpoints:

- `GET /api/auspiciadores`: listado de auspiciadores.
- `POST /api/auspiciadores`: `{ "nombre": "Empresa X" }`.
- `GET /api/eventos/:id/canjes`: `{ eventoId, canjes, totalEstimadoClp }`.
- `POST /api/eventos/:id/canjes`:
  `{ "auspiciadorId": "uuid", "descripcion": "Producto o servicio", "montoEstimadoClp": 25000 }`.
  La descripción es opcional. El monto debe ser un entero positivo expresado
  como número JSON. Los valores se validan también con `CHECK` en PostgreSQL.

Pruebas sin PostgreSQL: `npm test` o `npm run test:rf8`.
Prueba real en un esquema temporal: `npm run test:rf8:integration`. **No
configurar `TEST_DATABASE_URL` con una URL de producción**. El script exige
una URL explícita para la base exclusiva de pruebas, diferente de `DATABASE_URL`.

Antes de ejecutar `npm run db:migrate` en producción, coordinar la integración,
revisar que la migración 004 esté libre y realizar un respaldo. La API aún no
controla el rol Contador; esa restricción depende de implementar RF1 con
sesiones y autorización real en Express.
