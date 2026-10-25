// Roles disponibles en Six Seven Transmisiones

const ROLES = Object.freeze({
  DUENO: 'DUENO',
  CONTADOR: 'CONTADOR',
  JEFE_TECNICO: 'JEFE_TECNICO'
});

// Módulos asignados a cada rol según RF1
const PERMISOS = Object.freeze({
  [ROLES.DUENO]: ['eventos'],
  [ROLES.CONTADOR]: ['finanzas'],
  [ROLES.JEFE_TECNICO]: ['inventario']
});

module.exports = {
  ROLES,
  PERMISOS
};