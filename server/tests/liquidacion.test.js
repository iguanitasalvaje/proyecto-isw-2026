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
    asignaciones: [{ id: 'a1', eventoId: 'A', personaId: 'p1', rolId: 'camara', porcentajeCentesimas: 1000 }],
  };
}

test('calcula desde el monto total y devuelve la instantánea completa', () => {
  assert.deepEqual(calcularLiquidacion(entrada()), {
    eventoId: 'A', montoTotalEvento: 350000, totalDistribuido: 35000,
    detalles: [{ asignacionId: 'a1', personaId: 'p1', nombrePersona: 'Persona de prueba 1',
      rolId: 'camara', nombreRol: 'Cámara', porcentajeAplicado: 10, montoCalculado: 35000 }],
  });
});

test('misma persona desempeña roles diferentes en dos eventos', () => {
  const a = entrada();
  a.personas[0].cargo = 'Director';
  const b = entrada();
  b.eventoId = 'B';
  b.asignaciones[0] = { id: 'b1', eventoId: 'B', personaId: 'p1', rolId: 'sonido', porcentajeCentesimas: 2000 };
  assert.equal(calcularLiquidacion(a).totalDistribuido, 35000);
  assert.equal(calcularLiquidacion(b).totalDistribuido, 70000);
});

test('utiliza el porcentaje individual en centésimas', () => {
  const datos = entrada();
  datos.asignaciones[0].porcentajeCentesimas = 1025;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 35875);
  datos.asignaciones[0].porcentajeCentesimas = 1200;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 42000);
});

test('redondea cada pago al peso, con medio hacia arriba, y suma los detalles', () => {
  for (const [monto, porcentaje, esperado] of [[1, 4999, 0], [1, 5000, 1], [1, 5001, 1], [3, 5000, 2], [10000, 1, 1]]) {
    const datos = entrada();
    datos.montoTotalEvento = monto;
    datos.asignaciones[0].porcentajeCentesimas = porcentaje;
    assert.equal(calcularLiquidacion(datos).totalDistribuido, esperado);
  }
  const datos = entrada();
  datos.montoTotalEvento = 1;
  datos.asignaciones[0].porcentajeCentesimas = 5000;
  datos.asignaciones.push({ id: 'a2', eventoId: 'A', personaId: 'p2', rolId: 'sonido', porcentajeCentesimas: 5000 });
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 2);
});

test('admite extremos 0 y 100 y monto máximo seguro sin perder precisión', () => {
  const datos = entrada();
  datos.montoTotalEvento = Number.MAX_SAFE_INTEGER;
  datos.asignaciones[0].porcentajeCentesimas = 10000;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, Number.MAX_SAFE_INTEGER);
  datos.asignaciones[0].porcentajeCentesimas = 0;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 0);
});

test('rechaza montos inválidos', () => {
  for (const monto of [0, -1, 1.5, NaN, Infinity, '350000', null, undefined, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => calcularLiquidacion({ ...entrada(), montoTotalEvento: monto }), /Monto total/);
  }
});

test('rechaza porcentajes inválidos o con precisión no admitida', () => {
  for (const porcentaje of [-1, 10001, NaN, Infinity, '1000', '', null, undefined, true, 1025.1, 0.1 + 0.2]) {
    const datos = entrada();
    datos.asignaciones[0].porcentajeCentesimas = porcentaje;
    assert.throws(() => calcularLiquidacion(datos), /Porcentaje/);
  }
});

test('rechaza una asignación sin porcentaje aunque exista una sugerencia del rol', () => {
  const datos = entrada();
  delete datos.asignaciones[0].porcentajeCentesimas;
  datos.valoresRol = [{ id: 'v1', rolId: 'camara', porcentaje: 10 }];
  assert.throws(() => calcularLiquidacion(datos), /Porcentaje individual/);
});

test('rechaza referencias inexistentes y asignaciones de otro evento', () => {
  for (const [campo, valor, error] of [['personaId', 'ausente', /Persona/], ['rolId', 'ausente', /Rol/], ['eventoId', 'B', /otro evento/]]) {
    const datos = entrada();
    datos.asignaciones[0][campo] = valor;
    assert.throws(() => calcularLiquidacion(datos), error);
  }

});

test('rechaza colecciones, identificadores y nombres inválidos', () => {
  assert.throws(() => calcularLiquidacion(), /Evento/);
  for (const campo of ['personas', 'roles', 'asignaciones']) {
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
  datos.asignaciones.push({ ...datos.asignaciones[0], id: 'a2', rolId: 'sonido', porcentajeCentesimas: 5000 });
  assert.throws(() => calcularLiquidacion(datos), /Persona duplicada/);
});

test('admite suma inferior o igual al 100% y rechaza una centésima de exceso', () => {
  const datos = entrada();
  datos.asignaciones[0].porcentajeCentesimas = 6000;
  datos.asignaciones.push({ id: 'a2', eventoId: 'A', personaId: 'p2', rolId: 'sonido', porcentajeCentesimas: 3999 });
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 349965);
  datos.asignaciones[1].porcentajeCentesimas = 4000;
  assert.equal(calcularLiquidacion(datos).totalDistribuido, 350000);
  datos.asignaciones[1].porcentajeCentesimas = 4001;
  assert.throws(() => calcularLiquidacion(datos), /superar el 100%/);
});

test('dos trabajadores del mismo rol pueden tener porcentajes distintos', () => {
  const datos = entrada();
  datos.asignaciones.push({ id: 'a2', eventoId: 'A', personaId: 'p2', rolId: 'camara', porcentajeCentesimas: 1500 });
  assert.deepEqual(calcularLiquidacion(datos).detalles.map(d => d.montoCalculado), [35000, 52500]);
});

test('cambiar la sugerencia del rol no altera el porcentaje ya asignado', () => {
  const datos = entrada();
  datos.valoresRol = [{ id: 'v1', rolId: 'camara', porcentaje: 10 }];
  const resultado = calcularLiquidacion(datos);
  datos.valoresRol[0].porcentaje = 90;
  assert.deepEqual(calcularLiquidacion(datos), resultado);
});

test('no muta entradas y la instantánea no cambia al modificar los catálogos', () => {
  const datos = entrada();
  const original = JSON.parse(JSON.stringify(datos));
  const resultado = calcularLiquidacion(datos);
  assert.deepEqual(datos, original);
  datos.personas[0].nombre = 'Nuevo nombre';
  datos.roles[0].nombre = 'Nuevo rol';
  datos.asignaciones[0].porcentajeCentesimas = 3000;
  assert.equal(resultado.detalles[0].nombrePersona, 'Persona de prueba 1');
  assert.equal(resultado.detalles[0].nombreRol, 'Cámara');
  assert.equal(resultado.detalles[0].porcentajeAplicado, 10);
});
