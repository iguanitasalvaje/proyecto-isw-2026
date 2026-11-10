# RF12: contrato del cálculo de liquidación

`calcularLiquidacion` es una función pura que recibe `eventoId`,
`montoTotalEvento`, `personas`, `roles` y `asignaciones`.

El monto es el importe final acordado con el cliente: un entero CLP seguro
mayor que cero. Cada asignación contiene `id`, `eventoId`, `personaId`, `rolId`
y `porcentajeCentesimas`, un número entero entre 0 y 10000 inclusive.
Por ejemplo, 1250 representa 12,50%. La suma de todas las asignaciones no puede
superar 10000 (100%); puede ser inferior, incluso cero. Debe existir al menos
una asignación y cada persona puede aparecer una sola vez por evento.

El porcentaje es individual por persona y evento. Dos trabajadores del mismo
rol pueden tener porcentajes diferentes. El predeterminado del rol solo se
copia como sugerencia al crear la asignación, fuera de esta función; los cambios
posteriores de ese predeterminado no alteran el cálculo. `valoresRol` ya no forma
parte del contrato y no se utiliza como alternativa a un porcentaje individual.

## Cálculo y redondeo

```text
pago individual = montoTotalEvento × porcentajeCentesimas / 10000
```

Se utiliza aritmética entera con `BigInt`. Cada pago se redondea al peso CLP más
cercano, con medio peso hacia arriba. El total es la suma de los pagos individuales
redondeados y debe mantenerse dentro del rango entero seguro de JavaScript.
El límite del 100% se valida sobre los porcentajes, no sobre los pagos redondeados:
con un monto de $1 y dos asignaciones al 50%, cada pago es $1 y el total es $2.
No se aplica una compensación de redondeo.

## Resultado

Devuelve `eventoId`, `montoTotalEvento`, `totalDistribuido` y `detalles`.
Cada detalle contiene `asignacionId`, `personaId`, `nombrePersona`, `rolId`,
`nombreRol`, `porcentajeAplicado` (en porcentaje: 12,5 para 1250 centésimas)
y `montoCalculado`. Ya no devuelve `valorRolId`: el cálculo no depende de una
configuración de rol. No modifica las entradas y el resultado conserva una
instantánea de nombres, rol, porcentaje e importe.

## Estado y persistencia

Los repositorios exigen `finalizado` para previsualizar y guardar. La transición
es `pendiente -> en_curso -> finalizado`, sin reapertura. Al finalizar se congelan
monto, trabajadores y roles. La disponibilidad se deriva de asignaciones a eventos
no finalizados, conservando el historial. Kits queda como integración pendiente.

El porcentaje se puede ajustar hasta guardar la única liquidación final. Las
mutaciones bloquean el evento en una transacción e incrementan `evento.version`.
La API exige `versionEvento` para detectar datos obsoletos. El guardado recalcula
en backend y conserva nombres, rol, porcentaje e importe; la consulta histórica
no depende de los catálogos actuales. React pide confirmación antes de guardar.
Los pagos adicionales o excepcionales quedan fuera de RF12.
