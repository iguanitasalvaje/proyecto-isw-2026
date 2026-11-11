# RF5: Kit Premium

Un evento admite un kit físico. Su disponibilidad se deriva de asignaciones a
cualquier evento no finalizado, sin reservas por fechas. La finalización libera
el kit sin borrar su asignación histórica.

La migración 003 copia `monto_total` a `precio_base`, sin cambiar totales,
versiones ni liquidaciones existentes. No inserta kits ni porcentajes de negocio.
El recargo inicial es cero porque no existen asignaciones de kit previas.

`kit` guarda nombre y clasificación Premium. `configuracion_recargo` guarda
vigencias únicas del tipo Premium, en centésimas (10000 = 100%). Se toma el
registro de vigencia más reciente que no sea futuro. Una configuración nueva
no modifica cálculos anteriores.

`asignacion_kit_evento` tiene como clave el evento y conserva kit, nombre y
clasificación aplicados, configuración de origen, porcentaje, recargo e instante.
El precio base y el total se conservan en `evento`, sin duplicarlos en la
asignación. Al finalizar quedan congelados junto con la asignación. Los cambios
de kit previos a finalizar sustituyen la asignación actual; no se registra una
bitácora de cambios intermedios.

El backend calcula con `BigInt` y redondea el recargo al peso CLP, con medio hacia
arriba, como RF12. Valida el rango entero seguro del total:

```text
recargo = redondear(precio_base × porcentaje_centesimas / 10000)
monto_total = precio_base + recargo
```

Guardar el mismo kit es idempotente: conserva porcentaje, importe y versión.
Cambiar a otro Premium usa la configuración vigente; pasar a normal o quitar
el kit deja el recargo en cero. Cambiar el precio base recalcula usando el
porcentaje ya aplicado, sin tomar una nueva vigencia.

Las escrituras bloquean el evento y los kits afectados en una transacción;
los kits se bloquean por ID en orden estable. La comprobación de ocupación
ocurre después del bloqueo y evita asignaciones concurrentes a dos eventos.
La API exige `versionEvento`; finalizar o liquidar impide cambios económicos.
RF12 continúa calculando sobre `evento.monto_total`.

Inventario mantiene sus vistas existentes de equipos y bajas; la pestaña Kits
usa PostgreSQL y no relaciona todavía kits con componentes individuales. Finanzas
solo agrega una lectura real de base, recargo y total por evento. Sus demás
indicadores y la pantalla Eventos conservan su implementación anterior.
