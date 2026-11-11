CREATE TABLE kits (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
);

CREATE TABLE equipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  serie VARCHAR(50) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Disponible',
  "valorReposicion" DOUBLE PRECISION NOT NULL
    CHECK ("valorReposicion" >= 0 AND "valorReposicion" < 'Infinity'::DOUBLE PRECISION),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "kitId" INTEGER,
  CONSTRAINT equipos_serie_key UNIQUE (serie),
  CONSTRAINT "equipos_kitId_fkey" FOREIGN KEY ("kitId")
    REFERENCES kits(id) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "equipos_kitId_idx" ON equipos("kitId");

CREATE TABLE log_autorizaciones (
  id SERIAL PRIMARY KEY,
  "jefeTecnico" VARCHAR(100) NOT NULL,
  "eventoId" INTEGER NOT NULL,
  "kitId" INTEGER NOT NULL,
  fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "log_autorizaciones_kitId_fkey" FOREIGN KEY ("kitId")
    REFERENCES kits(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "log_autorizaciones_kitId_idx" ON log_autorizaciones("kitId");
