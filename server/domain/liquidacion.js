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

// Convierte la representación decimal a centésimas sin multiplicación flotante.
function escalarPorcentaje(porcentaje) {
  exigir(typeof porcentaje === 'number' && Number.isFinite(porcentaje) &&
    porcentaje >= 0 && porcentaje <= 100, 'Porcentaje fuera de rango o no numérico');
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(porcentaje));
  exigir(partes, 'Porcentaje debe tener hasta dos decimales');
  return BigInt(partes[1]) * 100n + BigInt((partes[2] || '').padEnd(2, '0'));
}

/** Función pura. Los valores por rol deben llegar seleccionados por vigencia. */
function calcularLiquidacion({ eventoId, montoTotalEvento, personas, roles, asignaciones, valoresRol } = {}) {
  exigir(identificador(eventoId), 'Evento inválido');
  exigir(Number.isSafeInteger(montoTotalEvento) && montoTotalEvento > 0,
    'Monto total del evento debe ser un entero CLP seguro mayor que cero');
  const personasPorId = indexar(personas, 'Personas');
  const rolesPorId = indexar(roles, 'Roles');
  const asignacionesPorId = indexar(asignaciones, 'Asignaciones');
  const valoresPorId = indexar(valoresRol, 'Valores de rol');
  exigir(asignacionesPorId.size > 0, 'Se requiere al menos una asignación');

  for (const persona of personasPorId.values()) {
    exigir(nombreValido(persona.nombre), 'Nombre de persona inválido');
  }
  for (const rol of rolesPorId.values()) {
    exigir(nombreValido(rol.nombre), 'Nombre de rol inválido');
  }

  const valoresPorRol = new Map();
  for (const valor of valoresPorId.values()) {
    exigir(rolesPorId.has(valor.rolId), 'Valor referencia un rol inexistente');
    exigir(!valoresPorRol.has(valor.rolId), 'Más de un valor vigente para el mismo rol');
    valoresPorRol.set(valor.rolId, { valor, escalado: escalarPorcentaje(valor.porcentaje) });
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
    const configuracion = valoresPorRol.get(rol.id);
    exigir(configuracion, 'Rol sin porcentaje válido');
    const pago = (BigInt(montoTotalEvento) * configuracion.escalado + 5000n) / 10000n;
    total += pago;
    exigir(total <= BigInt(Number.MAX_SAFE_INTEGER), 'Total distribuido excede el entero seguro');
    detalles.push({
      asignacionId: asignacion.id,
      personaId: persona.id,
      nombrePersona: persona.nombre,
      rolId: rol.id,
      nombreRol: rol.nombre,
      valorRolId: configuracion.valor.id,
      porcentajeAplicado: configuracion.valor.porcentaje,
      montoCalculado: Number(pago),
    });
  }
  return { eventoId, montoTotalEvento, detalles, totalDistribuido: Number(total) };
}

module.exports = { calcularLiquidacion };
