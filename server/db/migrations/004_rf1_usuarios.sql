CREATE TABLE usuario (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL CHECK (length(btrim(email)) > 0),
  password_hash TEXT NOT NULL CHECK (length(btrim(password_hash)) > 0),
  rol TEXT NOT NULL CHECK (
    rol IN ('DUENO', 'CONTADOR', 'JEFE_TECNICO')
  ),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
  CHECK (email = lower(btrim(email)))
);

CREATE UNIQUE INDEX usuario_email_uq
  ON usuario (lower(btrim(email)));

CREATE INDEX usuario_rol_activo_idx
  ON usuario (rol, activo);
