import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { api } from '../../services/api';

const pesos = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n ?? 0);
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const claseFiltro = 'rounded-lg border border-line-strong bg-field px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40';

function Indicador({ titulo, valor, detalle, color = 'text-main' }) {
  return (
    <Card className="min-w-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</p>
      <p className={`break-words text-2xl font-bold md:text-3xl ${color}`}>{pesos(valor)}</p>
      <p className="mt-2 text-xs text-dim">{detalle}</p>
    </Card>
  );
}

function GraficoEventos({ eventos }) {
  if (!eventos.length) {
    return <p className="py-14 text-center text-muted">No hay eventos para los filtros seleccionados.</p>;
  }
  const max = Math.max(1, ...eventos.map(e => Math.abs(e.resultadoEstimadoClp)));
  return (
    <div className="space-y-5">
      {eventos.slice(0, 10).map(evento => (
        <div key={evento.id}>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-main" title={evento.nombre}>{evento.nombre}</span>
            <span className={`shrink-0 text-sm font-semibold ${evento.resultadoEstimadoClp < 0 ? 'text-danger' : 'text-success'}`}>{pesos(evento.resultadoEstimadoClp)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${evento.resultadoEstimadoClp < 0 ? 'bg-danger' : 'bg-primary-alt'}`}
              style={{ width: `${Math.max(evento.resultadoEstimadoClp === 0 ? 0 : 2, Math.abs(evento.resultadoEstimadoClp) / max * 100)}%` }}
              role="img"
              aria-label={`Resultado estimado ${pesos(evento.resultadoEstimadoClp)}`}
            />
          </div>
        </div>
      ))}
      {eventos.length > 10 && <p className="text-xs text-muted">Se muestran los primeros 10 eventos. El detalle completo está en la tabla inferior.</p>}
    </div>
  );
}

export default function Dashboard() {
  const hoy = new Date();
  const [cliente, setCliente] = useState('');
  const [periodo, setPeriodo] = useState('todos');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recargar, setRecargar] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ periodo });
    if (cliente) params.set('cliente', cliente);
    if (periodo !== 'todos') params.set('anio', String(anio));
    if (periodo === 'mes') params.set('mes', String(mes));
    // El helper api maneja las rutas relativas al backend (/api).
    // AbortController evita que una respuesta antigua reemplace un filtro nuevo.
    api(`/reportes/financiero?${params.toString()}`, { signal: controller.signal })
      .then(respuesta => { setDatos(respuesta); setError(''); })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message || 'No se pudo cargar el reporte'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [cliente, periodo, anio, mes, recargar]);

  const indicadores = datos?.indicadores;
  const eventos = datos?.eventos || [];
  const clientes = datos?.clientes || [];
  return (
    <div className="min-h-screen bg-app p-5 text-main md:p-8">
      <header className="mb-7 flex flex-col justify-between gap-5 border-b border-line pb-5 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de resultados económicos</h1>
          <p className="mt-2 text-sm text-muted">Montos calculados desde los registros de eventos, canjes, liquidaciones y gastos operativos.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">Cliente
            <select value={cliente} onChange={e => { setCargando(true); setCliente(e.target.value); }} className={claseFiltro}>
              <option value="">Todos los clientes</option>
              {clientes.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">Período
            <select value={periodo} onChange={e => { setCargando(true); setPeriodo(e.target.value); }} className={claseFiltro}>
              <option value="todos">Todas las fechas</option>
              <option value="mes">Mes</option>
              <option value="temporada">Temporada (año)</option>
            </select>
          </label>
          {periodo !== 'todos' && <label className="flex flex-col gap-1 text-xs text-muted">Año
            <input type="number" min="2000" max="2100" value={anio} onChange={e => { setCargando(true); setAnio(e.target.value); }} className={`${claseFiltro} w-24`} />
          </label>}
          {periodo === 'mes' && <label className="flex flex-col gap-1 text-xs text-muted">Mes
            <select value={mes} onChange={e => { setCargando(true); setMes(Number(e.target.value)); }} className={claseFiltro}>
              {meses.map((nombre, indice) => <option key={nombre} value={indice + 1}>{nombre}</option>)}
            </select>
          </label>}
          <button type="button" onClick={() => { setCargando(true); setRecargar(v => v + 1); }} className="rounded-lg border border-line-strong bg-panel px-3 py-2 text-sm font-semibold text-main hover:bg-line">Actualizar</button>
        </div>
      </header>

      {error && <div role="alert" className="mb-5 rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger">Error al cargar los datos: {error}. Comprueba que Express esté funcionando y que la migración 005 esté aplicada.</div>}
      {cargando && <p role="status" className="mb-5 text-sm text-muted">Cargando resultados...</p>}

      {indicadores && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador titulo="Monto de eventos" valor={indicadores.montoTotalClp} detalle="Valor contratado, incluidos recargos de kits. No equivale a dinero cobrado." color="text-success" />
            <Indicador titulo="Canjes valorizados" valor={indicadores.canjesEstimadosClp} detalle="Aportes en especies. No son ingresos en efectivo." color="text-primary-alt" />
            <Indicador titulo="Liquidaciones + gastos" valor={indicadores.liquidacionesRegistradasClp + indicadores.gastosOperativosClp} detalle={`${pesos(indicadores.liquidacionesRegistradasClp)} personal + ${pesos(indicadores.gastosOperativosClp)} gastos.`} color="text-danger" />
            <Indicador titulo="Resultado económico estimado" valor={indicadores.resultadoEstimadoClp} detalle="Monto de eventos + canjes − liquidaciones − gastos." color="text-warning" />
          </div>
          {indicadores.eventosSinLiquidacion > 0 && <p className="mb-6 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-warning">Hay {indicadores.eventosSinLiquidacion} evento(s) sin liquidación registrada. El resultado es parcial y no representa utilidad neta definitiva.</p>}
          <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <h2 className="mb-5 font-semibold text-main">Resultado estimado por evento</h2>
              <GraficoEventos eventos={eventos} />
            </Card>
            <Card>
              <h2 className="mb-5 font-semibold text-main">Desglose financiero</h2>
              <dl className="space-y-4 text-sm">
                {[
                  ['Eventos registrados', indicadores.cantidadEventos, false],
                  ['Precio contratado (incluye kits)', indicadores.montoTotalClp, true],
                  ['Recargo de kits (ya incluido)', indicadores.recargosKitIncluidosClp, true],
                  ['Canjes estimados', indicadores.canjesEstimadosClp, true],
                  ['Liquidaciones registradas', indicadores.liquidacionesRegistradasClp, true],
                  ['Gastos operativos', indicadores.gastosOperativosClp, true],
                ].map(([titulo, valor, moneda]) => (
                  <div className="flex justify-between gap-4 border-b border-line pb-3" key={titulo}>
                    <dt className="text-muted">{titulo}</dt><dd className="text-right font-semibold text-main">{moneda ? pesos(valor) : valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-dim">Temporada corresponde al año calendario. Los eventos sin fecha solamente aparecen en “Todas las fechas”.</p>
            </Card>
          </div>
          <Card>
            <h2 className="mb-4 font-semibold text-main">Detalle de eventos</h2>
            {eventos.length ? <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead><tr className="border-b border-line text-muted">
                  {['Evento', 'Cliente', 'Monto contratado', 'Canjes', 'Liquidaciones', 'Gastos', 'Resultado'].map(t => <th key={t} scope="col" className="px-3 py-3 font-semibold">{t}</th>)}
                </tr></thead>
                <tbody>{eventos.map(evento => <tr key={evento.id} className="border-b border-line/70">
                  <td className="px-3 py-3 text-main">{evento.nombre}{!evento.liquidacionRegistrada && <span className="mt-1 block text-xs text-warning">Sin liquidación</span>}</td>
                  <td className="px-3 py-3 text-muted">{evento.cliente || 'Sin cliente'}</td>
                  <td className="px-3 py-3">{pesos(evento.montoTotalClp)}</td>
                  <td className="px-3 py-3">{pesos(evento.canjesEstimadosClp)}</td>
                  <td className="px-3 py-3">{pesos(evento.liquidacionesRegistradasClp)}</td>
                  <td className="px-3 py-3">{pesos(evento.gastosOperativosClp)}</td>
                  <td className={`px-3 py-3 font-bold ${evento.resultadoEstimadoClp < 0 ? 'text-danger' : 'text-success'}`}>{pesos(evento.resultadoEstimadoClp)}</td>
                </tr>)}</tbody>
              </table>
            </div> : <p className="py-8 text-center text-muted">No hay eventos registrados para estos filtros.</p>}
          </Card>
        </>
      )}
    </div>
  );
}
