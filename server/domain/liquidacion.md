# RF12: cálculo de liquidación

`calcularLiquidacion` recibe `eventoId`, `montoTotalEvento`, `personas`, `roles`,
`asignaciones` y `valoresRol`.

El rol pertenece a la asignación persona-evento: una persona puede desempeñar
roles distintos en diferentes eventos. El porcentaje se obtiene del valor
vigente de ese rol, proporcionado en `valoresRol`.

## Cálculo y redondeo

```text
pago individual = montoTotalEvento × porcentajeRol / 100
```

Cada pago se redondea al peso CLP más cercano, con medio peso hacia arriba.
El total distribuido es la suma de los pagos individuales redondeados.

## Resultado

Devuelve el identificador del evento, su monto total, el total distribuido y una
lista de detalles. Cada detalle contiene:

- `asignacionId` y `personaId`.
- `nombrePersona`.
- `rolId` y `nombreRol`.
- `valorRolId`: identificador de la configuración aplicada.
- `porcentajeAplicado`.
- `montoCalculado`.

Cada detalle conserva una instantánea del nombre de la persona, el rol,
el porcentaje y el monto calculado para mantener el historial de la liquidación.
