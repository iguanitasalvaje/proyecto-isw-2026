'use strict';

function texto(valor, campo, maximo) {
  if (typeof valor !== 'string' || !valor.trim()) throw new TypeError(`${campo} es obligatorio`);
  const limpio = valor.trim();
  if (maximo && [...limpio].length > maximo) throw new TypeError(`${campo} supera ${maximo} caracteres`);
  return limpio;
}

function identificador(valor) {
  if (typeof valor !== 'number' && (typeof valor !== 'string' || !/^[0-9]+$/.test(valor))) {
    throw new TypeError('Identificador de Inventario inválido');
  }
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw new TypeError('Identificador de Inventario inválido');
  return id;
}

function crearInventarioRepository(pool) {
  return {
    /**
     * Lista todos los equipos ordenados por ID
     */
    async listarEquipos() {
      const { rows } = await pool.query('SELECT * FROM equipos ORDER BY id ASC');
      return rows;
    },

   /**
     * Lista los kits junto con sus equipos asociados
     */
    async listarKits() {
      const query = `
        SELECT 
          k.id, 
          k.nombre, 
          k.descripcion,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', e.id, 
                'nombre', e.nombre, 
                'tipo', e.tipo, 
                'estado', e.estado
              )
            ) FILTER (WHERE e.id IS NOT NULL), '[]'
          ) AS equipos
        FROM kits k
        LEFT JOIN equipos e ON e."kitId" = k.id
        GROUP BY k.id
        ORDER BY k.id ASC;
      `;
      const { rows } = await pool.query(query);
      return rows;
    },

    /**
     * Crear un nuevo Kit lógico
     */
    async crearKit({ nombre, descripcion }) {
      nombre = texto(nombre, 'Nombre del kit', 100);
      if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
        throw new TypeError('Descripción inválida');
      }
      const query = `
        INSERT INTO kits (nombre, descripcion)
        VALUES ($1, $2)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [nombre.trim(), descripcion ? descripcion.trim() : null]);
      return rows[0];
    },

    /**
     * Asignar o desasignar un equipo a un kit
     */
    async asignarEquipoAKit(equipoId, kitId) {
      equipoId = identificador(equipoId);
      if (kitId !== null) kitId = identificador(kitId);
      const query = `
        UPDATE equipos
        SET "kitId" = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const { rows } = await pool.query(query, [kitId, equipoId]);
      return rows[0] || null;
    },

    /**
     * Obtiene un equipo por su ID
     */
    async obtenerEquipoPorId(id) {
      id = identificador(id);
      const { rows } = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
      return rows[0] || null;
    },

    /**
     * Registra un nuevo equipo en el inventario
     */
    async crearEquipo({ nombre, tipo, serie, estado = 'Disponible', valorReposicion }) {
      nombre = texto(nombre, 'Nombre del equipo', 150);
      tipo = texto(tipo, 'Tipo del equipo', 50);
      serie = texto(serie, 'Serie del equipo', 50);
      estado = texto(estado, 'Estado del equipo');
      if ((typeof valorReposicion !== 'number' && typeof valorReposicion !== 'string') ||
        String(valorReposicion).trim() === '' || !Number.isFinite(Number(valorReposicion)) || Number(valorReposicion) < 0) {
        throw new TypeError('El valor de reposición debe ser un número finito mayor o igual a cero');
      }

      const query = `
        INSERT INTO equipos (nombre, tipo, serie, estado, "valorReposicion", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      const values = [
        nombre.trim(),
        tipo.trim(),
        serie,
        estado.trim(),
        Number(valorReposicion)
      ];

      const { rows } = await pool.query(query, values);
      return rows[0];
    },

    /**
     * Actualiza el estado de un equipo (Disponible, En Uso, Dañado, Perdido, Dado de Baja)
     */
    async actualizarEstadoEquipo(id, estado) {
      id = identificador(id);
      estado = texto(estado, 'Estado del equipo');
      const query = `
        UPDATE equipos
        SET estado = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const { rows } = await pool.query(query, [estado, id]);
      return rows[0] || null;
    }
  };
}

module.exports = { crearInventarioRepository };