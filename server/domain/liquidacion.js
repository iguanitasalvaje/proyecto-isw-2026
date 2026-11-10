'use strict';

function exigir(condicion, mensaje) {
  if (!condicion) throw new TypeError(mensaje);
}

function identificador(id) {
  return (typeof id === 'string' && id.trim().length > 0) ||
    (Number.isSafeInteger(id) && id > 0);
}

function indexar(elementos, etiqueta) {
  exigir(Array.isArray(elementos), `${etiqueta} debe ser un arreglo`);
  const indice = new Map();
  for (const elemento of elementos) {
    exigir(elemento && typeof elemento === 'object' && identificador(elemento.id),
      `${etiqueta}: identificador inválido`);
    exigir(!indice.has(elemento.id), `${etiqueta}: identificador duplicado`);
    indice.set(elemento.id, elemento);
  }
  return indice;
}

function nombreValido(nombre) {
  return typeof nombre === 'string' && nombre.trim().length > 0;
}

/** Función pura. Cada asignación aporta su porcentaje individual en centésimas. */
function calcularLiquidacion({ eventoId, montoTotalEvento, personas, roles, asignaciones } = {}) {
  exigir(identificador(eventoId), 'Evento inválido');
  exigir(Number.isSafeInteger(montoTotalEvento) && montoTotalEvento > 0,
    'Monto total del evento debe ser un entero CLP seguro mayor que cero');
  const personasPorId = indexar(personas, 'Personas');
  const rolesPorId = indexar(roles, 'Roles');
  const asignacionesPorId = indexar(asignaciones, 'Asignaciones');
  exigir(asignacionesPorId.size > 0, 'Se requiere al menos una asignación');

  for (const persona of personasPorId.values()) {
    exigir(nombreValido(persona.nombre), 'Nombre de persona inválido');
  }
  for (const rol of rolesPorId.values()) {
    exigir(nombreValido(rol.nombre), 'Nombre de rol inválido');
  }

  let totalCentesimas = 0;
  for (const asignacion of asignacionesPorId.values()) {
    const porcentaje = asignacion.porcentajeCentesimas;
    exigir(Number.isInteger(porcentaje) && porcentaje >= 0 && porcentaje <= 10000,
      'Porcentaje individual en centésimas debe ser entero entre 0 y 10000');
    totalCentesimas += porcentaje;
    exigir(totalCentesimas <= 10000, 'La suma de porcentajes no puede superar el 100%');
  }

  const participantes = new Set();
  let total = 0n;
  const detalles = [];
  for (const asignacion of asignacionesPorId.values()) {
    exigir(asignacion.eventoId === eventoId, 'Asignación pertenece a otro evento');
    const persona = personasPorId.get(asignacion.personaId);
    const rol = rolesPorId.get(asignacion.rolId);
    exigir(persona, 'Persona de asignación inexistente');
    exigir(rol, 'Rol de asignación inexistente');
    exigir(!participantes.has(persona.id), 'Persona duplicada en el evento');
    participantes.add(persona.id);
    const pago = (BigInt(montoTotalEvento) * BigInt(asignacion.porcentajeCentesimas) + 5000n) / 10000n;
    total += pago;
    exigir(total <= BigInt(Number.MAX_SAFE_INTEGER), 'Total distribuido excede el entero seguro');
    detalles.push({
      asignacionId: asignacion.id,
      personaId: persona.id,
      nombrePersona: persona.nombre,
      rolId: rol.id,
      nombreRol: rol.nombre,
      porcentajeAplicado: asignacion.porcentajeCentesimas / 100,
      montoCalculado: Number(pago),
    });
  }
  return { eventoId, montoTotalEvento, detalles, totalDistribuido: Number(total) };
}

module.exports = { calcularLiquidacion };
