// Configuración de roles para el frontend - RF1

export const ROLES = {
  DUENO: 'DUENO',
  CONTADOR: 'CONTADOR',
  JEFE_TECNICO: 'JEFE_TECNICO',
};

// Módulos autorizados para cada rol
export const PERMISOS = {
  [ROLES.DUENO]: ['/eventos'],
  [ROLES.CONTADOR]: ['/finanzas'],
  [ROLES.JEFE_TECNICO]: ['/inventario'],
};

// Comprueba si un rol puede acceder a una ruta
export function tienePermiso(rol, ruta) {
  return PERMISOS[rol]?.includes(ruta) ?? false;
}