import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import './CalculadoraPagos.css';

const dinero = valor => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
const centesimas = valor => /^\d+(\.\d{1,2})?$/.test(String(valor)) ? Math.round(Number(valor) * 100) : NaN;

export default function CalculadoraPagos() {
  const [eventos, setEventos] = useState(null);
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api('/eventos', { signal: controller.signal }).then(setEventos).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => controller.abort();
  }, [intento]);
  return <div className="pagos-app"><div className="pagos-contenido">
    <header className="pagos-header"><h1>Calculadora de Pagos</h1><p>Distribuye el monto final del evento entre sus trabajadores.</p></header>
    {error && <p role="alert" className="pagos-error">{error} <button onClick={() => { setError(''); setIntento(i => i + 1); }}>Reintentar</button></p>}
    {!eventos && !error && <p role="status">Cargando eventos…</p>}
    {eventos?.length === 0 && <p>No hay eventos registrados.</p>}
    <section className="pagos-evento"><label htmlFor="evento-pagos">Evento</label>
      <select id="evento-pagos" value={id} onChange={e => setId(e.target.value)} disabled={!eventos?.length}>
        <option value="">— Seleccionar evento —</option>
        {eventos?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
    </section>
    {id && <DetalleEvento key={id} id={id} />}
  </div></div>;
}

