// Configuración de roles para el frontend - RF1
export const ROLES = Object.freeze({
  DUENO: 'DUENO',
  CONTADOR: 'CONTADOR',
  JEFE_TECNICO: 'JEFE_TECNICO'
});

// Módulos autorizados para cada rol según la Matriz Definitiva de Permisos
export const PERMISOS = Object.freeze({
  [ROLES.DUENO]: [
    '/',
    '/eventos',
    '/inventario',
    '/personal',
    '/auspiciadores',
    '/finanzas',
    '/reportes',
    '/calculadora-pagos',
    '/usuarios' // Módulo exclusivo del Dueño para administrar cuentas
  ],

  [ROLES.CONTADOR]: [
    '/',
    '/eventos',
    '/auspiciadores',
    '/finanzas',
    '/reportes',
    '/calculadora-pagos'
  ],

  [ROLES.JEFE_TECNICO]: [
    '/',
    '/inventario'
  ]
});

// Comprueba si el rol puede acceder a la ruta indicada
export function tienePermiso(rol, ruta) {
  if (!rol || !ruta) return false;
  return PERMISOS[rol]?.includes(ruta) ?? false;
}
