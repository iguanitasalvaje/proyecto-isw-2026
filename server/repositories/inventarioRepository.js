'use strict';

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
      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        const err = new TypeError('El nombre del kit es obligatorio');
        err.status = 400;
        throw err;
      }
      const query = `
        INSERT INTO kits (nombre, descripcion, "updatedAt")
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      const { rows } = await pool.query(query, [nombre.trim(), descripcion ? descripcion.trim() : null]);
      return rows[0];
    },

    /**
     * Asignar o desasignar un equipo a un kit
     */
    async asignarEquipoAKit(equipoId, kitId) {
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
      const { rows } = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
      return rows[0] || null;
    },

    /**
     * Registra un nuevo equipo en el inventario
     */
    async crearEquipo({ nombre, tipo, serie, estado = 'Disponible', valorReposicion }) {
      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        const err = new TypeError('El nombre del equipo es obligatorio');
        err.status = 400;
        throw err;
      }
      if (!tipo || typeof tipo !== 'string' || !tipo.trim()) {
        const err = new TypeError('El tipo de equipo es obligatorio');
        err.status = 400;
        throw err;
      }
      if (valorReposicion === undefined || valorReposicion === null || Number(valorReposicion) < 0) {
        const err = new TypeError('El valor de reposición debe ser un número mayor o igual a 0');
        err.status = 400;
        throw err;
      }

      const query = `
        INSERT INTO equipos (nombre, tipo, serie, estado, "valorReposicion", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      const values = [
        nombre.trim(),
        tipo.trim(),
        serie ? serie.trim() : null,
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