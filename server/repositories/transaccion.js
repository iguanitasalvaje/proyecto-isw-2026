'use strict';

function errorEstado(mensaje, status = 409) {
  return Object.assign(new Error(mensaje), { status });
}
async function transaccion(pool, trabajo) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const resultado = await trabajo(db);
    await db.query('COMMIT');
    return resultado;
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { db.release(); }
}
async function bloquearEvento(db, id, versionEvento) {
  const evento = (await db.query('SELECT * FROM evento WHERE id=$1 FOR UPDATE', [id])).rows[0];
  if (!evento) throw errorEstado('Evento inexistente', 404);
  if (versionEvento !== undefined && evento.version !== versionEvento) throw errorEstado('El evento cambió. Recarga los datos.');
  return evento;
}
async function exigirSinLiquidacion(db, eventoId) {
  if ((await db.query('SELECT 1 FROM liquidacion WHERE evento_id=$1', [eventoId])).rowCount) {
    throw errorEstado('El evento ya tiene una liquidación guardada');
  }
}
module.exports = { transaccion, bloquearEvento, exigirSinLiquidacion, errorEstado };