function DetalleEvento({ id }) {
  const [datos, setDatos] = useState(null);
  const [porcentajes, setPorcentajes] = useState({});
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([api(`/eventos/${id}`, { signal }), api(`/eventos/${id}/asignaciones`, { signal }),
      api(`/eventos/${id}/liquidacion`, { signal }).catch(e => { if (e.status === 404) return null; throw e; })])
      .then(([evento, asignaciones, liquidacion]) => {
        setDatos({ evento, asignaciones, liquidacion });
        setPorcentajes(Object.fromEntries(asignaciones.map(a => [a.id, a.porcentaje_centesimas === null ? '' : String(a.porcentaje_centesimas / 100)])));
      }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [id, recarga]);

  async function ejecutar(trabajo) {
    setOcupado(true); setError('');
    try { await trabajo(); }
    catch (e) { setError(e.status === 409 ? `${e.message} Usa «Recargar datos» antes de continuar.` : e.message); setPreview(null); setConfirmar(false); }
    finally { setOcupado(false); }
  }
  function recargar() { setDatos(null); setError(''); setPreview(null); setConfirmar(false); setRecarga(r => r + 1); }
  if (!datos) return <section aria-busy={!error}>{error ? <p role="alert">{error}</p> : <p role="status">Cargando evento…</p>}<button onClick={recargar}>Recargar datos</button></section>;
  const { evento, asignaciones, liquidacion } = datos;
  const cambios = asignaciones.map(a => ({ asignacionId: a.id, porcentajeCentesimas: centesimas(porcentajes[a.id]) }));
  const total = liquidacion ? liquidacion.detalles.reduce((s, d) => s + Math.round(d.porcentajeAplicado * 100), 0) : cambios.reduce((s, c) => s + c.porcentajeCentesimas, 0);
  const valido = cambios.every(c => Number.isInteger(c.porcentajeCentesimas) && c.porcentajeCentesimas >= 0 && c.porcentajeCentesimas <= 10000) && total <= 10000;
  const modificado = cambios.some((c, i) => c.porcentajeCentesimas !== asignaciones[i].porcentaje_centesimas);
  const resultado = liquidacion || preview;
  const filas = liquidacion ? liquidacion.detalles.map(d => ({ id: d.asignacionId, nombre_persona: d.nombrePersona, nombre_rol: d.nombreRol, porcentaje: d.porcentajeAplicado })) : asignaciones;
  const finalizado = evento.estado === 'finalizado';
  const ruta = `/eventos/${id}`;
  return <section aria-busy={ocupado}>
    {error && <p role="alert" className="pagos-error">{error}</p>}
    <div className="pagos-controles"><p>Estado: <strong>{evento.estado}</strong></p><button disabled={ocupado} onClick={recargar}>Recargar datos</button></div>
    {liquidacion && <p className="pagos-exito">Liquidación guardada · Solo consulta · {new Date(liquidacion.creadaEn).toLocaleString('es-CL')}</p>}
    {!filas.length && <p>No hay trabajadores asignados a este evento.</p>}
    <div className="pagos-tabla"><div className="pagos-tabla-header"><span>TRABAJADOR</span><span>ROL</span><span>PORCENTAJE</span><span>PAGO CLP</span></div>
      {filas.map(a => <div className="pagos-fila" key={a.id}>
        <span>{a.nombre_persona}</span><span>{a.nombre_rol}</span>
        {liquidacion ? <span>{a.porcentaje}%</span> : <div className="pagos-porcentaje"><input aria-label={`Porcentaje de ${a.nombre_persona}`} type="number" min="0" max="100" step="0.01" disabled={ocupado} value={porcentajes[a.id]} onChange={e => {
          setPorcentajes(p => ({ ...p, [a.id]: e.target.value })); setPreview(null); setConfirmar(false);
        }} /><span>%</span></div>}
        <span>{resultado ? dinero(resultado.detalles.find(d => d.asignacionId === a.id)?.montoCalculado ?? 0) : '—'}</span>
      </div>)}
    </div>
    <p className={valido || liquidacion ? 'pagos-porcentaje-total' : 'pagos-error'}>Utilizado: {Number.isFinite(total) ? (total / 100).toFixed(2) : '—'}% · Restante: {Number.isFinite(total) ? ((10000 - total) / 100).toFixed(2) : '—'}%</p>
    {!valido && !liquidacion && <p role="alert" className="pagos-error">Completa los porcentajes con hasta dos decimales. La suma no puede superar 100%.</p>}
    <div className="pagos-resultados"><div className="pagos-monto"><span>MONTO FINAL ACORDADO</span><strong>{dinero(liquidacion?.montoTotalEvento ?? evento.monto_total)}</strong></div>
      <div className="pagos-ganancias"><span>{liquidacion ? 'LIQUIDACIÓN HISTÓRICA' : 'PREVISUALIZACIÓN DEL SERVIDOR'}</span>
        <div className="pagos-resultado-linea"><p>Total distribuido</p><strong>{resultado ? dinero(resultado.totalDistribuido) : '—'}</strong></div>
        <div className="pagos-resultado-linea"><p>Monto restante</p><strong>{resultado ? dinero(resultado.montoTotalEvento - resultado.totalDistribuido) : '—'}</strong></div>
      </div></div>
    {!liquidacion && <div className="pagos-acciones">
      <button disabled={ocupado || !valido || !modificado || !asignaciones.length} onClick={() => ejecutar(async () => {
        const r = await api(`${ruta}/asignaciones/porcentajes`, { method: 'PATCH', body: { versionEvento: evento.version, cambios } });
        setDatos(d => ({ ...d, evento: { ...d.evento, version: r.versionEvento }, asignaciones: d.asignaciones.map(a => ({ ...a, porcentaje_centesimas: centesimas(porcentajes[a.id]) })) })); setPreview(null);
      })}>Guardar porcentajes</button>
      {!finalizado && <button disabled={ocupado || modificado} onClick={() => ejecutar(async () => {
        const r = await api(`${ruta}/estado`, { method: 'PATCH', body: { versionEvento: evento.version, estado: evento.estado === 'pendiente' ? 'en_curso' : 'finalizado' } });
        setDatos(d => ({ ...d, evento: r }));
      })}>{evento.estado === 'pendiente' ? 'Iniciar evento' : 'Finalizar evento'}</button>}
      <button disabled={ocupado || !finalizado || !valido || modificado || !asignaciones.length} onClick={() => ejecutar(async () => {
        setPreview(await api(`${ruta}/liquidacion/previsualizacion`, { method: 'POST', body: { versionEvento: evento.version } }));
      })}>Previsualizar pagos</button>
      <button disabled={ocupado || !preview || modificado} onClick={() => setConfirmar(true)}>Guardar liquidación</button>
    </div>}
    {!finalizado && !liquidacion && <p>La previsualización y el guardado requieren finalizar el evento. Al finalizar se congelan monto, trabajadores y roles.</p>}
    {confirmar && <Confirmacion ocupado={ocupado} cancelar={() => setConfirmar(false)} guardar={() => ejecutar(async () => {
      const r = await api(`${ruta}/liquidacion`, { method: 'POST', body: { versionEvento: preview.versionEvento } });
      setDatos(d => ({ ...d, liquidacion: r })); setConfirmar(false); setPreview(null);
    })} />}

  </section>;
}

function Confirmacion({ ocupado, cancelar, guardar }) {
  const dialog = useRef(null);
  useEffect(() => {
    const nodo = dialog.current;
    nodo.showModal();
    return () => nodo.close();
  }, []);
  return <dialog ref={dialog} className="pagos-modal" aria-labelledby="confirmacion-titulo" onCancel={e => {
    if (ocupado) e.preventDefault(); else cancelar();
  }}>
    <h2 id="confirmacion-titulo">Guardar liquidación</h2>
    <p>¿Estás seguro de guardar esta liquidación? Los trabajadores, roles, porcentajes e importes quedarán registrados y no podrán modificarse.</p>
    <div className="pagos-acciones"><button autoFocus disabled={ocupado} onClick={cancelar}>Cancelar</button><button disabled={ocupado} onClick={guardar}>Confirmar guardado</button></div>
  </dialog>;
}
