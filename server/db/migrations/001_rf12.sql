CREATE TABLE evento (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  cliente TEXT,
  fecha TIMESTAMPTZ,
  lugar TEXT,
  monto_total BIGINT NOT NULL CHECK (monto_total BETWEEN 1 AND 9007199254740991),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE persona (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  telefono TEXT
);

CREATE TABLE rol_evento (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX rol_evento_nombre_uq ON rol_evento (lower(btrim(nombre)));

CREATE TABLE valor_rol (
  id UUID PRIMARY KEY,
  rol_id UUID NOT NULL REFERENCES rol_evento(id) ON DELETE RESTRICT,
  porcentaje_centesimas INTEGER NOT NULL CHECK (porcentaje_centesimas BETWEEN 0 AND 10000),
  vigente_desde TIMESTAMPTZ NOT NULL,
  UNIQUE (rol_id, vigente_desde)
);
CREATE INDEX valor_rol_vigencia_idx ON valor_rol (rol_id, vigente_desde DESC);

CREATE TABLE asignacion_evento (
  id UUID PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES evento(id) ON DELETE RESTRICT,
  persona_id UUID NOT NULL REFERENCES persona(id) ON DELETE RESTRICT,
  rol_id UUID NOT NULL REFERENCES rol_evento(id) ON DELETE RESTRICT,
  UNIQUE (evento_id, persona_id)
);
CREATE INDEX asignacion_persona_idx ON asignacion_evento(persona_id);
CREATE INDEX asignacion_rol_idx ON asignacion_evento(rol_id);

CREATE TABLE liquidacion (
  id UUID PRIMARY KEY,
  evento_id UUID NOT NULL UNIQUE REFERENCES evento(id) ON DELETE RESTRICT,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
  monto_evento_aplicado BIGINT NOT NULL CHECK (monto_evento_aplicado BETWEEN 1 AND 9007199254740991),
  version_evento INTEGER NOT NULL CHECK (version_evento > 0),
  total_distribuido BIGINT NOT NULL CHECK (total_distribuido BETWEEN 0 AND 9007199254740991)
);

CREATE TABLE detalle_liquidacion (
  id UUID PRIMARY KEY,
  liquidacion_id UUID NOT NULL REFERENCES liquidacion(id) ON DELETE RESTRICT,
  asignacion_id UUID NOT NULL REFERENCES asignacion_evento(id) ON DELETE RESTRICT,
  persona_id UUID NOT NULL REFERENCES persona(id) ON DELETE RESTRICT,
  nombre_persona TEXT NOT NULL CHECK (length(btrim(nombre_persona)) > 0),
  rol_id UUID NOT NULL REFERENCES rol_evento(id) ON DELETE RESTRICT,
  nombre_rol TEXT NOT NULL CHECK (length(btrim(nombre_rol)) > 0),
  valor_rol_id UUID NOT NULL REFERENCES valor_rol(id) ON DELETE RESTRICT,
  porcentaje_centesimas INTEGER NOT NULL CHECK (porcentaje_centesimas BETWEEN 0 AND 10000),
  monto_calculado BIGINT NOT NULL CHECK (monto_calculado BETWEEN 0 AND 9007199254740991),
  UNIQUE (liquidacion_id, asignacion_id)
);
CREATE INDEX detalle_asignacion_idx ON detalle_liquidacion(asignacion_id);
CREATE INDEX detalle_persona_idx ON detalle_liquidacion(persona_id);
CREATE INDEX detalle_rol_idx ON detalle_liquidacion(rol_id);
CREATE INDEX detalle_valor_idx ON detalle_liquidacion(valor_rol_id);
