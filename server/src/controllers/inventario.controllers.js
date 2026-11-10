// server/src/controllers/inventario.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Obtener equipos
const getEquipos = async (req, res, next) => {
  try {
    const equipos = await prisma.equipo.findMany({
      include: { kit: true }
    });
    res.status(200).json(equipos);
  } catch (error) {
    next(error);
  }
};

// 2. RF9: Crear equipo
const createEquipo = async (req, res, next) => {
  try {
    const { nombre, tipo, serie, estado, valorReposicion, kitId } = req.body;

    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre,
        tipo,
        serie,
        estado: estado || 'Disponible',
        valorReposicion: parseFloat(valorReposicion),
        kitId: kitId ? parseInt(kitId) : null
      }
    });

    res.status(201).json(nuevoEquipo);
  } catch (error) {
    next(error);
  }
};

// 3. RF9 / RF13: Actualizar estado
const updateEstadoEquipo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const equipoActualizado = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: { estado }
    });

    res.status(200).json(equipoActualizado);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEquipos,
  createEquipo,
  updateEstadoEquipo
};