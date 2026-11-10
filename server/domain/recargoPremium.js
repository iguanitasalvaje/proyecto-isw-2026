'use strict';

function calcularRecargo(precioBase, porcentajeCentesimas) {
  if (!Number.isSafeInteger(precioBase) || precioBase <= 0) throw new TypeError('Precio base inválido');
  if (!Number.isInteger(porcentajeCentesimas) || porcentajeCentesimas < 0 || porcentajeCentesimas > 10000) {
    throw new TypeError('Porcentaje Premium debe ser entero entre 0 y 10000 centésimas');
  }
  const recargo = (BigInt(precioBase) * BigInt(porcentajeCentesimas) + 5000n) / 10000n;
  const total = BigInt(precioBase) + recargo;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Total fuera del rango seguro');
  return { precioBase, porcentajeCentesimas, recargo: Number(recargo), montoTotal: Number(total) };
}
module.exports = { calcularRecargo };
