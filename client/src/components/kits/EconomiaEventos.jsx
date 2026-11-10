import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './kits.css';

const dinero = monto => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(monto);

export default function EconomiaEventos({ editable = false, onCambio }) {
  const [eventos, setEventos] = useState(null);
  const [eventoId, setEventoId] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api('/eventos', { signal: controller.signal }).then(setEventos).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => controller.abort();
  }, [revision]);
  return <section className="kits-panel" aria-label="Economía del evento">
    <h2>{editable ? 'Asignar kit a un evento' : 'Precio base y recargo Premium por evento'}</h2>
    {error && <p role="alert">{error} <button onClick={() => { setError(''); setRevision(r => r + 1); }}>Reintentar</button></p>}
    {!eventos && !error && <p role="status">Cargando eventos…</p>}
    {eventos?.length === 0 && <p>No hay eventos registrados.</p>}
    <label htmlFor="evento-kit">Evento</label>
    <select id="evento-kit" value={eventoId} disabled={!eventos?.length} onChange={e => setEventoId(e.target.value)}>
      <option value="">— Seleccionar evento —</option>
      {eventos?.map(e => <option value={e.id} key={e.id}>{e.nombre}</option>)}
    </select>
    {eventoId && <DetalleEconomico key={eventoId} eventoId={eventoId} editable={editable} onCambio={onCambio} />}
  </section>;
}

function DetalleEconomico({ eventoId, editable, onCambio }) {
  const [datos, setDatos] = useState(null);
  const [kits, setKits] = useState([]);
  const [kitId, setKitId] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([api(`/eventos/${eventoId}/economia`, { signal }), editable ? api('/kits', { signal }) : Promise.resolve([])])
      .then(([economia, catalogo]) => {
        setDatos(economia); setKitId(economia.kit?.id || ''); setKits(catalogo);
      }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [eventoId, editable, revision]);
  async function guardar(e) {
    e.preventDefault(); setOcupado(true); setError(''); setMensaje('');
    try {
      const resultado = await api(`/eventos/${eventoId}/kit`, {
        method: 'PUT', body: { kitId: kitId || null, versionEvento: datos.versionEvento },
      });
      setDatos(resultado); setKitId(resultado.kit?.id || '');
      setMensaje('Kit y total del evento guardados.');
      onCambio?.();
      setRevision(r => r + 1);
    } catch (e) {
      setError(e.status === 409 ? `${e.message}. Recarga los datos antes de continuar.` : e.message);
    } finally { setOcupado(false); }
  }
  const bloqueado = datos?.estado === 'finalizado';
  const recargar = () => { setDatos(null); setError(''); setMensaje(''); setRevision(r => r + 1); };
  return <div aria-busy={ocupado}>
    {error && <p role="alert" className="kits-error">{error}</p>}
    {mensaje && <p role="status" className="kits-exito">{mensaje}</p>}
    {!datos && !error && <p role="status">Cargando detalle económico…</p>}
    <button type="button" disabled={ocupado} onClick={recargar}>Recargar datos del evento</button>
    {datos && <>
      <p>Estado: <strong>{datos.estado}</strong>{bloqueado && ' · Solo consulta'}</p>
      <p>Kit asignado: <strong>{datos.kit?.nombre || 'Sin kit'}</strong>
        {datos.kit && <span className={datos.kit.premium ? 'kits-premium' : ''}> · {datos.kit.premium ? 'Premium' : 'Normal'}</span>}
      </p>
      <dl className="kits-economia">
        <div><dt>Precio base</dt><dd>{dinero(datos.precioBase)}</dd></div>
        <div><dt>Porcentaje Premium aplicado</dt><dd>{(datos.porcentajeCentesimas / 100).toLocaleString('es-CL')}%</dd></div>
        <div><dt>Recargo Premium</dt><dd>{dinero(datos.recargo)}</dd></div>
        <div><dt>Total del evento</dt><dd className="kits-exito">{dinero(datos.montoTotal)}</dd></div>
      </dl>
      {editable && <form onSubmit={guardar}>
        <label htmlFor="kit-evento">Kit del evento</label>
        <select id="kit-evento" disabled={bloqueado || ocupado} value={kitId} onChange={e => { setKitId(e.target.value); setMensaje(''); }}>
          <option value="">Sin kit / Desasignar</option>
          {kits.map(k => <option key={k.id} value={k.id} disabled={!k.disponible && k.evento_ocupante_id !== eventoId}>
            {k.nombre} · {k.premium ? 'Premium' : 'Normal'}{!k.disponible && k.evento_ocupante_id !== eventoId ? ' · Ocupado' : ''}
          </option>)}
        </select>
        {!kits.length && <p>No hay kits registrados. Registra un kit y recarga el evento.</p>}
        <p>El recargo definitivo se calcula al guardar. Volver a guardar el mismo kit conserva el porcentaje aplicado.</p>
        <button type="submit" disabled={bloqueado || ocupado}>{ocupado ? 'Guardando…' : 'Guardar kit'}</button>
        {bloqueado && <p>El evento está finalizado. Su kit y sus importes no se pueden modificar.</p>}
      </form>}
    </>}
  </div>;
}
