-- NULL conserva la ausencia de porcentaje individual en asignaciones antiguas.
-- No se infieren porcentajes históricos del rol ni se asumen ceros.
ALTER TABLE asignacion_evento
  ADD COLUMN porcentaje_centesimas INTEGER
    CONSTRAINT asignacion_porcentaje_rango CHECK (porcentaje_centesimas BETWEEN 0 AND 10000),
  ADD COLUMN valor_rol_origen_id UUID
    REFERENCES valor_rol(id) ON DELETE RESTRICT;

COMMENT ON COLUMN asignacion_evento.porcentaje_centesimas IS
  'Porcentaje individual: 10000 = 100%. NULL indica un porcentaje no registrado; sin valor predeterminado.';
COMMENT ON COLUMN asignacion_evento.valor_rol_origen_id IS
  'Sugerencia original opcional; no determina el porcentaje individual ni se infiere para registros antiguos.';

CREATE INDEX asignacion_valor_rol_origen_idx ON asignacion_evento(valor_rol_origen_id);

-- Los eventos existentes reciben pendiente; no se reconstruyen estados ni fechas históricos.
-- Las liquidaciones existentes se conservan intactas.
ALTER TABLE evento
  ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente'
    CONSTRAINT evento_estado_valido CHECK (estado IN ('pendiente', 'en_curso', 'finalizado')),
  ADD COLUMN finalizado_en TIMESTAMPTZ;

COMMENT ON COLUMN evento.estado IS
  'pendiente: no iniciado; en_curso: iniciado; finalizado: terminado. No se infiere el estado histórico.';
COMMENT ON COLUMN evento.finalizado_en IS
  'Instante de finalización; NULL cuando se desconoce. No se infieren fechas históricas.';

-- El porcentaje individual no requiere un valor de rol de origen; se conservan la FK y los valores históricos.
ALTER TABLE detalle_liquidacion ALTER COLUMN valor_rol_id DROP NOT NULL;
