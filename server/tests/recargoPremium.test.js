'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularRecargo } = require('../domain/recargoPremium');

test('calcula base más recargo desde un porcentaje recibido', () => {
  assert.deepEqual(calcularRecargo(500000, 1025), { precioBase: 500000, porcentajeCentesimas: 1025, recargo: 51250, montoTotal: 551250 });
});
test('cero no genera recargo y admite 100%', () => {
  assert.equal(calcularRecargo(500000, 0).montoTotal, 500000);
  assert.equal(calcularRecargo(500000, 10000).montoTotal, 1000000);
});
test('redondea al peso CLP con medio hacia arriba', () => {
  assert.equal(calcularRecargo(1, 4999).recargo, 0);
  assert.equal(calcularRecargo(1, 5000).recargo, 1);
  assert.equal(calcularRecargo(10001, 3333).recargo, 3333);
});
test('rechaza precios que no sean enteros positivos seguros', () => {
  for (const precio of [0, -1, 1.5, '100', null, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => calcularRecargo(precio, 1000), /Precio/);
  }
});
test('rechaza porcentajes sin precisión válida', () => {
  for (const p of [-1, 10001, 1.5, '10', null, undefined, NaN, Infinity]) assert.throws(() => calcularRecargo(100, p), /Porcentaje/);
});
test('rechaza desbordamiento sin pérdida de precisión', () => {
  assert.equal(calcularRecargo(Number.MAX_SAFE_INTEGER, 0).montoTotal, Number.MAX_SAFE_INTEGER);
  assert.throws(() => calcularRecargo(Number.MAX_SAFE_INTEGER, 1), /rango seguro/);
});
