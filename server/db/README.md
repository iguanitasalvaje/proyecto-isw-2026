# RF12 local

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
