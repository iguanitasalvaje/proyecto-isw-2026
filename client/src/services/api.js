const base = import.meta.env.VITE_API_URL || '/api';
export async function api(ruta, { method = 'GET', body, signal } = {}) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method, signal,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw Object.assign(new Error(datos.error || 'No se pudo completar la operación'), { status: respuesta.status });
  return datos;
}
