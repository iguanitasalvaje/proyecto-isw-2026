ALTER TABLE evento ADD COLUMN precio_base BIGINT;
UPDATE evento SET precio_base = monto_total;
ALTER TABLE evento ALTER COLUMN precio_base SET NOT NULL;
ALTER TABLE evento ADD CONSTRAINT evento_precio_base_valido
  CHECK (precio_base BETWEEN 1 AND 9007199254740991);

CREATE TABLE kit (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  premium BOOLEAN NOT NULL
);
CREATE UNIQUE INDEX kit_nombre_uq ON kit (lower(btrim(nombre)));

CREATE TABLE configuracion_recargo (
  id UUID PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'premium' CHECK (tipo = 'premium'),
  porcentaje_centesimas INTEGER NOT NULL CHECK (porcentaje_centesimas BETWEEN 0 AND 10000),
  vigente_desde TIMESTAMPTZ NOT NULL,
  UNIQUE (tipo, vigente_desde)
);

CREATE TABLE asignacion_kit_evento (
  evento_id UUID PRIMARY KEY REFERENCES evento(id) ON DELETE RESTRICT,
  kit_id UUID NOT NULL REFERENCES kit(id) ON DELETE RESTRICT,
  nombre_kit TEXT NOT NULL CHECK (length(btrim(nombre_kit)) > 0),
  premium BOOLEAN NOT NULL,
  configuracion_id UUID REFERENCES configuracion_recargo(id) ON DELETE RESTRICT,
  porcentaje_centesimas INTEGER NOT NULL CHECK (porcentaje_centesimas BETWEEN 0 AND 10000),
  recargo BIGINT NOT NULL CHECK (recargo BETWEEN 0 AND 9007199254740991),
  asignado_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
  CHECK ((premium AND configuracion_id IS NOT NULL) OR
    (NOT premium AND configuracion_id IS NULL AND porcentaje_centesimas = 0 AND recargo = 0))
);
CREATE INDEX asignacion_kit_idx ON asignacion_kit_evento(kit_id);
