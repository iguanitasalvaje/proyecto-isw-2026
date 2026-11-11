
// Roles disponibles en Six Seven Transmisiones

const ROLES = Object.freeze({
  DUENO: 'DUENO',
  CONTADOR: 'CONTADOR',
  JEFE_TECNICO: 'JEFE_TECNICO'
});

// Módulos autorizados para cada rol según RF1
const PERMISOS = Object.freeze({
  [ROLES.DUENO]: [
    'dashboard',
    'eventos',
    'inventario',
    'personal',
    'auspiciadores',
    'finanzas',
    'reportes',
    'calculadora-pagos'
  ],

  [ROLES.CONTADOR]: [
    'dashboard',
    'eventos',
    'auspiciadores',
    'finanzas',
    'reportes',
    'calculadora-pagos'
  ],

  [ROLES.JEFE_TECNICO]: [
    'dashboard',
    'inventario'
  ]
});

module.exports = {
  ROLES,
  PERMISOS
};
