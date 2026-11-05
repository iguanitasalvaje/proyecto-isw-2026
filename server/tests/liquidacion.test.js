'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularLiquidacion } = require('../domain/liquidacion');

// Dos personas ficticias, exclusivamente para pruebas unitarias.
function entrada() {
  return {
    eventoId: 'A', montoTotalEvento: 350000,
    personas: [{ id: 'p1', nombre: 'Persona de prueba 1' }, { id: 'p2', nombre: 'Persona de prueba 2' }],
    roles: [{ id: 'camara', nombre: 'Cámara' }, { id: 'sonido', nombre: 'Sonido' }],
    asignaciones: [{ id: 'a1', eventoId: 'A', personaId: 'p1', rolId: 'camara' }],
    valoresRol: [{ id: 'v1', rolId: 'camara', porcentaje: 10 }, { id: 'v2', rolId: 'sonido', porcentaje: 20 }],
  };
}

test('calcula desde el monto total y devuelve la instantánea completa', () => {
  assert.deepEqual(calcularLiquidacion(entrada()), {
    eventoId: 'A', montoTotalEvento: 350000, totalDistribuido: 35000,
    detalles: [{ asignacionId: 'a1', personaId: 'p1', nombrePersona: 'Persona de prueba 1',
      rolId: 'camara', nombreRol: 'Cámara', valorRolId: 'v1', porcentajeAplicado: 10, montoCalculado: 35000 }],
  });
});

test('misma persona desempeña roles diferentes en dos eventos', () => {
  const a = entrada();
  a.personas[0].cargo = 'Director';
  const b = entrada();
  b.eventoId = 'B';
  b.asignaciones[0] = { id: 'b1', eventoId: 'B', personaId: 'p1', rolId: 'sonido' };
  assert.equal(calcularLiquidacion(a).totalDistribuido, 35000);
  assert.equal(calcularLiquidacion(b).totalDistribuido, 70000);
});

test('utiliza el porcentaje externo y admite dos decimales', () => {
  const datos = entrada();
  datos.valoresRol[0].porcentaje = 10.25;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 35875);
  datos.valoresRol[0].porcentaje = 12;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 42000);
});

test('redondea cada pago al peso, con medio hacia arriba, y suma los detalles', () => {
  for (const [monto, porcentaje, esperado] of [[1, 49.99, 0], [1, 50, 1], [1, 50.01, 1], [3, 50, 2], [10000, 0.01, 1]]) {
    const datos = entrada();
    datos.montoTotalEvento = monto;
    datos.valoresRol[0].porcentaje = porcentaje;
    assert.equal(calcularLiquidacion(datos).totalDistribuido, esperado);
  }
  const datos = entrada();
  datos.montoTotalEvento = 1;
  datos.valoresRol.forEach(v => { v.porcentaje = 50; });
  datos.asignaciones.push({ id: 'a2', eventoId: 'A', personaId: 'p2', rolId: 'sonido' });
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 2);
});

test('admite extremos 0 y 100 y monto máximo seguro sin perder precisión', () => {
  const datos = entrada();
  datos.montoTotalEvento = Number.MAX_SAFE_INTEGER;
  datos.valoresRol[0].porcentaje = 100;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, Number.MAX_SAFE_INTEGER);
  datos.valoresRol[0].porcentaje = 0;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 0);
});

test('rechaza montos inválidos', () => {
  for (const monto of [0, -1, 1.5, NaN, Infinity, '350000', null, undefined, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => calcularLiquidacion({ ...entrada(), montoTotalEvento: monto }), /Monto total/);
  }
});

test('rechaza porcentajes inválidos o con precisión no admitida', () => {
  for (const porcentaje of [-1, 101, NaN, Infinity, '10', '', null, undefined, true, 10.251, 0.1 + 0.2]) {
    const datos = entrada();
    datos.valoresRol[0].porcentaje = porcentaje;
    assert.throws(() => calcularLiquidacion(datos), /Porcentaje/);
  }
});

test('rechaza rol sin porcentaje y valores vigentes ambiguos', () => {
  const datos = entrada();
  datos.valoresRol = [];
  assert.throws(() => calcularLiquidacion(datos), /sin porcentaje/);
  datos.valoresRol = [...entrada().valoresRol, { id: 'v3', rolId: 'camara', porcentaje: 12 }];
  assert.throws(() => calcularLiquidacion(datos), /Más de un valor/);
});

test('rechaza referencias inexistentes y asignaciones de otro evento', () => {
  for (const [campo, valor, error] of [['personaId', 'ausente', /Persona/], ['rolId', 'ausente', /Rol/], ['eventoId', 'B', /otro evento/]]) {
    const datos = entrada();
    datos.asignaciones[0][campo] = valor;
    assert.throws(() => calcularLiquidacion(datos), error);
  }
  const datos = entrada();
  datos.valoresRol[0].rolId = 'ausente';
  assert.throws(() => calcularLiquidacion(datos), /rol inexistente/);
});

test('rechaza colecciones, identificadores y nombres inválidos', () => {
  assert.throws(() => calcularLiquidacion(), /Evento/);
  for (const campo of ['personas', 'roles', 'asignaciones', 'valoresRol']) {
    assert.throws(() => calcularLiquidacion({ ...entrada(), [campo]: null }), /arreglo/);
    const datos = entrada();
    datos[campo][0].id = '';
    assert.throws(() => calcularLiquidacion(datos), /identificador inválido/);
    const duplicados = entrada();
    duplicados[campo].push({ ...duplicados[campo][0] });
    assert.throws(() => calcularLiquidacion(duplicados), /duplicado/);
  }
  for (const campo of ['personas', 'roles']) {
    const datos = entrada();
    datos[campo][0].nombre = ' ';
    assert.throws(() => calcularLiquidacion(datos), /Nombre/);
  }
});

test('rechaza ausencia de participantes y persona repetida en un evento', () => {
  assert.throws(() => calcularLiquidacion({ ...entrada(), asignaciones: [] }), /al menos una/);
  const datos = entrada();
  datos.asignaciones.push({ ...datos.asignaciones[0], id: 'a2', rolId: 'sonido' });
  assert.throws(() => calcularLiquidacion(datos), /Persona duplicada/);
});

test('rechaza desbordamiento del total distribuido', () => {
  const datos = entrada();
  datos.montoTotalEvento = Number.MAX_SAFE_INTEGER;
  datos.valoresRol.forEach(v => { v.porcentaje = 100; });
  datos.asignaciones.push({ id: 'a2', eventoId: 'A', personaId: 'p2', rolId: 'sonido' });
  assert.throws(() => calcularLiquidacion(datos), /excede el entero seguro/);
});

test('no muta entradas y la instantánea no cambia al modificar los catálogos', () => {
  const datos = entrada();
  const original = JSON.parse(JSON.stringify(datos));
  const resultado = calcularLiquidacion(datos);
  assert.deepEqual(datos, original);
  datos.personas[0].nombre = 'Nuevo nombre';
  datos.roles[0].nombre = 'Nuevo rol';
  datos.valoresRol[0].porcentaje = 30;
  assert.equal(resultado.detalles[0].nombrePersona, 'Persona de prueba 1');
  assert.equal(resultado.detalles[0].nombreRol, 'Cámara');
  assert.equal(resultado.detalles[0].porcentajeAplicado, 10);
});
