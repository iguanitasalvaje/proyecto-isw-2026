-- RF14: gastos operativos de eventos.
-- No altera los ingresos, canjes ni liquidaciones de RF5, RF8 y RF12.
CREATE TABLE gasto_operativo (
  id UUID PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES evento(id) ON DELETE RESTRICT,
  descripcion TEXT NOT NULL CHECK (length(btrim(descripcion)) BETWEEN 1 AND 500),
  monto_clp BIGINT NOT NULL CHECK (monto_clp BETWEEN 1 AND 9007199254740991),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp()
);
CREATE INDEX gasto_operativo_evento_idx ON gasto_operativo(evento_id);
