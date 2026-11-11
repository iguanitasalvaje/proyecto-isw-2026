-- RF8: Registro de aportes en especies (canjes) valorizados en CLP.
-- Los canjes no modifican evento.monto_total, que utilizan RF5 y RF12.

CREATE TABLE auspiciador (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL CHECK (length(btrim(nombre)) > 0)
);

CREATE UNIQUE INDEX auspiciador_nombre_uq
  ON auspiciador (lower(btrim(nombre)));

CREATE TABLE canje_auspiciador (
  id UUID PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES evento(id) ON DELETE RESTRICT,
  auspiciador_id UUID NOT NULL REFERENCES auspiciador(id) ON DELETE RESTRICT,
  descripcion TEXT,
  monto_estimado_clp BIGINT NOT NULL
    CHECK (monto_estimado_clp BETWEEN 1 AND 9007199254740991),
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
  CHECK (descripcion IS NULL OR length(btrim(descripcion)) > 0)
);

CREATE INDEX canje_auspiciador_evento_idx
  ON canje_auspiciador (evento_id);

CREATE INDEX canje_auspiciador_auspiciador_idx
  ON canje_auspiciador (auspiciador_id);
