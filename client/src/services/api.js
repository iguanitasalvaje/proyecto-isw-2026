
const base = import.meta.env.VITE_API_URL || '/api';

const CLAVE_TOKEN = 'token_sesion';

// Obtener el token guardado
export function obtenerToken() {
  return sessionStorage.getItem(CLAVE_TOKEN);
}

// Guardar el token
export function guardarToken(token) {
  sessionStorage.setItem(CLAVE_TOKEN, token);
}

// Eliminar el token
export function eliminarToken() {
  sessionStorage.removeItem(CLAVE_TOKEN);
}

// Realizar solicitudes al servidor
export async function api(ruta, { method = 'GET', body, signal } = {}) {
  const token = obtenerToken();

  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Enviar token si existe una sesión
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${base}${ruta}`, {
    method,
    signal,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Manejar respuestas sin contenido
  if (respuesta.status === 204) {
    return null;
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw Object.assign(
      new Error(datos.error || 'No se pudo completar la operación'),
      { status: respuesta.status }
    );
  }

  return datos;
}
